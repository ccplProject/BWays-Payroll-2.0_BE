import { DataSource, Logger as TypeOrmLogger, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { getCompanyId, getCompanyUnique } from './context';
import { APP_ENTITIES } from './entities';
import { applySafeTypeOrmPatch } from './safe_query_interceptor';

applySafeTypeOrmPatch();

export class CustomDbLogger implements TypeOrmLogger {
    constructor(
        private connectionInfo: string,
        private siteConfigKey: string
    ) {}

    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        console.log(`\x1b[36m[Site: ${this.siteConfigKey}] [DB: ${this.connectionInfo}]\x1b[0m query: ${query}`);
        if (parameters && parameters.length) {
            console.log(`\x1b[36m[Site: ${this.siteConfigKey}] [DB: ${this.connectionInfo}]\x1b[0m parameters: ${JSON.stringify(parameters)}`);
        }
    }

    logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        console.error(`\x1b[31m[Site: ${this.siteConfigKey}] [DB: ${this.connectionInfo}] Error: ${error}\x1b[0m`);
        console.error(`\x1b[31m[Site: ${this.siteConfigKey}] [DB: ${this.connectionInfo}] query: ${query}\x1b[0m`);
        if (parameters && parameters.length) {
            console.error(`\x1b[31m[Site: ${this.siteConfigKey}] [DB: ${this.connectionInfo}] parameters: ${JSON.stringify(parameters)}\x1b[0m`);
        }
    }

    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        console.warn(`\x1b[33m[Site: ${this.siteConfigKey}] [DB: ${this.connectionInfo}] Slow Query (${time}ms): ${query}\x1b[0m`);
    }

    logSchemaBuild(message: string, queryRunner?: QueryRunner) {}

    logMigration(message: string, queryRunner?: QueryRunner) {}

    log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {}
}

// Caches for dynamic DataSource connections
const userDataSourceCache = new Map<string, DataSource>();
const companyDataSourceCache = new Map<string, DataSource>();

// Reference to standard/default configurations established on bootstrap
let defaultDbSource: DataSource;
let defaultUserDbSource: DataSource;

export const setDefaultDbSource = (db: DataSource) => {
    defaultDbSource = db;
};

export const setDefaultUserDbSource = (userDb: DataSource) => {
    defaultUserDbSource = userDb;
};

const getUserConfig = (uniqueKey: string | null): any => {
    if (!uniqueKey) return null;

    try {
        const configPath = path.join(process.cwd(), 'site.config.js');
        if (fs.existsSync(configPath)) {
            // Delete cache to reload config if changed
            delete require.cache[require.resolve(configPath)];
            const siteConfig = require(configPath);
            const envConfig = siteConfig[uniqueKey.toUpperCase()];

            if (envConfig && envConfig.private && envConfig.private.DATABASE) {
                const db = envConfig.private.DATABASE;
                console.log(`\x1b[32m%s\x1b[0m`, `[UserDB] Loading config for [${uniqueKey}] from site.config.js -> Server: ${db.USER_DB_SERVER}`);
                return {
                    host: db.USER_DB_SERVER,
                    port: Number(db.USER_DB_PORT) || 1433,
                    username: db.USER_DB_USER,
                    password: db.USER_DB_PASSWORD,
                    database: db.USER_DB,
                };
            } else {
                console.warn(`[UserDB] Key [${uniqueKey}] found in site.config.js but 'private.DATABASE' section is missing.`);
            }
        } else {
            console.error(`[UserDB] site.config.js not found at: ${configPath}`);
        }
    } catch (error) {
        console.error(`Error reading site.config.js for uniqueKey ${uniqueKey}:`, error);
    }
    return null;
};

export const getUserDataSource = async (uniqueKey: string | null): Promise<DataSource> => {
    if (!uniqueKey) {
        return defaultUserDbSource;
    }
    const key = uniqueKey.toUpperCase();

    if (userDataSourceCache.has(key)) {
        const cached = userDataSourceCache.get(key);
        if (cached && cached.isInitialized) return cached;
        userDataSourceCache.delete(key);
    }

    const userConfig = getUserConfig(uniqueKey);
    if (!userConfig) {
        console.warn(`[UserDB] Config not found for [${uniqueKey}]. Falling back to default user database.`);
        return defaultUserDbSource;
    }

    const ds = new DataSource({
        type: 'mssql',
        host: userConfig.host,
        port: userConfig.port,
        username: userConfig.username,
        password: userConfig.password,
        database: userConfig.database,
        synchronize: false,
        options: {
            encrypt: false,
            trustServerCertificate: true,
        },
        logger: new CustomDbLogger(`${userConfig.host}:${userConfig.port}/${userConfig.database}`, uniqueKey || 'DEFAULT'),
        logging: true,
    });

    console.log(`\x1b[32m[UserDB] Connecting to database: ${userConfig.database} (UniqueKey: ${uniqueKey}) at ${userConfig.host}:${userConfig.port}...\x1b[0m`);
    await ds.initialize();
    console.log(`\x1b[32m[UserDB] Successfully connected to database: ${userConfig.database} (UniqueKey: ${uniqueKey})\x1b[0m`);
    userDataSourceCache.set(key, ds);
    return ds;
};

export const getCompanyDataSource = async (
    companyUnique: string | null,
    companyId: string | number | null
): Promise<DataSource> => {
    if (!companyId || !companyUnique) {
        return defaultDbSource;
    }

    const cacheKey = `${companyUnique.toUpperCase()}_${companyId}`;

    if (companyDataSourceCache.has(cacheKey)) {
        const cached = companyDataSourceCache.get(cacheKey);
        if (cached && cached.isInitialized) return cached;
        companyDataSourceCache.delete(cacheKey);
    }

    try {
        const userDS = await getUserDataSource(companyUnique);
        
        // CNFCOMPANYLIST contains the target company DB info
        const result = await userDS.query(
            `SELECT ERP_DATABASE, IP_ADDRESS, DBUSER_ID, DBUSER_PASSWORD FROM CNFCOMPANYLIST WHERE COMPANY_ID = @0`,
            [companyId]
        );

        if (!result || result.length === 0) {
            console.warn(`[CompanyDB] No DB config found for Company ID: ${companyId} in UserDB. Falling back to default.`);
            return defaultDbSource;
        }

        const dbInfo = result[0];
        const ipParts = (dbInfo.IP_ADDRESS || '').split(',');
        const host = ipParts[0] || 'localhost';
        const port = Number(ipParts[1]) || 1433;

        const ds = new DataSource({
            type: 'mssql',
            host: host,
            port: port,
            username: dbInfo.DBUSER_ID,
            password: dbInfo.DBUSER_PASSWORD,
            database: dbInfo.ERP_DATABASE,
            entities: APP_ENTITIES,
            synchronize: false,
            options: {
                encrypt: false,
                trustServerCertificate: true,
            },
            logger: new CustomDbLogger(`${host}:${port}/${dbInfo.ERP_DATABASE}`, companyUnique || 'DEFAULT'),
            logging: true,
        });

        console.log(`\x1b[32m[CompanyDB] Connecting to database: ${dbInfo.ERP_DATABASE} (CompanyUnique: ${companyUnique}, CompanyID: ${companyId}) at ${host}:${port}...\x1b[0m`);
        await ds.initialize();
        console.log(`\x1b[32m[CompanyDB] Successfully connected to database: ${dbInfo.ERP_DATABASE} (CompanyUnique: ${companyUnique}, CompanyID: ${companyId})\x1b[0m`);
        companyDataSourceCache.set(cacheKey, ds);
        return ds;
    } catch (error) {
        console.error(`[CompanyDB] Error connecting to dynamic DB for company ${companyId} (${companyUnique}):`, error);
        return defaultDbSource;
    }
};

export const getCachedUserDataSource = (companyUnique: string): DataSource | undefined => {
    const key = companyUnique.toUpperCase();
    const cached = userDataSourceCache.get(key);
    if (cached && cached.isInitialized) return cached;
    return undefined;
};

export const getCachedCompanyDataSource = (companyUnique: string, companyId: string | number): DataSource | undefined => {
    const cacheKey = `${companyUnique.toUpperCase()}_${companyId}`;
    const cached = companyDataSourceCache.get(cacheKey);
    if (cached && cached.isInitialized) return cached;
    return undefined;
};

export const warmUpConnections = async (companyUnique: string, companyId: string | number) => {
    const userDS = await getUserDataSource(companyUnique);
    await getCompanyDataSource(companyUnique, companyId);
};

export const createDataSourceProxy = (defaultDS: DataSource, isUserConnection: boolean): DataSource => {
    return new Proxy(defaultDS, {
        get(target, prop, receiver) {
            const companyUnique = getCompanyUnique();
            const companyId = getCompanyId();

            if (isUserConnection) {
                if (companyUnique) {
                    const cachedUserDS = getCachedUserDataSource(companyUnique);
                    if (cachedUserDS) {
                        const value = Reflect.get(cachedUserDS, prop);
                        if (typeof value === 'function') {
                            return value.bind(cachedUserDS);
                        }
                        return value;
                    } else {
                        // Fallback for async query calls
                        if (prop === 'query') {
                            return async (...args: any[]) => {
                                const userDS = await getUserDataSource(companyUnique);
                                return (userDS as any).query(...args);
                            };
                        }
                    }
                }
            } else {
                if (companyUnique && companyId) {
                    const cachedCompanyDS = getCachedCompanyDataSource(companyUnique, companyId);
                    if (cachedCompanyDS) {
                        const value = Reflect.get(cachedCompanyDS, prop);
                        if (typeof value === 'function') {
                            return value.bind(cachedCompanyDS);
                        }
                        return value;
                    } else {
                        // Fallback for async query calls
                        if (prop === 'query') {
                            return async (...args: any[]) => {
                                const companyDS = await getCompanyDataSource(companyUnique, companyId);
                                return (companyDS as any).query(...args);
                            };
                        }
                    }
                }
            }

            // Default fallback
            const value = Reflect.get(target, prop);
            if (typeof value === 'function') {
                return value.bind(target);
            }
            return value;
        }
    }) as any;
};
