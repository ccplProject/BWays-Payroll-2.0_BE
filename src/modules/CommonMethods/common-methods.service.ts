import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { MSTCOMMMETHODS } from '../../TableClasses/Common/MSTCOMMMETHODS';
import { CNFPOSTINGPERIOD } from '../../TableClasses/Common/CNFPOSTINGPERIOD';
import { GETMASTNAME } from '../../TableClasses/Common/GETMASTNAME';
import { GETMASTCODELIST } from '../../TableClasses/Common/GETMASTCODELIST';

@Injectable()
export class CommonMethodsService {
    private readonly logger = new Logger(CommonMethodsService.name);

    constructor(
        private dataSource: DataSource,
        @InjectDataSource('userConnection') private userDataSource: DataSource,
    ) { }

    /**
     * Helper to execute stored procedure and return multiple recordsets
     */
    private async executeStoredProcedure(spName: string, params: Record<string, any>): Promise<any[][] | any> {
        try {
            const driver = this.dataSource.driver as any;
            const pool = driver.master;

            if (!pool || typeof pool.request !== 'function') {
                this.logger.warn(`MSSQL master pool not found. Falling back to dataSource.query.`);
                const values = Object.values(params);
                const sql = `EXEC ${spName} ${values.map((_, i) => `@${i}`).join(', ')}`;
                return await this.dataSource.query(sql, values);
            }

            const request = pool.request();
            const paramEntries = Object.entries(params);

            paramEntries.forEach(([key, val]) => {
                request.input(key, val);
            });

            const result = await request.execute(spName);

            if (this.dataSource.options.logging) {
                this.logger.log(`Executed SP: ${spName} with params: ${JSON.stringify(params)}`);
            }

            return result.recordsets;
        } catch (error) {
            this.logger.error(`Error executing SP ${spName}: ${error.message}`);
            throw error;
        }
    }

    async GetDates(CompanyID: string, DisplayCode: number, NoOfDays: number): Promise<any> {
        return this.executeStoredProcedure(CNFPOSTINGPERIOD.SP_GET_POSTING_DATES, {
            [CNFPOSTINGPERIOD.COMPANY_ID]: CompanyID,
            [CNFPOSTINGPERIOD.DISPLAY_CODE]: DisplayCode,
            [CNFPOSTINGPERIOD.DAYS]: NoOfDays,
        });
    }

    async GetMonthList(CompanyID: string, NoofMths: number): Promise<any> {
        return this.executeStoredProcedure(CNFPOSTINGPERIOD.SP_GET_MONTHS_LIST, {
            [CNFPOSTINGPERIOD.MTHS]: NoofMths,
        });
    }

    async GetAMCMonthList(CompanyID: string, NoofMths: number, AMCDate: string): Promise<any> {
        return this.executeStoredProcedure(CNFPOSTINGPERIOD.SP_GET_AMC_MONTHS_LIST, {
            [CNFPOSTINGPERIOD.MTHS]: NoofMths,
            [CNFPOSTINGPERIOD.AMC_DATE]: AMCDate,
        });
    }

    async GetWeekWiseDates(CompanyID: string, MonthDate: string, AvoidDay: string): Promise<any> {
        return this.executeStoredProcedure(CNFPOSTINGPERIOD.SP_GET_WEEK_WISE_DATES, {
            [CNFPOSTINGPERIOD.MONTH_DATE]: MonthDate,
            [CNFPOSTINGPERIOD.AVOID_DAY]: AvoidDay,
        });
    }

    async GetWeekDates(CompanyID: string, MonthDate: string, AvoidDay: string, WeekDay: number): Promise<any> {
        return this.executeStoredProcedure(CNFPOSTINGPERIOD.SP_GET_WEEKDATES, {
            [CNFPOSTINGPERIOD.MONTH_DATE]: MonthDate,
            [CNFPOSTINGPERIOD.AVOID_DAY]: AvoidDay,
            [CNFPOSTINGPERIOD.DAYS]: WeekDay,
        });
    }

    async GetMonths(CompanyID: string): Promise<any> {
        return this.executeStoredProcedure(CNFPOSTINGPERIOD.SP_GET_MONTHS, {});
    }

    async GetYears(CompanyID: string, LastNoOfYears: number, NextNoOfYears: number): Promise<any> {
        return this.executeStoredProcedure(CNFPOSTINGPERIOD.SP_GET_YEARS, {
            [CNFPOSTINGPERIOD.LASTYEARS]: LastNoOfYears,
            [CNFPOSTINGPERIOD.NEXTYEARS]: NextNoOfYears,
        });
    }

    async GetFromToDates(CompanyID: string, FromDate: string, ToDate: string, AvoidDay: string, WeekDay: number): Promise<any> {
        return this.executeStoredProcedure(CNFPOSTINGPERIOD.SP_GET_FROMTODATES, {
            [CNFPOSTINGPERIOD.FROM_DATE]: FromDate,
            [CNFPOSTINGPERIOD.TO_DATE]: ToDate,
            [CNFPOSTINGPERIOD.AVOID_DAY]: AvoidDay,
            [CNFPOSTINGPERIOD.DAYS]: WeekDay,
        });
    }

    async GetTableFields(CompanyID: string, TableName: string, OutputFields: string, WhereClause: string): Promise<any> {
        return this.executeStoredProcedure(GETMASTNAME.SP_GET_TABELFIELDS, {
            [GETMASTNAME.TABLE_NAME]: TableName,
            [GETMASTNAME.OUTPUT_FIELDS]: OutputFields,
            [GETMASTNAME.WHERE_CLAUSE]: WhereClause,
        });
    }

    async GetUserTableFields(TableName: string, OutputFields: string, WhereClause: string): Promise<any> {
        return this.executeStoredProcedure(GETMASTNAME.SP_GET_TABELFIELDS, {
            [GETMASTNAME.TABLE_NAME]: TableName,
            [GETMASTNAME.OUTPUT_FIELDS]: OutputFields,
            [GETMASTNAME.WHERE_CLAUSE]: WhereClause,
        });
    }

    async GetConstAccount(CompanyID: string, WhereClause: string = '', TableName: string = 'MSTACCTCONST', CoIDColumns: string = '', HelpColumns: string = '', SortOrder: string = '', OutPutType: number = 1): Promise<any> {
        return this.executeStoredProcedure(GETMASTCODELIST.SP_GET_HELPLLIST, {
            [GETMASTCODELIST.COMPANY_ID]: CompanyID,
            [GETMASTCODELIST.TABLE_NAME]: TableName,
            [GETMASTCODELIST.COMPID_COLUMN]: CoIDColumns,
            [GETMASTCODELIST.HELP_COLUMNS]: HelpColumns,
            [GETMASTCODELIST.HELP_WHERE_CLAUSE]: WhereClause,
            [GETMASTCODELIST.SORT_ORDER_CODE]: SortOrder,
            [GETMASTCODELIST.OUTPUT_TYPE]: OutPutType,
        });
    }

    async UpdateTableFields(CompanyID: string, TableName: string, UpdFields: string, WhereClause: string): Promise<any> {
        return this.executeStoredProcedure(GETMASTNAME.SP_UPD_TABLEFIELDS, {
            [GETMASTNAME.TABLENAME]: TableName,
            [GETMASTNAME.UPDFIELDS]: UpdFields,
            [GETMASTNAME.WHERECLAUSE]: WhereClause,
        });
    }

    async DeleteTableData(CompanyID: string, TableName: string, WhereClause: string): Promise<number> {
        await this.executeStoredProcedure(MSTCOMMMETHODS.DEL_TABELDATA, {
            ['@TABLE_NAME']: TableName,
            ['@WHERECLAUSE']: WhereClause,
        });
        return 1;
    }

    async GetMenuViewPage(MenuDocno: number): Promise<any> {
        return this.executeStoredProcedure(MSTCOMMMETHODS.SP_SEL_MENUVIEWPAGE, {
            [MSTCOMMMETHODS.MENU_DOCNO]: MenuDocno,
        });
    }

    async GetNextRefTranNo(
        TableName: string,
        CompanyID: string,
        VoucherType: string,
        VoucherSubType: number,
        VoucherSeries: string,
        Tablefield: string,
        EffDate: string = '',
    ): Promise<string> {
        const params: any = {
            ['@COMPANY_ID']: CompanyID,
            ['@voutype']: VoucherType,
            ['@vouSubType']: VoucherSubType,
            ['@vouSeries']: VoucherSeries,
            ['@tableName']: TableName,
            ['@tblField']: Tablefield,
            ['@intNextNo']: 0,
            ['@NextRefNo']: '',
        };
        if (EffDate) {
            params['@effDate'] = EffDate;
        }
        const recordsets = await this.executeStoredProcedure(MSTCOMMMETHODS.SP_GET_NEXT_REFTRANS_NO, params);
        if (recordsets && recordsets[0] && recordsets[0][0]) {
            return recordsets[0][0].NEXTREFNO || '';
        }
        return '';
    }

    async GetAssignedCompanyList(UserID: string): Promise<any> {
        return this.executeStoredProcedure(MSTCOMMMETHODS.SEL_ASSIGNEDCOMPANYLIST, {
            [MSTCOMMMETHODS.USER_ID]: UserID,
        });
    }

    async ExecuteSp(CompanyID: number, SpName: string, paramDict: Record<string, any>): Promise<any> {
        const params: Record<string, any> = {};
        for (const [key, value] of Object.entries(paramDict)) {
            params[key.startsWith('@') ? key : `@${key}`] = value;
        }
        return this.executeStoredProcedure(SpName, params);
    }

    async MastDataList(
        CompanyID: string,
        TableName: string,
        CoIDColumns: string = '',
        HelpColumns: string = '',
        WhereClause: string = '',
        SortOrder: string = '',
        OutPutType: number = 1,
    ): Promise<any> {
        return this.executeStoredProcedure(GETMASTCODELIST.SP_GET_HELPLLIST, {
            [GETMASTCODELIST.COMPANY_ID]: CompanyID,
            [GETMASTCODELIST.TABLE_NAME]: TableName,
            [GETMASTCODELIST.COMPID_COLUMN]: CoIDColumns,
            [GETMASTCODELIST.HELP_COLUMNS]: HelpColumns,
            [GETMASTCODELIST.HELP_WHERE_CLAUSE]: WhereClause,
            [GETMASTCODELIST.SORT_ORDER_CODE]: SortOrder,
            [GETMASTCODELIST.OUTPUT_TYPE]: OutPutType,
        });
    }

    async menuDetails(data: any): Promise<any> {
        let sql = `SELECT * FROM Menus WHERE MENU_DOC_NO = @0`;
        const params: any[] = [data.menu_doc_no];

        if (data.hasOwnProperty('menu_module')) {
            sql += ` AND MODULE_NO = @${params.length}`;
            params.push(data.menu_module);
        }

        if (data.hasOwnProperty('menu_key')) {
            sql += ` AND MENU_KEY = @${params.length}`;
            params.push(data.menu_key);
        }

        let temp: any = await this.userDataSource.query(sql, params);

        temp = temp?.map((ele: any) => {
            return {
                ...ele,
                MENU_NAV_PAGE: ele?.IS_MENU_SOURCE == 1
                    ? (ele?.NG_MENU_NAV_PAGE ?? ele?.MENU_NAV_PAGE)
                    : ele?.MENU_NAV_PAGE,
                MENU_OPT_PAGE: ele?.IS_MENU_SOURCE == 1
                    ? (ele?.NG_MENU_OPT_PAGE ?? ele?.MENU_OPT_PAGE)
                    : ele?.MENU_OPT_PAGE,
                MENU_VIEW_PAGE: ele?.IS_MENU_SOURCE == 1
                    ? (ele?.NG_MENU_VIEW_PAGE ?? ele?.MENU_VIEW_PAGE)
                    : ele?.MENU_VIEW_PAGE
            };
        });

        return temp;
    }
}

// [commit 98]: refactor(common-methods): add generic search filter for dropdown lists
