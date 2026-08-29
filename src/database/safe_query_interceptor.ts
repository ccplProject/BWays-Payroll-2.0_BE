import { EntityManager, EntityMetadata, EntityTarget } from 'typeorm';
import * as config from '../config/config.config';

/**
 * Checks whether DB column checking is enabled in src/config/config.config.ts (__SAFE_DB_COLUMN_CHECK)
 */
export function isCheckDbColumnsEnabled(): boolean {
    return Boolean((config as any).__SAFE_DB_COLUMN_CHECK);
}

// Cache structure: "DB_NAME:TABLE_NAME" -> Set of column names in UPPERCASE
const tableColumnsCache = new Map<string, Promise<Set<string>> | Set<string>>();

/**
 * Returns a set of column names (all UPPERCASE) currently existing in the database for the given table.
 * Results are cached in-memory per database connection to ensure zero performance overhead after first lookup.
 */
export async function getExistingTableColumns(
    manager: EntityManager,
    tableName: string
): Promise<Set<string>> {
    let rawDbName = (manager.connection?.options as any)?.database;
    const cleanTableName = tableName.replace(/[[\]"]/g, '').toUpperCase();

    if (!rawDbName) {
        try {
            const dbRes = await manager.query('SELECT DB_NAME() AS dbName');
            const flatDb = Array.isArray(dbRes?.[0]) ? dbRes[0][0] : dbRes?.[0];
            rawDbName = flatDb?.dbName || 'DEFAULT';
        } catch {
            rawDbName = 'DEFAULT';
        }
    }

    const dbName = String(rawDbName).toUpperCase();
    const cacheKey = `${dbName}:${cleanTableName}`;

    if (tableColumnsCache.has(cacheKey)) {
        const cached = tableColumnsCache.get(cacheKey)!;
        return cached instanceof Promise ? await cached : cached;
    }

    const fetchPromise = (async () => {
        try {
            // First attempt: INFORMATION_SCHEMA.COLUMNS
            const rows = await manager.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @0`,
                [cleanTableName]
            );

            // MSSQL query results can be nested as [ [records], count ]
            const flatRows = (Array.isArray(rows) && Array.isArray(rows[0])) ? rows[0] : (Array.isArray(rows) ? rows : []);
            const colSet = new Set<string>();

            for (const row of flatRows) {
                if (row && row.COLUMN_NAME) {
                    colSet.add(String(row.COLUMN_NAME).toUpperCase());
                }
            }

            // Fallback attempt via sys.columns if INFORMATION_SCHEMA returned empty
            if (colSet.size === 0) {
                const sysRows = await manager.query(
                    `SELECT c.name AS COLUMN_NAME FROM sys.columns c WHERE c.object_id = OBJECT_ID(@0)`,
                    [cleanTableName]
                );
                const flatSys = (Array.isArray(sysRows) && Array.isArray(sysRows[0])) ? sysRows[0] : (Array.isArray(sysRows) ? sysRows : []);
                for (const row of flatSys) {
                    if (row && row.COLUMN_NAME) {
                        colSet.add(String(row.COLUMN_NAME).toUpperCase());
                    }
                }
            }

            if (colSet.size > 0) {
                console.log(`\x1b[36m[SafeDb] Discovered ${colSet.size} columns for [${cleanTableName}] in DB [${dbName}]\x1b[0m`);
            } else {
                console.warn(`\x1b[33m[SafeDb] No columns discovered for [${cleanTableName}] in DB [${dbName}]\x1b[0m`);
            }

            tableColumnsCache.set(cacheKey, colSet);
            return colSet;
        } catch (err: any) {
            tableColumnsCache.delete(cacheKey);
            console.warn(`\x1b[31m[SafeDb] Failed to read columns for [${cleanTableName}] in DB [${dbName}]: ${err?.message}\x1b[0m`);
            return new Set<string>();
        }
    })();

    tableColumnsCache.set(cacheKey, fetchPromise);
    return await fetchPromise;
}

/**
 * Clears the in-memory cache for all or a specific table.
 */
export function clearTableColumnsCache(key?: string) {
    if (key) {
        tableColumnsCache.delete(key.toUpperCase());
    } else {
        tableColumnsCache.clear();
    }
}

let isPatched = false;

/**
 * Applies the global TypeORM patch for safe inserts and updates.
 * Any column defined in an entity that does not exist in the connected database will be safely omitted
 * instead of causing SQL Server "Invalid column name" errors.
 */
export function applySafeTypeOrmPatch() {
    if (isPatched) {
        return;
    }
    isPatched = true;

    const originalInsert = EntityManager.prototype.insert;
    const originalUpdate = EntityManager.prototype.update;

    // Global patch for manager.insert() and repository.insert()
    EntityManager.prototype.insert = async function (
        target: EntityTarget<any>,
        entity: any
    ): Promise<any> {
        if (!isCheckDbColumnsEnabled() || !entity || (Array.isArray(entity) && entity.length === 0)) {
            return originalInsert.call(this, target, entity);
        }

        try {
            let metadata: EntityMetadata | undefined;
            try {
                metadata = this.connection.getMetadata(target);
            } catch {
                metadata = undefined;
            }

            const tableName = metadata?.tableName || (typeof target === 'string' ? target : null);

            if (tableName) {
                const dbColumns = await getExistingTableColumns(this, tableName);

                if (dbColumns && dbColumns.size > 0) {
                    if (metadata) {
                        // Filter entity properties: only keep properties whose underlying DB column actually exists in this client's DB
                        const validProperties: string[] = [];
                        const omittedColumns: string[] = [];

                        for (const col of metadata.columns) {
                            const dbColName = col.databaseName.toUpperCase();
                            if (dbColumns.has(dbColName)) {
                                validProperties.push(col.propertyPath);
                            } else {
                                omittedColumns.push(col.databaseName);
                            }
                        }

                        if (omittedColumns.length > 0) {
                            console.log(
                                `\x1b[33m[SafeInsert] [${tableName}] Omitted ${omittedColumns.length} missing column(s): ${omittedColumns.join(', ')}\x1b[0m`
                            );
                        }

                        if (validProperties.length > 0) {
                            // updateEntity(false) is critical for MSSQL to avoid generating
                            // OUTPUT INSERTED."non_existent_column" INTO @OutputTable
                            return await this.createQueryBuilder()
                                .insert()
                                .into(target, validProperties)
                                .values(entity)
                                .updateEntity(false)
                                .execute();
                        }
                    } else if (typeof target === 'string') {
                        // Raw table name without entity metadata
                        const sample = Array.isArray(entity) ? entity[0] : entity;
                        if (sample && typeof sample === 'object') {
                            const validColumns = Object.keys(sample).filter(col =>
                                dbColumns.has(col.toUpperCase())
                            );

                            if (validColumns.length > 0) {
                                return await this.createQueryBuilder()
                                    .insert()
                                    .into(target, validColumns)
                                    .values(entity)
                                    .updateEntity(false)
                                    .execute();
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            console.warn(
                `\x1b[31m[SafeInsert] Interceptor error for [${typeof target === 'string' ? target : (target as any)?.name}]: ${err?.message}. Falling back to default insert.\x1b[0m`
            );
        }

        return originalInsert.call(this, target, entity);
    };

    // Global patch for manager.update() and repository.update()
    EntityManager.prototype.update = async function (
        target: EntityTarget<any>,
        criteria: any,
        partialEntity: any,
        options?: any
    ): Promise<any> {
        if (!isCheckDbColumnsEnabled() || !partialEntity || typeof partialEntity !== 'object') {
            return originalUpdate.call(this, target, criteria, partialEntity, options);
        }

        try {
            let metadata: EntityMetadata | undefined;
            try {
                metadata = this.connection.getMetadata(target);
            } catch {
                metadata = undefined;
            }

            const tableName = metadata?.tableName || (typeof target === 'string' ? target : null);

            if (tableName) {
                const dbColumns = await getExistingTableColumns(this, tableName);

                if (dbColumns && dbColumns.size > 0) {
                    const sanitizedPayload: Record<string, any> = {};
                    const omittedColumns: string[] = [];

                    for (const [key, value] of Object.entries(partialEntity)) {
                        let dbColName = key;
                        if (metadata) {
                            const col = metadata.findColumnWithPropertyName(key);
                            if (col) {
                                dbColName = col.databaseName;
                            }
                        }

                        if (dbColumns.has(dbColName.toUpperCase())) {
                            sanitizedPayload[key] = value;
                        } else {
                            omittedColumns.push(key);
                        }
                    }

                    if (omittedColumns.length > 0) {
                        console.log(
                            `\x1b[33m[SafeUpdate] [${tableName}] Omitted missing column(s): ${omittedColumns.join(', ')}\x1b[0m`
                        );
                    }

                    return await originalUpdate.call(this, target, criteria, sanitizedPayload, options);
                }
            }
        } catch (err: any) {
            console.warn(
                `\x1b[31m[SafeUpdate] Interceptor error for [${typeof target === 'string' ? target : (target as any)?.name}]: ${err?.message}. Falling back to default update.\x1b[0m`
            );
        }

        return originalUpdate.call(this, target, criteria, partialEntity, options);
    };

    if (isCheckDbColumnsEnabled()) {
        console.log('\x1b[32m[SafeDb] TypeORM Global Safe Insert & Update Interceptor successfully activated (__SAFE_DB_COLUMN_CHECK: true).\x1b[0m');
    } else {
        console.log('\x1b[33m[SafeDb] Safe Insert & Update Interceptor loaded but DISABLED (__SAFE_DB_COLUMN_CHECK: false in config).\x1b[0m');
    }
}
