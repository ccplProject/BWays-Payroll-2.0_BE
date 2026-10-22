import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

// Tables that exist only in the user/auth DB, not the main application DB.
const USER_DB_TABLES = new Set(['USERS', 'USRMSTUSERS', 'MENUS', 'MODULES', 'CNFUSERCOMPANY']);

@Injectable()
export class WebHelpViewService {
    constructor(
        private dataSource: DataSource,
        @InjectDataSource('userConnection') private userDataSource: DataSource,
    ) { }

    async GetHelpList(
        CompanyID: string,
        chrTableName: string,
        WhereClauseDesc: string = '',
        PageMode: number = 1,
    ): Promise<any[]> {
        const rawDesc = (WhereClauseDesc ?? '').trim();
        const orderByIdx = rawDesc.search(/(^|\s+)ORDER\s+BY\s+/i);
        WhereClauseDesc = orderByIdx >= 0 ? rawDesc.slice(0, orderByIdx).trim() : rawDesc;

        let TableName = chrTableName;
        let HelpColumnNames = 'CODE, NAME';
        let HelpDataCompIdColumn = '';
        let WhereClause = WhereClauseDesc || '';
        let SortOrder = 'CODE';

        switch (chrTableName) {
            case 'CNFCOMPANY':
                TableName = 'CNFCOMPANY';
                HelpColumnNames = 'COMPANY_ID AS CODE, SHORT_NAME AS NAME, COMPANY_NAME';
                HelpDataCompIdColumn = 'COMPANY_ID';
                SortOrder = 'COMPANY_ID';
                break;

            case 'USERS':
            case 'USRMSTUSERS':
                TableName = 'USRMSTUSERS';
                HelpColumnNames = 'USER_ID AS CODE, NAME';
                HelpDataCompIdColumn = 'USER_ID';
                SortOrder = 'USER_ID';
                break;

            case 'MENUS':
                TableName = 'MENUS';
                HelpColumnNames = 'TRAN_NO AS CODE, MENU_NAME AS NAME';
                SortOrder = 'TRAN_NO';
                break;

            case 'MSTCOMMDEPARTMENT':
                TableName = 'MSTCOMMDEPARTMENT';
                HelpColumnNames = 'CODE, NAME';
                HelpDataCompIdColumn = 'CODE';
                SortOrder = 'NAME';
                break;

            case 'MSTCOMMDESIGNATION':
                TableName = 'MSTCOMMDESIGNATION';
                HelpColumnNames = 'CODE, NAME';
                HelpDataCompIdColumn = 'CODE';
                SortOrder = 'NAME';
                break;

            case 'MSTEMPLOYEE':
            case 'MSTCOMMEMPLOYEE':
                TableName = 'MSTEMPLOYEE';
                HelpColumnNames = 'EMP_NO AS CODE, NAME';
                HelpDataCompIdColumn = 'EMP_NO';
                SortOrder = 'NAME';
                break;

            case 'MSTCOMMEMPLOYEETYPE':
                TableName = 'MSTCOMMEMPLOYEETYPE';
                HelpColumnNames = 'CODE, NAME';
                HelpDataCompIdColumn = 'CODE';
                SortOrder = 'NAME';
                break;

            case 'CNFSHIFTS':
                TableName = 'CNFSHIFTS';
                HelpColumnNames = 'CODE, NAME';
                HelpDataCompIdColumn = 'CODE';
                SortOrder = 'CODE';
                break;

            case 'CNFHOLIDAYS':
                TableName = 'CNFHOLIDAYS';
                HelpColumnNames = 'HOLIDAY_DATE AS CODE, HOLIDAY_NAME AS NAME';
                SortOrder = 'HOLIDAY_DATE';
                break;

            default:
                TableName = chrTableName;
                HelpColumnNames = 'CODE, NAME';
                WhereClause = WhereClauseDesc || '';
                SortOrder = '1';
                break;
        }

        try {
            const sql = `
                EXEC Get_HelpList
                    @chrCOMPANYID = @0,
                    @chrTableName = @1,
                    @chrCompanyidColumn = @2,
                    @chrHelpColumnNames = @3,
                    @chrHelpColumnFilter = @4,
                    @chrSortOrder = @5,
                    @intExecFlag = @6
            `;

            const params = [
                CompanyID ?? null,
                TableName ?? null,
                HelpDataCompIdColumn ?? null,
                HelpColumnNames ?? null,
                WhereClause ?? null,
                SortOrder ?? null,
                1,
            ];

            const db = USER_DB_TABLES.has(chrTableName) ? this.userDataSource : this.dataSource;
            const result = await db.query(sql, params);
            return result;
        } catch (error) {
            console.error(`GetHelpList failed for ${chrTableName}:`, error);
            throw error;
        }
    }
}

// [commit 103]: refactor(web): add context-sensitive help topics in web help service
