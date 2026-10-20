import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { getCompanyId } from '../database/context';

// ==========================================
// METADATA INTERFACES (Schema Discovery)
// ==========================================
export interface DatabaseEntityMetadata {
  name: string;
  schema: string;
  type: 'table' | 'view' | 'stored_procedure';
  friendlyName?: string;
  category?: string;
  description?: string;
}

export interface EntityColumnMetadata {
  field: string;
  label: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  sqlType?: string;
}

export interface ProcedureParameterMetadata {
  name: string;
  friendlyLabel?: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  sqlType?: string;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
}

// ==========================================
// REPORT DEFINITION INTERFACES (Reports Management)
// ==========================================
export interface StoredReport {
  id: string;
  name: string | null;
  description: string | null;
  version: number | null;
  statusCode: number | null;
  definitionJson: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface ReportSummaryDto {
  id: string;
  name: string;
  description?: string;
  category?: string;
  version?: number;
  isPublished?: boolean;
  slug?: string;
  menuGroup?: string;
  menuOrder?: number;
  icon?: string;
  updatedAt?: string;
}

export interface SaveReportDto {
  id: string;
  name: string;
  description?: string;
  category?: string;
  version?: number;
  isPublished?: boolean;
  createOnly?: boolean;
  expectedVersion?: number;
  definition?: Record<string, unknown>;
  userLogin?: string;
  [key: string]: any;
}

// ==========================================
// LOOKUP INTERFACES
// ==========================================
export interface LookupOptionResponseDto {
  value: any;
  label: string;
  raw?: any;
}

export interface LookupQueryDto {
  entityName: string;
  schema?: string;
  sourceType?: 'table' | 'view' | 'stored_procedure' | 'procedure';
  valueField?: string;
  displayField?: string;
  filter?: any;
  parameters?: Record<string, any>;
  limit?: number;
}

// ==========================================
// EXECUTION INTERFACES
// ==========================================
export interface ExecuteReportDto {
  name?: string;
  kind?: string;
  schema?: string;
  dataSource?: {
    id?: string;
    type?: string;
    sourceType?: string;
    name?: string;
    schema?: string;
    query?: string;
  };
  parameters?: Record<string, any>;
  sessionContext?: Record<string, any>;
  columns?: string[];
  filter?: any;
  top?: number;
  [key: string]: any;
}

// ==========================================
// REPORT SQL & HELPER CONSTANTS
// ==========================================
function asIsoDate(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const compact = typeof value === 'string' && /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/.exec(value);
  const parsed = compact
    ? new Date(+compact[1], +compact[2] - 1, +compact[3], +compact[4], +compact[5], +compact[6], +(compact[7] || 0) * 10)
    : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : undefined;
}

const REPORT_COLUMNS = `CODE AS id, NAME AS name, DESCRIPTION AS description,
  VERSION AS version, STATUS_CODE AS statusCode, DEFJSON AS definitionJson,
  SYSADD_DATETIME AS createdAt, SYSCHNG_DATETIME AS updatedAt,
  SYSADD_LOGIN AS createdBy, SYSCHNG_LOGIN AS updatedBy`;

// UTypeDateTime can be an ERP varchar(16), or a native datetime alias.
const REPORT_AUDIT_SQL = `
  DECLARE @now datetime = GETDATE();
  DECLARE @auditText varchar(16);
  SET @auditText = CONVERT(char(8), @now, 112) + REPLACE(CONVERT(char(8), @now, 108), ':', '')
    + RIGHT('0' + CONVERT(varchar(2), DATEPART(millisecond, @now) / 10), 2);
  DECLARE @createdAtValue nvarchar(23), @updatedAtValue nvarchar(23);
  SELECT @createdAtValue = CASE WHEN system_type_id IN (167, 175, 231, 239)
    THEN @auditText ELSE CONVERT(varchar(23), @now, 121) END
    FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CNFREPORTDEF') AND name = N'SYSADD_DATETIME';
  SELECT @updatedAtValue = CASE WHEN system_type_id IN (167, 175, 231, 239)
    THEN @auditText ELSE CONVERT(varchar(23), @now, 121) END
    FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CNFREPORTDEF') AND name = N'SYSCHNG_DATETIME';
`;

function validateStorageSql(fields: [string, string][]): string {
  const values = fields.map(([column, parameter]) => `(N'${column}', CONVERT(nvarchar(max), ${parameter}))`).join(',');
  return `
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CNFREPORTDEF')
      AND name = N'DEFJSON' AND (system_type_id <> 231 OR max_length <> -1))
    BEGIN
      RAISERROR(N'Report storage: DEFJSON must be nvarchar(max). Run upgrade-report-json-storage.sql in this company database.', 16, 1);
      RETURN;
    END;
    DECLARE @invalidColumn nvarchar(128), @columnLimit int, @validationMessage nvarchar(2048);
    SELECT TOP (1) @invalidColumn = c.name,
      @columnLimit = CASE WHEN c.system_type_id IN (231, 239) THEN c.max_length / 2 ELSE c.max_length END
    FROM sys.columns AS c
    JOIN (VALUES ${values}) AS supplied(columnName, fieldValue) ON supplied.columnName = c.name
    WHERE c.object_id = OBJECT_ID(N'dbo.CNFREPORTDEF') AND c.max_length <> -1
      AND c.system_type_id IN (167, 175, 231, 239)
      AND CASE WHEN c.system_type_id IN (167, 175) THEN DATALENGTH(CONVERT(varchar(max), supplied.fieldValue))
        ELSE DATALENGTH(supplied.fieldValue) END > c.max_length;
    IF @invalidColumn IS NOT NULL
    BEGIN
      SET @validationMessage = CASE WHEN @invalidColumn LIKE N'SYS%'
        THEN N'Report storage: ' ELSE N'Report validation: ' END
        + @invalidColumn + N' allows at most ' + CONVERT(nvarchar(10), @columnLimit)
        + N' characters. Shorten the value or widen this column in CNFREPORTDEF.';
      RAISERROR(@validationMessage, 16, 1);
      RETURN;
    END;
  `;
}

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);

  private readonly lookupCache = new Map<string, { expiresAt: number; data: LookupOptionResponseDto[] }>();

  private readonly knownProcedureColumns: Record<string, EntityColumnMetadata[]> = {
    sel_outstandingdetails: [
      { field: 'COMPUNIT_ID', label: 'Unit ID', dataType: 'number', nullable: true, sqlType: 'INT' },
      { field: 'SUB_GLACNO', label: 'Account No', dataType: 'number', nullable: false, sqlType: 'BIGINT' },
      { field: 'SUBGL_NAME', label: 'Customer / Party Name', dataType: 'string', nullable: false, sqlType: 'VARCHAR(250)' },
      { field: 'REF_TRANNO', label: 'Ref Bill / Doc No', dataType: 'string', nullable: true, sqlType: 'VARCHAR(50)' },
      { field: 'BILL_TYPE', label: 'Bill Type', dataType: 'string', nullable: true, sqlType: 'VARCHAR(50)' },
      { field: 'PRN_TRANDATE', label: 'Bill Date', dataType: 'string', nullable: true, sqlType: 'VARCHAR(10)' },
      { field: 'PRN_DUEDATE', label: 'Due Date', dataType: 'string', nullable: true, sqlType: 'VARCHAR(10)' },
      { field: 'DOC_AMOUNT', label: 'Doc Amount', dataType: 'number', nullable: true, sqlType: 'DECIMAL(18,2)' },
      { field: 'DUE_DAYS', label: 'Due Days', dataType: 'number', nullable: true, sqlType: 'INT' },
      { field: 'DUE_DATE_DAYS', label: 'Overdue Days', dataType: 'number', nullable: true, sqlType: 'INT' },
      { field: 'AMOUNT', label: 'Outstanding Amount', dataType: 'number', nullable: true, sqlType: 'DECIMAL(18,2)' },
      { field: 'OSAmount', label: 'Net O/S Amount', dataType: 'number', nullable: true, sqlType: 'DECIMAL(18,2)' },
      { field: 'RCPT_NEWREF_DRCR', label: 'Dr / Cr', dataType: 'string', nullable: true, sqlType: 'VARCHAR(2)' },
      { field: 'LEDGER_AMT', label: 'Ledger Balance', dataType: 'number', nullable: true, sqlType: 'DECIMAL(18,2)' },
      { field: 'CITY_NAME', label: 'City', dataType: 'string', nullable: true, sqlType: 'VARCHAR(100)' },
      { field: 'EXT_REFNO', label: 'Party Ref No', dataType: 'string', nullable: true, sqlType: 'VARCHAR(100)' },
      { field: 'PRN_EXTREFDATE', label: 'Party Ref Date', dataType: 'string', nullable: true, sqlType: 'VARCHAR(10)' },
      { field: 'CREDIT_DAYS', label: 'Credit Days', dataType: 'number', nullable: true, sqlType: 'INT' },
      { field: 'SUB_GLCODE', label: 'GL Code', dataType: 'number', nullable: true, sqlType: 'INT' },
      { field: 'INV_AMOUNT', label: 'Invoice Total', dataType: 'number', nullable: true, sqlType: 'DECIMAL(18,2)' },
      { field: 'AGESLAB', label: 'Ageing Slab', dataType: 'number', nullable: true, sqlType: 'INT' },
      { field: 'ADDRESS1', label: 'Address 1', dataType: 'string', nullable: true, sqlType: 'VARCHAR(250)' },
      { field: 'PINCODE', label: 'Pincode', dataType: 'string', nullable: true, sqlType: 'VARCHAR(20)' },
      { field: 'TRAN_NO', label: 'Transaction No', dataType: 'number', nullable: false, sqlType: 'BIGINT' },
      { field: 'TRAN_DATE', label: 'Transaction Date', dataType: 'string', nullable: true, sqlType: 'VARCHAR(8)' },
      { field: 'DUE_DATE', label: 'Due Date', dataType: 'string', nullable: true, sqlType: 'VARCHAR(8)' },
      { field: 'SORT_TYPE', label: 'Sort Type', dataType: 'number', nullable: true, sqlType: 'INT' },
      { field: 'STATUS_CODE', label: 'Status Code', dataType: 'number', nullable: true, sqlType: 'INT' },
    ],
    sel_outstandingsummary: [
      { field: 'SUB_GLACNO', label: 'Account No', dataType: 'number', nullable: false, sqlType: 'BIGINT' },
      { field: 'SUBGL_NAME', label: 'Customer / Party Name', dataType: 'string', nullable: false, sqlType: 'VARCHAR(250)' },
      { field: 'AMOUNT', label: 'Outstanding Amount', dataType: 'number', nullable: true, sqlType: 'DECIMAL(18,2)' },
      { field: 'DR_CR', label: 'Dr / Cr', dataType: 'string', nullable: true, sqlType: 'VARCHAR(2)' },
      { field: 'SUB_GLCODE', label: 'GL Code', dataType: 'number', nullable: true, sqlType: 'INT' },
    ],
  };

  constructor(
    private readonly dataSource: DataSource,
    @InjectDataSource('userConnection') private readonly userDataSource: DataSource,
  ) { }

  private requireCompanyDatabase(): void {
    if (!this.dataSource?.isInitialized) {
      throw new ServiceUnavailableException('Database is unavailable.');
    }
  }

  private requireUserDatabase(): void {
    if (!this.userDataSource?.isInitialized) {
      throw new ServiceUnavailableException('Report storage (user database) is unavailable.');
    }
  }

  /**
   * Helper to execute stored procedures using MSSQL master pool
   */
  private async executeStoredProcedure(
    spName: string,
    params: Record<string, any>,
    schema = 'dbo',
  ): Promise<any> {
    try {
      const driver = this.dataSource.driver as any;
      const pool = driver?.master;

      if (!pool || typeof pool.request !== 'function') {
        this.logger.warn(`MSSQL master pool not found. Falling back to dataSource.query.`);
        const entries = Object.entries(params);
        const sql = entries.length > 0
          ? `EXEC [${schema}].[${spName}] ${entries.map(([k], i) => `@${k} = @${i}`).join(', ')}`
          : `EXEC [${schema}].[${spName}]`;
        return await this.dataSource.query(sql, entries.map(([, v]) => v));
      }

      const request = pool.request();
      for (const [key, val] of Object.entries(params)) {
        request.input(key, val);
      }

      const fullName = `[${schema}].[${spName}]`;
      const result = await request.execute(fullName);
      return result.recordset || (result.recordsets && result.recordsets[0]) || [];
    } catch (error: any) {
      this.logger.error(`Error executing SP ${spName}: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // SCHEMA DISCOVERY METHODS (Company Database)
  // ==========================================
  async getEntities(types?: string[]): Promise<DatabaseEntityMetadata[]> {
    this.requireCompanyDatabase();

    try {
      const includeTables = !types || types.length === 0 || types.includes('table') || types.includes('view');
      const includeProcs = !types || types.length === 0 || types.includes('stored_procedure') || types.includes('procedure');

      const queries: string[] = [];

      if (includeTables) {
        queries.push(`
          SELECT
            TABLE_NAME as name,
            TABLE_SCHEMA as [schema],
            CASE WHEN TABLE_TYPE = 'VIEW' THEN 'view' ELSE 'table' END as [type],
            TABLE_NAME as friendlyName,
            'Tables & Views' as category,
            '' as [description]
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA NOT IN ('sys', 'INFORMATION_SCHEMA')
        `);
      }

      if (includeProcs) {
        queries.push(`
          SELECT
            ROUTINE_NAME as name,
            ROUTINE_SCHEMA as [schema],
            'stored_procedure' as [type],
            ROUTINE_NAME as friendlyName,
            'Stored Procedures' as category,
            '' as [description]
          FROM INFORMATION_SCHEMA.ROUTINES
          WHERE ROUTINE_TYPE = 'PROCEDURE' 
            AND ROUTINE_SCHEMA NOT IN ('sys', 'INFORMATION_SCHEMA')
        `);
      }

      const sql = queries.join(' UNION ALL ') + ' ORDER BY [type], [schema], name;';
      const rows = await this.dataSource.query(sql);
      const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
      const mapped = flatRows.map((r: any) => ({
        name: r.name,
        schema: r.schema,
        type: r.type,
        friendlyName: r.friendlyName,
        category: r.category,
        description: r.description,
      }));

      if (types && types.length > 0) {
        const normalizedTypes = types.map((t) => (t === 'procedure' ? 'stored_procedure' : t));
        return mapped.filter((e: any) => normalizedTypes.includes(e.type));
      }
      return mapped;
    } catch (err: any) {
      this.logger.warn(`Failed to read SQL Server entities, discovery failed: ${err.message}`);
      throw new ServiceUnavailableException('Schema discovery database is unavailable.');
    }
  }

  async getColumns(entityName: string, schema = 'dbo', type?: string): Promise<EntityColumnMetadata[]> {
    const cleanLower = entityName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (this.knownProcedureColumns[cleanLower]) {
      return this.knownProcedureColumns[cleanLower];
    }

    this.requireCompanyDatabase();

    try {
      const isProc = type === 'stored_procedure' || type === 'procedure';

      if (isProc) {
        const fullName = `[${schema}].[${entityName}]`;
        const procSql = `
          SELECT 
            name as [field],
            name as [label],
            system_type_name as sqlType,
            CASE WHEN is_nullable = 1 THEN 1 ELSE 0 END as nullable
          FROM sys.dm_exec_describe_first_result_set_for_object(OBJECT_ID(@0), 0)
          WHERE name IS NOT NULL
          ORDER BY column_ordinal;
        `;
        const procRows = await this.dataSource.query(procSql, [fullName]);
        const flatProcRows = (Array.isArray(procRows[0]) ? procRows[0] : procRows) || [];
        if (flatProcRows && flatProcRows.length > 0) {
          return flatProcRows.map((r: any) => ({
            field: r.field,
            label: r.label,
            sqlType: r.sqlType,
            nullable: Boolean(r.nullable),
            dataType: this.mapSqlTypeToDataType(r.sqlType),
          }));
        }
      }

      const sql = `
        SELECT
          COLUMN_NAME as [field],
          COLUMN_NAME as [label],
          DATA_TYPE as sqlType,
          CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as nullable
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @0 AND TABLE_SCHEMA = @1
        ORDER BY ORDINAL_POSITION;
      `;
      const rows = await this.dataSource.query(sql, [entityName, schema]);
      const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];

      return flatRows.map((r: any) => ({
        field: r.field,
        label: r.label,
        sqlType: r.sqlType,
        nullable: Boolean(r.nullable),
        dataType: this.mapSqlTypeToDataType(r.sqlType),
      }));
    } catch (err: any) {
      this.logger.warn(`Failed to read SQL Server columns for ${entityName}: ${err.message}`);
      throw new ServiceUnavailableException('Schema discovery failed.');
    }
  }

  async getParameters(entityName: string, schema = 'dbo'): Promise<ProcedureParameterMetadata[]> {
    this.requireCompanyDatabase();

    try {
      const fullName = `[${schema}].[${entityName}]`;
      const sql = `
        SELECT
          p.name as [name],
          SUBSTRING(p.name, 2, LEN(p.name)) as friendlyLabel,
          TYPE_NAME(p.user_type_id) as sqlType,
          CASE WHEN p.is_output = 1 THEN 0 ELSE 0 END as required,
          p.default_value as defaultValue
        FROM sys.parameters p
        WHERE p.object_id = OBJECT_ID(@0)
        ORDER BY p.parameter_id;
      `;
      const rows = await this.dataSource.query(sql, [fullName]);
      const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];

      return flatRows.map((r: any) => ({
        name: r.name,
        friendlyLabel: r.friendlyLabel,
        sqlType: r.sqlType,
        required: Boolean(r.required),
        defaultValue: r.defaultValue,
        dataType: this.mapSqlTypeToDataType(r.sqlType),
      }));
    } catch (err: any) {
      this.logger.warn(`Failed to read SQL Server parameters for ${entityName}: ${err.message}`);
      throw new ServiceUnavailableException('Schema discovery failed.');
    }
  }

  private mapSqlTypeToDataType(sqlType: string): 'string' | 'number' | 'date' | 'boolean' {
    const lower = (sqlType || '').toLowerCase();
    if (['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money', 'smallmoney'].includes(lower)) {
      return 'number';
    }
    if (['bit'].includes(lower)) {
      return 'boolean';
    }
    if (['date', 'datetime', 'datetime2', 'smalldatetime', 'datetimeoffset', 'time'].includes(lower)) {
      return 'date';
    }
    return 'string';
  }

  async getProcedures(): Promise<Array<{ name: string; schema: string; parameters: ProcedureParameterMetadata[] }>> {
    const procs = await this.getEntities(['stored_procedure']);
    return Promise.all(
      procs.map(async (p) => {
        const parameters = await this.getParameters(p.name, p.schema);
        return {
          name: p.name,
          schema: p.schema,
          parameters,
        };
      })
    );
  }

  async getTables(): Promise<Array<{ name: string; schema: string; type: string; columns: EntityColumnMetadata[] }>> {
    const tables = await this.getEntities(['table', 'view']);
    return Promise.all(
      tables.map(async (t) => {
        const columns = await this.getColumns(t.name, t.schema, t.type);
        return {
          name: t.name,
          schema: t.schema,
          type: t.type,
          columns,
        };
      })
    );
  }

  // ==========================================
  // REPORTS MANAGEMENT METHODS (User Database: CNFREPORTDEF)
  // ==========================================
  private storageError(error: any): never {
    const message = String(error?.message || '');
    if (message.includes('Report ID already exists.')) {
      throw new ConflictException('Report ID already exists. Choose a different ID.');
    }
    if (message.includes('Report changed or was deleted.')) {
      throw new ConflictException('Report changed or was deleted. Review it and confirm the update again.');
    }
    const validation = message.indexOf('Report validation: ');
    if (validation >= 0) {
      throw new BadRequestException(message.slice(validation + 'Report validation: '.length));
    }
    const storage = message.indexOf('Report storage: ');
    if (storage >= 0) {
      throw new ServiceUnavailableException(message.slice(storage + 'Report storage: '.length));
    }
    if ([8152, 2628].includes(error?.number) || /String or binary data would be truncated/i.test(message)) {
      throw new BadRequestException('Report data exceeds a CNFREPORTDEF column limit. Verify the report name, description, ID and storage column sizes.');
    }
    throw error;
  }

  private mapDefinition(row: StoredReport): Record<string, unknown> {
    let definition: Record<string, unknown>;
    try {
      const parsed = JSON.parse(row.definitionJson || 'null');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid object');
      definition = parsed;
    } catch {
      throw new BadRequestException('The saved report definition JSON is missing or invalid.');
    }
    return {
      ...definition,
      id: row.id,
      name: row.name ?? definition['name'] ?? row.id,
      description: row.description ?? undefined,
      version: row.version ?? 1,
      isPublished: row.statusCode === 1,
      createdAt: asIsoDate(row.createdAt),
      updatedAt: asIsoDate(row.updatedAt),
      createdBy: row.createdBy ?? undefined,
      updatedBy: row.updatedBy ?? undefined,
    };
  }

  async listReports(): Promise<ReportSummaryDto[]> {
    this.requireUserDatabase();
    const rows = await this.userDataSource.query(`
      SELECT CODE AS id, COALESCE(NAME, CODE) AS name, DESCRIPTION AS description,
        VERSION AS version, STATUS_CODE AS statusCode, SYSCHNG_DATETIME AS updatedAt,
        DEFJSON AS definitionJson
      FROM [dbo].[CNFREPORTDEF]
      ORDER BY SYSCHNG_DATETIME DESC;
    `);
    const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
    return flatRows.map((row: StoredReport) => {
      let metadata: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(row.definitionJson || '{}');
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) metadata = parsed;
      } catch { /* Keep malformed definitions visible in the catalog. */ }
      const stringValue = (key: string) => typeof metadata[key] === 'string' ? metadata[key] as string : undefined;
      const order = metadata['menuOrder'];
      const numericOrder = typeof order === 'number' || (typeof order === 'string' && order.trim()) ? Number(order) : NaN;
      return {
        id: row.id,
        name: row.name ?? row.id,
        description: row.description ?? undefined,
        category: stringValue('category') ?? 'General',
        version: row.version ?? 1,
        isPublished: row.statusCode === 1,
        slug: stringValue('slug'),
        menuGroup: stringValue('menuGroup'),
        menuOrder: Number.isInteger(numericOrder) && numericOrder >= -2147483648 && numericOrder <= 2147483647 ? numericOrder : undefined,
        icon: stringValue('icon'),
        updatedAt: asIsoDate(row.updatedAt),
      };
    });
  }

  // Alias for backward compatibility
  async list(): Promise<ReportSummaryDto[]> {
    return this.listReports();
  }

  async checkReportId(id: string): Promise<{ id: string; exists: boolean; name?: string; version?: number }> {
    this.requireUserDatabase();
    if (!id?.trim()) throw new BadRequestException('Enter a report ID.');
    const rows = await this.userDataSource.query(
      'SELECT TOP (1) CODE AS id, NAME AS name, VERSION AS version FROM [dbo].[CNFREPORTDEF] WHERE CODE = @0;',
      [id.trim()]
    );
    const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
    const row = flatRows[0];
    return row
      ? { id: id.trim(), exists: true, name: row.name ?? row.id, version: row.version ?? 0 }
      : { id: id.trim(), exists: false };
  }

  // Alias for backward compatibility
  async checkId(id: string) {
    return this.checkReportId(id);
  }

  async loadReport(id: string): Promise<Record<string, unknown>> {
    this.requireUserDatabase();
    const rows = await this.userDataSource.query(
      'SELECT ' + REPORT_COLUMNS + ' FROM [dbo].[CNFREPORTDEF] WHERE CODE = @0;',
      [id]
    );
    const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
    const row = flatRows[0];
    if (!row) throw new NotFoundException('Report not found.');
    return this.mapDefinition(row);
  }

  // Alias for backward compatibility
  async load(id: string): Promise<Record<string, unknown>> {
    return this.loadReport(id);
  }

  async saveReport(dto: SaveReportDto): Promise<Record<string, unknown>> {
    this.requireUserDatabase();
    if (dto.createOnly && dto.expectedVersion !== undefined) {
      throw new BadRequestException('Choose createOnly or expectedVersion, not both.');
    }
    const report: Record<string, unknown> = { ...(dto.definition || {}), id: dto.id, name: dto.name };
    for (const key of ['description', 'category', 'version', 'isPublished'] as const) {
      if (dto[key] !== undefined) report[key] = dto[key];
    }
    report['isPublished'] = !!report['isPublished'];
    delete report['version'];
    const jsonWithoutVersionPrefix = JSON.stringify(report).slice(1);
    const userLogin = dto.userLogin || 'admin';

    const rows = await this.userDataSource.query(`
      SET XACT_ABORT ON;
      ${REPORT_AUDIT_SQL}
      ${validateStorageSql([
      ['CODE', '@0'], ['NAME', '@1'], ['DESCRIPTION', '@2'],
      ['SYSADD_LOGIN', '@5'], ['SYSCHNG_LOGIN', '@5'],
      ['SYSADD_DATETIME', '@createdAtValue'], ['SYSCHNG_DATETIME', '@updatedAtValue'],
    ])}
      BEGIN TRANSACTION;
      DECLARE @nextVersion int, @currentVersion int;
      DECLARE @storedJson nvarchar(max);
      SELECT @nextVersion = ISNULL(VERSION, 0) + 1, @currentVersion = ISNULL(VERSION, 0)
        FROM [dbo].[CNFREPORTDEF] WITH (UPDLOCK, HOLDLOCK) WHERE CODE = @0;
      IF @nextVersion IS NOT NULL AND @6 = 1
      BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(N'Report ID already exists. Choose a different ID.', 16, 1);
        RETURN;
      END;
      IF @7 IS NOT NULL AND (@currentVersion IS NULL OR @currentVersion <> @7)
      BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(N'Report changed or was deleted. Review it and confirm the update again.', 16, 1);
        RETURN;
      END;
      IF @nextVersion IS NULL SET @nextVersion = 1;
      SET @storedJson = N'{"version":' + CONVERT(nvarchar(11), @nextVersion) + N',' + @4;
      IF NOT EXISTS (SELECT 1 FROM [dbo].[CNFREPORTDEF] WHERE CODE = @0)
      BEGIN
        INSERT INTO [dbo].[CNFREPORTDEF]
          (CODE, NAME, DESCRIPTION, VERSION, STATUS_CODE, DEFJSON,
           SYSADD_DATETIME, SYSCHNG_DATETIME, SYSADD_LOGIN, SYSCHNG_LOGIN)
        VALUES (@0, @1, @2, @nextVersion, @3, @storedJson, @createdAtValue, @updatedAtValue, @5, @5);
      END
      ELSE
      BEGIN
        UPDATE [dbo].[CNFREPORTDEF] SET NAME = @1, DESCRIPTION = @2, VERSION = @nextVersion,
          STATUS_CODE = @3, DEFJSON = @storedJson, SYSCHNG_DATETIME = @updatedAtValue, SYSCHNG_LOGIN = @5
        WHERE CODE = @0;
      END;
      SELECT ${REPORT_COLUMNS} FROM [dbo].[CNFREPORTDEF] WHERE CODE = @0;
      COMMIT TRANSACTION;
    `, [
      dto.id,
      dto.name,
      report['description'] ?? null,
      report['isPublished'] ? 1 : 0,
      jsonWithoutVersionPrefix,
      userLogin,
      dto.createOnly ? 1 : 0,
      dto.expectedVersion ?? null,
    ]).catch(error => this.storageError(error));

    const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
    return this.mapDefinition(flatRows[0]);
  }

  // Alias for backward compatibility
  async save(dto: SaveReportDto): Promise<Record<string, unknown>> {
    return this.saveReport(dto);
  }

  async deleteReport(id: string): Promise<void> {
    this.requireUserDatabase();
    const rows = await this.userDataSource.query(
      'DELETE FROM [dbo].[CNFREPORTDEF] OUTPUT deleted.CODE WHERE CODE = @0;',
      [id]
    );
    const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
    if (!flatRows.length) throw new NotFoundException('Report not found.');
  }

  // Alias for backward compatibility
  async delete(id: string): Promise<void> {
    return this.deleteReport(id);
  }

  async publishReport(id: string, version: number, userLogin = 'admin'): Promise<void> {
    this.requireUserDatabase();
    const report = await this.loadReport(id);
    if (report['version'] !== version) throw new NotFoundException('Report version not found.');
    report['isPublished'] = true;

    const rows = await this.userDataSource.query(`
      ${REPORT_AUDIT_SQL}
      ${validateStorageSql([['SYSCHNG_LOGIN', '@2'], ['SYSCHNG_DATETIME', '@updatedAtValue']])}
      UPDATE [dbo].[CNFREPORTDEF]
      SET STATUS_CODE = 1, DEFJSON = @3,
        SYSCHNG_DATETIME = @updatedAtValue, SYSCHNG_LOGIN = @2
      OUTPUT inserted.CODE WHERE CODE = @0 AND VERSION = @1;
    `, [id, version, userLogin, JSON.stringify(report)]).catch(error => this.storageError(error));

    const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
    if (!flatRows.length) throw new NotFoundException('Report version not found.');
  }

  // Alias for backward compatibility
  async publish(id: string, version: number): Promise<void> {
    return this.publishReport(id, version);
  }

  // ==========================================
  // LOOKUP DATA METHODS (Company Database)
  // ==========================================
  async fetchLookupOptions(request: LookupQueryDto): Promise<LookupOptionResponseDto[]> {
    this.requireCompanyDatabase();

    const rowLimit = Math.min(Math.max(Number(request.limit) || 500, 1), 5000);
    const companyId = getCompanyId();
    const cacheKey = JSON.stringify({
      companyId,
      schema: request.schema,
      limit: request.limit,
      entity: request.entityName?.toLowerCase(),
      type: request.sourceType,
      valueField: request.valueField,
      displayField: request.displayField,
      filter: request.filter,
      params: request.parameters,
    });

    const cached = this.lookupCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Returning cached lookup options for ${request.entityName} (${cached.data.length} items)`);
      return cached.data;
    }

    try {
      let rows: any[] = [];
      let isProcedure =
        request.sourceType === 'stored_procedure' ||
        (request.sourceType as string) === 'procedure';

      if (!isProcedure && request.entityName) {
        const lowerName = request.entityName.toLowerCase();
        if (lowerName.startsWith('sel_') || lowerName.startsWith('usp_') || lowerName.startsWith('sp_')) {
          isProcedure = true;
        }
      }

      const schema = (request.schema || 'dbo').replace(/[^a-zA-Z0-9_]/g, '');

      if (isProcedure) {
        const normalizedParams: Record<string, unknown> = {};
        if (request.parameters) {
          for (const [k, v] of Object.entries(request.parameters)) {
            const cleanKey = k.startsWith('@') ? k.substring(1) : k;
            let val = v;
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
              val = val.replace(/-/g, '');
            }
            normalizedParams[cleanKey] = val;
          }
        }

        // const numTran = Number(normalizedParams['intTranOrDueDate']);
        // normalizedParams['intTranOrDueDate'] = isNaN(numTran) || numTran < 0 || numTran > 2 ? 0 : Math.round(numTran);

        // const numDue = Number(normalizedParams['intOnlyDue']);
        // normalizedParams['intOnlyDue'] = isNaN(numDue) || numDue < 0 || numDue > 1 ? 0 : Math.round(numDue);

        // if (normalizedParams['intValue'] === undefined) normalizedParams['intValue'] = 11;
        // if (!normalizedParams['chrCompanyId'] || normalizedParams['chrCompanyId'] === '0') {
        //   normalizedParams['chrCompanyId'] = String(companyId || '101');
        // }
        // if (!normalizedParams['chrCompUnitId'] || normalizedParams['chrCompUnitId'] === '0') {
        //   normalizedParams['chrCompUnitId'] = '101';
        // }
        // if (!normalizedParams['chrSubAcNoList']) normalizedParams['chrSubAcNoList'] = '0';
        // if (!normalizedParams['chrAsOnDate']) {
        //   normalizedParams['chrAsOnDate'] = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        // }

        console.log(request.entityName, "------------------1")
        console.log(normalizedParams, "------------------2")
        console.log(schema, "------------------3")
        const spResult = await this.executeStoredProcedure(request.entityName, normalizedParams, schema);
        rows = (Array.isArray(spResult[0]) ? spResult[0] : spResult) || [];
      } else {
        const cleanEntity = request.entityName.replace(/[^a-zA-Z0-9_]/g, '');
        let sql = `SELECT TOP (${rowLimit}) * FROM [${schema}].[${cleanEntity}]`;
        if (request.filter && typeof request.filter === 'object') {
          const whereClauses: string[] = [];
          const params: any[] = [];
          let paramIdx = 0;
          for (const [col, val] of Object.entries(request.filter)) {
            const cleanCol = col.replace(/[^a-zA-Z0-9_]/g, '');
            if (val !== null && val !== undefined) {
              whereClauses.push(`[${cleanCol}] = @${paramIdx}`);
              params.push(val);
              paramIdx++;
            }
          }
          if (whereClauses.length > 0) {
            sql += ` WHERE ` + whereClauses.join(' AND ');
          }
          rows = await this.dataSource.query(sql, params);
        } else {
          rows = await this.dataSource.query(sql);
        }
        rows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
      }

      const getFieldValue = (record: any, targetField?: string): any => {
        if (!record || typeof record !== 'object' || !targetField) return undefined;
        if (record[targetField] !== undefined && record[targetField] !== null) {
          return record[targetField];
        }
        const targetLower = targetField.trim().toLowerCase();
        if (!targetLower) return undefined;
        for (const k of Object.keys(record)) {
          if (k.toLowerCase() === targetLower) {
            return record[k];
          }
        }
        return undefined;
      };

      const mapped = rows.slice(0, rowLimit).map((r: any) => {
        if (!r || typeof r !== 'object') {
          return { value: r, label: String(r ?? ''), raw: r };
        }

        const keys = Object.keys(r);

        // 1. Resolve Value
        let val: any = undefined;
        if (request.valueField) {
          val = getFieldValue(r, request.valueField);
        }

        if (val === undefined || val === null || val === '') {
          const candidateValueKeys = ['code', 'id', 'key', 'value', 'val'];
          for (const cand of candidateValueKeys) {
            const v = getFieldValue(r, cand);
            if (v !== undefined && v !== null && v !== '') {
              val = v;
              break;
            }
          }
        }

        if (val === undefined || val === null || val === '') {
          const idKeys = keys.filter((k) => /(?:_code|_id|id|code)$/i.test(k));
          const specificIdKey = idKeys.find((k) => !/^(?:user_?id|company_?id)$/i.test(k)) || idKeys[0];
          if (specificIdKey) {
            val = r[specificIdKey];
          }
        }

        if (val === undefined || val === null || val === '') {
          const firstPrimitiveKey = keys.find((k) => typeof r[k] === 'string' || typeof r[k] === 'number');
          val = firstPrimitiveKey ? r[firstPrimitiveKey] : (keys[0] ? r[keys[0]] : '');
        }

        // 2. Resolve Label / Display
        let label: any = undefined;
        if (request.displayField) {
          label = getFieldValue(r, request.displayField);
        }

        if (label === undefined || label === null || label === '') {
          const candidateDisplayKeys = ['name', 'title', 'label', 'description', 'desc', 'text', 'caption'];
          for (const cand of candidateDisplayKeys) {
            const l = getFieldValue(r, cand);
            if (l !== undefined && l !== null && l !== '') {
              label = l;
              break;
            }
          }
        }

        if (label === undefined || label === null || label === '') {
          const nameKey = keys.find((k) => /(?:_name|_title|_desc)$/i.test(k));
          if (nameKey) {
            label = r[nameKey];
          }
        }

        if (label === undefined || label === null || label === '') {
          const secondPrimitiveKey = keys.find(
            (k) => (typeof r[k] === 'string' || typeof r[k] === 'number') && r[k] !== val
          );
          label = secondPrimitiveKey ? r[secondPrimitiveKey] : String(val ?? '');
        }

        return {
          value: typeof val === 'object' ? JSON.stringify(val) : val,
          label: String(label ?? val ?? ''),
          raw: r,
        };
      });

      this.lookupCache.set(cacheKey, {
        expiresAt: Date.now() + 10 * 60 * 1000,
        data: mapped,
      });

      return mapped;
    } catch (err: any) {
      this.logger.error(`Database lookup failed for ${request.entityName}: ${err.message}`);
      throw new BadRequestException(`Lookup failed for '${request.entityName}': ${err.message}`);
    }
  }

  // Alias
  async fetchOptions(request: LookupQueryDto): Promise<LookupOptionResponseDto[]> {
    return this.fetchLookupOptions(request);
  }

  // ==========================================
  // REPORT EXECUTION METHODS (Company Database)
  // ==========================================

  async executeReport(dto: ExecuteReportDto): Promise<Record<string, unknown>[]> {
    console.log("functoin start");

    this.requireCompanyDatabase();

    const limit = Math.min(Math.max(Number(dto.top) || 500, 1), 10000);
    let dataSource = dto.dataSource;
    if (!dataSource && (dto.name || (dto as any).endpoint)) {
      const rawKind = ((dto.kind as string) || 'table').toLowerCase();
      dataSource = {
        id: dto.name || 'ds-default',
        type: rawKind === 'procedure' || rawKind === 'stored_procedure' ? 'stored_procedure' : rawKind,
        name: dto.name,
        schema: dto.schema || 'dbo',
      };
    }

    if (!dataSource) {
      throw new BadRequestException('A valid data source (or name + kind) must be provided.');
    }

    const { parameters, sessionContext } = dto;
    const mergedParams: Record<string, unknown> = {
      ...(sessionContext || {}),
      ...(parameters || {}),
    };
    console.log(mergedParams, "------------------para")
    const entityName = dataSource.name || (dataSource as any).endpoint;
    const rawType = (dataSource.type || (dataSource as any).sourceType || 'stored_procedure').toLowerCase();
    const isProcedure = rawType === 'stored_procedure' || rawType === 'procedure';
    const schema = (dataSource.schema || 'dbo').replace(/[^a-zA-Z0-9_]/g, '');

    const cleanParams: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(mergedParams)) {
      const strippedKey = k.replace(/^@/, '');
      let val = v;
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        val = val.replace(/-/g, '');
      }
      cleanParams[strippedKey] = val;
    }

    try {
      if (isProcedure && entityName) {
        const rows = await this.executeStoredProcedure(entityName, cleanParams, schema);
        const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
        return flatRows.slice(0, limit);
      }

      if ((rawType === 'table' || rawType === 'view') && entityName) {
        const cleanEntity = entityName.replace(/[^a-zA-Z0-9_]/g, '');
        let selectCols = '*';
        if (Array.isArray(dto.columns) && dto.columns.length > 0) {
          selectCols = dto.columns.map((c: string) => `[${c.replace(/[^a-zA-Z0-9_]/g, '')}]`).join(', ');
        }
        const sql = `SELECT TOP (${limit}) ${selectCols} FROM [${schema}].[${cleanEntity}]`;
        const rows = await this.dataSource.query(sql);
        const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
        return flatRows;
      }
console.log(dataSource.type,"=======================================type");

      if (dataSource.type === 'sql' && dataSource.query) {
        console.log(dataSource.query, "----------------------------------");

        const rows = await this.dataSource.query(dataSource.query);
        const flatRows = (Array.isArray(rows[0]) ? rows[0] : rows) || [];
        return flatRows;
      }

      return [];
    } catch (err: any) {
      this.logger.error(`Database query execution failed for ${dataSource.name || 'custom'}: ${err.message}`);
      throw new BadRequestException(`Query failed for '${dataSource.name || 'custom'}': ${err.message}`);
    }
  }
}

// [commit 101]: refactor(tools): implement database health check tool endpoint
