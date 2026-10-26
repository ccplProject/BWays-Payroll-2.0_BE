import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WebHelpViewService } from '../../web/web-help-view.service';
import { GETMASTNAME } from '../../TableClasses/Common/GETMASTNAME';
import { GETMASTCODELIST } from '../../TableClasses/Common/GETMASTCODELIST';

@Injectable()
export class CommonService {
    private readonly logger = new Logger(CommonService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly webHelpViewService: WebHelpViewService,
    ) { }

    private async executeStoredProcedure(spName: string, params: Record<string, any>): Promise<any> {
        try {
            const driver = this.dataSource.driver as any;
            const pool = driver.master;
            const request = pool.request();
            Object.entries(params).forEach(([key, val]) => request.input(key.replace(/^@/, ''), val));
            const result = await request.execute(spName);
            return result.recordsets;
        } catch (error: any) {
            this.logger.error(`Error executing SP ${spName}: ${error.message}`);
            throw error;
        }
    }

    async Get_HelpList(data: any) {
        if (!data) {
            console.error('Error: data is undefined in Get_HelpList');
            throw new Error('Request body is missing or could not be parsed as JSON');
        }
        const { CompanyID, ChrTableName, WhereClauseDesc, PageMode } = data;
        return this.webHelpViewService.GetHelpList(
            CompanyID,
            ChrTableName,
            WhereClauseDesc,
            PageMode,
        );
    }

    async GetMastDataList(
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

    async GetTableFields(
        _CompanyID: string,
        TableName: string,
        OutputFields: string,
        WhereClause: string,
    ): Promise<any> {
        return this.executeStoredProcedure(GETMASTNAME.SP_GET_TABELFIELDS, {
            [GETMASTNAME.TABLE_NAME]: TableName,
            [GETMASTNAME.OUTPUT_FIELDS]: OutputFields,
            [GETMASTNAME.WHERE_CLAUSE]: WhereClause,
        });
    }

    async getCompanyListUserWise(_data?: any) {
        try {
            const list = await this.dataSource.query(`
                SELECT *, NAME AS COMPANY_NAME, NAME AS LONG_NAME, DB_NAME() AS ERP_DATABASE, DB_NAME() AS UserDatabase
                FROM CNFCOMPANY
                WHERE STATUS_CODE = 0
            `);
            return list;
        } catch (e) {
            this.logger.error('Error fetching company list from CNFCOMPANY', e);
            throw e;
        }
    }

    async getCompanyListUserWiseList(data?: any) {
        try {
            const companyId = data?.COMPANY_ID;
            let query = `
                SELECT *, NAME AS COMPANY_NAME, NAME AS LONG_NAME, 1 AS IS_GSTINREGISTERE, DB_NAME() AS UserDatabase, DB_NAME() AS ErpDatabase
                FROM CNFCOMPANY
                WHERE STATUS_CODE = 0
            `;
            if (companyId) {
                query += ` AND COMPANY_ID = ${companyId}`;
            }

            const records = await this.dataSource.query(query);
            const currentDb = records?.[0]?.UserDatabase || '';

            return {
                ...records,
                length: records.length,
                UserEmpCode: [],
                UserDatabase: currentDb,
                ErpDatabase: currentDb
            };
        } catch (e) {
            this.logger.error('Error in getCompanyListUserWiseList from CNFCOMPANY', e);
            throw e;
        }
    }

    async getSpData(data: any) {
        if (!data) return [];
        const spName = (data.SPname || data.name || '').trim();

        // 1. Sel_UserWiseCompUnit: Read directly from MSTCOMPUNITS table in database
        if (spName === 'Sel_UserWiseCompUnit') {
            try {
                const units = await this.dataSource.query(`
                    SELECT CODE, NAME, STATUS_CODE
                    FROM MSTCOMPUNITS
                    WHERE STATUS_CODE = 0
                `);
                return data.multiflag ? [units] : units;
            } catch (e) {
                this.logger.error('Error querying MSTCOMPUNITS', e);
                return data.multiflag ? [[]] : [];
            }
        }

        // 2. Sel_GetModuleWiseMainMenu / Sel_USRGetModuleWiseMainMenu
        if (spName === 'Sel_GetModuleWiseMainMenu' || spName === 'Sel_USRGetModuleWiseMainMenu') {
            return await this.Sel_GetModuleWiseMainMenu(data);
        }

        // 3. Generic SP execution
        try {
            if (spName) {
                const params = data.params || [];
                const paramStr = Array.isArray(params) ? params.join(', ') : '';
                const queryStr = paramStr ? `EXEC ${spName} ${paramStr}` : `EXEC ${spName}`;
                const res = await this.dataSource.query(queryStr);
                return data.multiflag ? [res] : res;
            }
        } catch (e) {
            this.logger.warn(`SP ${spName} execution: ${e.message}`);
        }

        return data.multiflag ? [[]] : [];
    }

    async Sel_GetModuleWiseMainMenu(data: any) {
        try {
            const driver = this.dataSource.driver as any;
            const pool = driver.master;
            const req = pool.request();
            const companyId = String(data?.COMPANY_ID || '10');
            const userId = String(data?.USER_ID || 'ADMIN');
            const moduleNo = String(data?.MODULE_NO ?? '0');
            const statusCode = Number(data?.STATUS_CODE || 0);

            req.input('chrCompanyId', companyId);
            req.input('chrUserId', userId);
            req.input('chrModuleNo', moduleNo);
            req.input('intLoginIdentity', statusCode);

            let res;
            try {
                res = await req.execute('Sel_USRGetModuleWiseMainMenu');
            } catch (spErr) {
                this.logger.warn(`Trying fallback Sel_GetModuleWiseMainMenu: ${spErr.message}`);
                res = await req.execute('Sel_GetModuleWiseMainMenu');
            }

            return res.recordsets;
        } catch (e) {
            this.logger.error('Error in Sel_GetModuleWiseMainMenu', e);
            return [[], []];
        }
    }

    async getHrmsDashboardData(body?: any) {
        try {
            const driver = this.dataSource.driver as any;
            const pool = driver.master;

            // 1. Get current fin year
            let finYear = '20252026';
            try {
                const fyRes = await this.dataSource.query(`SELECT TOP 1 FIN_YEAR FROM CNFFINANCIALYEAR ORDER BY FIN_YEAR DESC`);
                if (fyRes?.length && fyRes[0].FIN_YEAR) {
                    finYear = String(fyRes[0].FIN_YEAR);
                }
            } catch (e) { }

            // 2. Execute Sel_DbEmployeeDetails
            let deptData: any[] = [];
            let dsgData: any[] = [];
            let cityData: any[] = [];
            let monthlyJoinData: any[] = [];
            try {
                const req = pool.request();
                req.input('intFinYear', finYear);
                const res = await req.execute('Sel_DbEmployeeDetails');
                const recordsets = res.recordsets || [];
                deptData = recordsets[0] || [];
                dsgData = recordsets[2] || [];
                const foundCity = recordsets.find((rs: any[]) => rs?.length > 0 && rs[0]?.CITY_NAME !== undefined);
                cityData = foundCity || recordsets[6] || [];
                // Look for the recordset with MONTH_NAME
                const foundMonthly = recordsets.find((rs: any[]) => rs?.length > 0 && rs[0]?.MONTH_NAME !== undefined);
                monthlyJoinData = foundMonthly || [];
            } catch (e: any) {
                this.logger.warn(`Sel_DbEmployeeDetails failed: ${e?.message}`);
            }

            // 3. Execute Sel_DBReminderList
            let punchMissouts: any[] = [];
            let reminders: any[] = [];
            try {
                const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const req2 = pool.request();
                req2.input('chrTranDate', todayStr);
                const res2 = await req2.execute('Sel_DBReminderList');
                reminders = res2.recordsets?.[0] || [];
                punchMissouts = res2.recordsets?.[1] || [];

                // If today has 0 punch missouts, grab latest available punch missouts from TRNPAYDAILYATT
                if (!punchMissouts || punchMissouts.length === 0) {
                    const latestMissouts = await this.dataSource.query(`
                        SELECT TOP 8 TRN.EMP_NO, EMP.NAME, 
                               SUM(CASE WHEN TRN.IN_TIME = '00:00' OR TRN.IN_TIME IS NULL THEN 1 ELSE 0 END) AS IN_COUNT,
                               SUM(CASE WHEN TRN.OUT_TIME = '00:00' OR TRN.OUT_TIME IS NULL THEN 1 ELSE 0 END) AS OUT_COUNT
                        FROM TRNPAYDAILYATT TRN
                        INNER JOIN MSTEMPLOYEE EMP ON TRN.EMP_NO = EMP.EMP_NO
                        WHERE TRN.STATUS_CODE = 0 AND TRN.PRESENT_DAYS = 1 AND (TRN.OUT_TIME = '00:00' OR TRN.OUT_TIME IS NULL)
                        GROUP BY TRN.EMP_NO, EMP.NAME
                    `);
                    punchMissouts = latestMissouts || [];
                }
            } catch (e: any) {
                this.logger.warn(`Sel_DBReminderList failed: ${e?.message}`);
            }

            // 4. Execute SEL_RptEmpBDayList for current month
            let birthdayList: any[] = [];
            try {
                const currentMonth = String(new Date().getMonth() + 1);
                const req3 = pool.request();
                req3.input('chrBDate', currentMonth);
                req3.input('intCompUnitId', 0);
                req3.input('intDeptCode', 0);
                const res3 = await req3.execute('SEL_RptEmpBDayList');
                birthdayList = res3.recordset || [];
            } catch (e: any) {
                this.logger.warn(`SEL_RptEmpBDayList failed: ${e?.message}`);
            }

            // 5. Total counts & summary
            let totalActive = 0;
            let totalDepts = 0;
            try {
                const empCountRes = await this.dataSource.query(`SELECT COUNT(*) AS total FROM MSTEMPLOYEE WHERE STATUS_CODE = 0`);
                totalActive = empCountRes?.[0]?.total || 0;
                const deptCountRes = await this.dataSource.query(`SELECT COUNT(*) AS total FROM MSTEMPDEPARTMENT WHERE STATUS_CODE = 0`);
                totalDepts = deptCountRes?.[0]?.total || 0;
            } catch (e) { }

            // 6. Recent Daily Attendance Summary (from latest available date in TRNPAYDAILYATT)
            let attendanceSummary: any = { present: 0, absent: 0, latemark: 0, date: '' };
            let recentAttendanceList: any[] = [];
            try {
                const maxDateRes = await this.dataSource.query(`SELECT MAX(TRAN_DATE) AS maxDate FROM TRNPAYDAILYATT WHERE STATUS_CODE = 0`);
                const maxDate = maxDateRes?.[0]?.maxDate;
                if (maxDate) {
                    attendanceSummary.date = maxDate;
                    const stats = await this.dataSource.query(`
                        SELECT 
                            SUM(CASE WHEN PRESENT_DAYS > 0 THEN 1 ELSE 0 END) AS presentCount,
                            SUM(CASE WHEN PRESENT_DAYS = 0 THEN 1 ELSE 0 END) AS absentCount,
                            SUM(CASE WHEN IS_LATEMARK = 1 THEN 1 ELSE 0 END) AS lateCount
                        FROM TRNPAYDAILYATT
                        WHERE TRAN_DATE = '${maxDate}' AND STATUS_CODE = 0
                    `);
                    if (stats?.length) {
                        attendanceSummary.present = Number(stats[0].presentCount || 0);
                        attendanceSummary.absent = Number(stats[0].absentCount || 0);
                        attendanceSummary.latemark = Number(stats[0].lateCount || 0);
                    }

                    recentAttendanceList = await this.dataSource.query(`
                        SELECT TOP 8 
                            A.EMP_NO, E.NAME AS EMP_NAME, D.NAME AS DEPT_NAME, A.IN_TIME, A.OUT_TIME,
                            CASE WHEN A.PRESENT_DAYS > 0 THEN 'PRESENT' ELSE 'ABSENT' END AS STATUS,
                            A.IS_LATEMARK
                        FROM TRNPAYDAILYATT A
                        INNER JOIN MSTEMPLOYEE E ON A.EMP_NO = E.EMP_NO
                        LEFT JOIN MSTEMPDEPARTMENT D ON E.DEPT_CODE = D.CODE
                        WHERE A.TRAN_DATE = '${maxDate}' AND A.STATUS_CODE = 0
                        ORDER BY A.EMP_NO ASC
                    `);
                }
            } catch (e: any) {
                this.logger.warn(`Attendance summary failed: ${e?.message}`);
            }

            return {
                statusCode: 200,
                finYear,
                kpis: {
                    totalActiveEmployees: totalActive,
                    totalDepartments: totalDepts,
                    upcomingBirthdaysCount: birthdayList.length,
                    punchMissoutsCount: punchMissouts.length,
                    attendanceSummary
                },
                departmentDistribution: deptData,
                designationDistribution: dsgData,
                cityDistribution: cityData,
                monthlyJoinTrend: monthlyJoinData,
                birthdays: birthdayList,
                punchMissouts: punchMissouts,
                recentAttendance: recentAttendanceList,
                reminders: reminders
            };
        } catch (err: any) {
            this.logger.error('Error generating HRMS dashboard data', err);
            return { statusCode: 500, message: err?.message };
        }
    }

    async getModuleDashboardData(body: any) {
        try {
            const moduleNo = Number(body?.moduleNo || 10);
            const driver = this.dataSource.driver as any;
            const pool = driver.master;

            // 1. Fetch all report menus available for this module
            let reportMenus: any[] = [];
            try {
                reportMenus = await this.dataSource.query(`
                    SELECT DISTINCT MENU_KEY, MENU_CAPTION, MENU_NAV_PAGE
                    FROM USRMENUS
                    WHERE MODULE_NO = ${moduleNo} AND MENU_NAV_PAGE IS NOT NULL AND MENU_NAV_PAGE LIKE '%Rpt%'
                    ORDER BY MENU_CAPTION
                `);
            } catch (e) {
                this.logger.warn(`Failed fetching report menus for module ${moduleNo}: ${e.message}`);
            }

            // 2. Module specific logic
            let kpis: any = {};
            let charts: any = {};
            let details: any = {};

            if (moduleNo === 10) {
                // === Module 10: Employee Management ===
                const empStats = await this.dataSource.query(`
                    SELECT 
                        COUNT(*) AS total,
                        SUM(CASE WHEN STATUS_CODE = 0 THEN 1 ELSE 0 END) AS active,
                        SUM(CASE WHEN GENDER = 'M' THEN 1 ELSE 0 END) AS male,
                        SUM(CASE WHEN GENDER = 'F' THEN 1 ELSE 0 END) AS female
                    FROM MSTEMPLOYEE
                `);
                const deptBreakdown = await this.dataSource.query(`
                    SELECT D.NAME, COUNT(E.EMP_NO) AS count
                    FROM MSTEMPDEPARTMENT D
                    LEFT JOIN MSTEMPLOYEE E ON D.CODE = E.DEPT_CODE AND E.STATUS_CODE = 0
                    WHERE D.STATUS_CODE = 0
                    GROUP BY D.NAME
                    HAVING COUNT(E.EMP_NO) > 0
                    ORDER BY count DESC
                `);
                const dsgBreakdown = await this.dataSource.query(`
                    SELECT TOP 8 DS.NAME, COUNT(E.EMP_NO) AS count
                    FROM MSTEMPDESIGNATION DS
                    LEFT JOIN MSTEMPLOYEE E ON DS.CODE = E.DESIGNATION_CODE AND E.STATUS_CODE = 0
                    WHERE DS.STATUS_CODE = 0
                    GROUP BY DS.NAME
                    HAVING COUNT(E.EMP_NO) > 0
                    ORDER BY count DESC
                `);

                // Birthdays
                const bdayList = await this.dataSource.query(`
                    SELECT TOP 8 NAME, BIRTH_DATE, SUBSTRING(BIRTH_DATE, 7, 2) AS DAY_NO
                    FROM MSTEMPLOYEE
                    WHERE STATUS_CODE = 0 AND SUBSTRING(BIRTH_DATE, 5, 2) = SUBSTRING(CONVERT(VARCHAR(8), GETDATE(), 112), 5, 2)
                    ORDER BY SUBSTRING(BIRTH_DATE, 7, 2)
                `);

                kpis = {
                    totalEmployees: empStats?.[0]?.total || 0,
                    activeEmployees: empStats?.[0]?.active || 0,
                    maleCount: empStats?.[0]?.male || 0,
                    femaleCount: empStats?.[0]?.female || 0,
                    birthdaysCount: bdayList.length
                };
                charts = {
                    departments: deptBreakdown,
                    designations: dsgBreakdown
                };
                details = { birthdays: bdayList };

            } else if (moduleNo === 20) {
                // === Module 20: Payroll ===
                // Get latest month payroll from TRNPAYMTHPAYH
                const maxPayDateRes = await this.dataSource.query(`
                    SELECT MAX(TRAN_DATE) AS maxDate FROM TRNPAYMTHPAYH WHERE STATUS_CODE = 0
                `);
                const maxDate = maxPayDateRes?.[0]?.maxDate || '20260831';

                const payStats = await this.dataSource.query(`
                    SELECT 
                        COUNT(DISTINCT EMP_NO) AS empCount,
                        SUM(EARNING_AMT) AS totalGross,
                        SUM(DEDUCTION_AMT) AS totalDeductions,
                        SUM(NETPAY_AMT) AS totalNet
                    FROM TRNPAYMTHPAYH
                    WHERE TRAN_DATE = '${maxDate}' AND STATUS_CODE = 0
                `);

                // Trend across months
                const payTrend = await this.dataSource.query(`
                    SELECT TOP 6 
                        TRAN_DATE,
                        COUNT(DISTINCT EMP_NO) AS empCount,
                        SUM(EARNING_AMT) AS gross,
                        SUM(NETPAY_AMT) AS net,
                        SUM(DEDUCTION_AMT) AS deductions
                    FROM TRNPAYMTHPAYH
                    WHERE STATUS_CODE = 0
                    GROUP BY TRAN_DATE
                    ORDER BY TRAN_DATE ASC
                `);

                // Department-wise Salary Expense
                const deptSalary = await this.dataSource.query(`
                    SELECT TOP 8 D.NAME, SUM(P.EARNING_AMT) AS totalGross
                    FROM TRNPAYMTHPAYH P
                    INNER JOIN MSTEMPDEPARTMENT D ON P.DEPT_CODE = D.CODE
                    WHERE P.TRAN_DATE = '${maxDate}' AND P.STATUS_CODE = 0
                    GROUP BY D.NAME
                    ORDER BY totalGross DESC
                `);

                kpis = {
                    payDate: maxDate,
                    employeesPaid: payStats?.[0]?.empCount || 0,
                    totalGross: payStats?.[0]?.totalGross || 0,
                    totalNet: payStats?.[0]?.totalNet || 0,
                    totalDeductions: payStats?.[0]?.totalDeductions || 0
                };
                charts = {
                    trend: payTrend,
                    departmentSalary: deptSalary
                };

            } else if (moduleNo === 22) {
                // === Module 22: Bonus ===
                const bonusStats = await this.dataSource.query(`
                    SELECT 
                        COUNT(DISTINCT EMP_NO) AS eligibleCount,
                        SUM(GROSSEARNING_AMT) AS totalEligibleWages,
                        SUM(NETPAY_AMT) AS totalBonusAmount,
                        AVG(BONUS_RATE) AS avgRate
                    FROM TRNPAYBONUSH
                    WHERE STATUS_CODE = 0
                `);

                const deptBonus = await this.dataSource.query(`
                    SELECT TOP 6 D.NAME, SUM(B.NETPAY_AMT) AS bonusAmount, COUNT(B.EMP_NO) AS empCount
                    FROM TRNPAYBONUSH B
                    INNER JOIN MSTEMPDEPARTMENT D ON B.DEPT_CODE = D.CODE
                    WHERE B.STATUS_CODE = 0
                    GROUP BY D.NAME
                    ORDER BY bonusAmount DESC
                `);

                const recentBonusEmployees = await this.dataSource.query(`
                    SELECT TOP 8 B.EMP_NO, B.NAME, D.NAME AS DEPT_NAME, B.BONUS_RATE, B.NETPAY_AMT
                    FROM TRNPAYBONUSH B
                    LEFT JOIN MSTEMPDEPARTMENT D ON B.DEPT_CODE = D.CODE
                    WHERE B.STATUS_CODE = 0
                    ORDER BY B.NETPAY_AMT DESC
                `);

                kpis = {
                    eligibleCount: bonusStats?.[0]?.eligibleCount || 0,
                    totalBonusAmount: bonusStats?.[0]?.totalBonusAmount || 0,
                    totalEligibleWages: bonusStats?.[0]?.totalEligibleWages || 0,
                    avgRate: bonusStats?.[0]?.avgRate || 8.33
                };
                charts = {
                    deptBonus
                };
                details = {
                    recentBonusEmployees
                };

            } else if (moduleNo === 25) {
                // === Module 25: Leave Management ===
                const leaveTypes = await this.dataSource.query(`
                    SELECT L.CODE, L.NAME, SUM(ABS(P.LEAVE_DAYS)) AS totalDays
                    FROM TRNPAYLEAVEPOST P
                    INNER JOIN MSTPAYLEAVES L ON P.LEAVE_CODE = L.CODE
                    WHERE P.STATUS_CODE = 0 AND P.LEAVE_DAYS < 0
                    GROUP BY L.CODE, L.NAME
                `);

                const totalLeavesTakenRes = await this.dataSource.query(`
                    SELECT SUM(ABS(LEAVE_DAYS)) AS totalDays
                    FROM TRNPAYLEAVEPOST
                    WHERE STATUS_CODE = 0 AND LEAVE_DAYS < 0
                `);

                const recentLeaves = await this.dataSource.query(`
                    SELECT TOP 8 P.TRAN_DATE, E.NAME AS EMP_NAME, L.NAME AS LEAVE_NAME, ABS(P.LEAVE_DAYS) AS DAYS
                    FROM TRNPAYLEAVEPOST P
                    INNER JOIN MSTEMPLOYEE E ON P.EMP_NO = E.EMP_NO
                    INNER JOIN MSTPAYLEAVES L ON P.LEAVE_CODE = L.CODE
                    WHERE P.STATUS_CODE = 0 AND P.LEAVE_DAYS < 0
                    ORDER BY P.TRAN_DATE DESC
                `);

                kpis = {
                    totalLeavesAvailed: totalLeavesTakenRes?.[0]?.totalDays || 0,
                    leaveTypesCount: leaveTypes.length,
                    activeLeaveCategories: 6
                };
                charts = {
                    leaveDistribution: leaveTypes
                };
                details = {
                    recentLeaves
                };

            } else if (moduleNo === 30) {
                // === Module 30: Time Office ===
                const maxAttDateRes = await this.dataSource.query(`
                    SELECT MAX(TRAN_DATE) AS maxDate FROM TRNPAYDAILYATT WHERE STATUS_CODE = 0
                `);
                const maxDate = maxAttDateRes?.[0]?.maxDate || '20261007';

                const attStats = await this.dataSource.query(`
                    SELECT 
                        SUM(CASE WHEN PRESENT_DAYS > 0 THEN 1 ELSE 0 END) AS presentCount,
                        SUM(CASE WHEN PRESENT_DAYS = 0 THEN 1 ELSE 0 END) AS absentCount,
                        SUM(CASE WHEN IS_LATEMARK = 1 THEN 1 ELSE 0 END) AS lateCount,
                        SUM(CASE WHEN OUT_TIME = '00:00' OR OUT_TIME IS NULL THEN 1 ELSE 0 END) AS missoutCount
                    FROM TRNPAYDAILYATT
                    WHERE TRAN_DATE = '${maxDate}' AND STATUS_CODE = 0
                `);

                const shiftStats = await this.dataSource.query(`
                    SELECT S.NAME AS SHIFT_NAME, COUNT(A.EMP_NO) AS EMP_COUNT
                    FROM TRNPAYDAILYATT A
                    LEFT JOIN MSTCOMMSHIFT S ON A.SHIFT = S.CODE
                    WHERE A.TRAN_DATE = '${maxDate}' AND A.STATUS_CODE = 0
                    GROUP BY S.NAME
                `);

                const missoutList = await this.dataSource.query(`
                    SELECT TOP 8 A.EMP_NO, E.NAME, A.IN_TIME, A.OUT_TIME
                    FROM TRNPAYDAILYATT A
                    INNER JOIN MSTEMPLOYEE E ON A.EMP_NO = E.EMP_NO
                    WHERE A.STATUS_CODE = 0 AND A.PRESENT_DAYS = 1 AND (A.OUT_TIME = '00:00' OR A.OUT_TIME IS NULL)
                    ORDER BY A.TRAN_DATE DESC
                `);

                kpis = {
                    attDate: maxDate,
                    presentCount: attStats?.[0]?.presentCount || 0,
                    absentCount: attStats?.[0]?.absentCount || 0,
                    lateCount: attStats?.[0]?.lateCount || 0,
                    missoutCount: attStats?.[0]?.missoutCount || 0
                };
                charts = {
                    shifts: shiftStats
                };
                details = {
                    missouts: missoutList
                };

            } else {
                // Default fallback for other modules (e.g. 35, 99)
                kpis = {
                    moduleNo,
                    availableReports: reportMenus.length
                };
            }

            return {
                statusCode: 200,
                moduleNo,
                kpis,
                charts,
                details,
                reportMenus
            };
        } catch (err: any) {
            this.logger.error(`Error in getModuleDashboardData for module ${body?.moduleNo}`, err);
            return { statusCode: 500, message: err?.message, reportMenus: [] };
        }
    }
}

// [commit 106]: feat(common): implement dynamic company master list lookup

// [commit 107]: feat(common): implement financial year posting period resolver

// [commit 108]: feat(common): implement employee autocomplete search service

// [commit 109]: feat(common): implement department-wise employee count aggregation
