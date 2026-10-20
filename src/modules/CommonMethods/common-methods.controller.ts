import { Controller, Post, Body } from '@nestjs/common';
import { CommonMethodsService } from './common-methods.service';

@Controller('CommonMethods')
export class CommonMethodsController {
    constructor(private readonly commonMethodsService: CommonMethodsService) { }

    @Post('GetDates')
    async GetDates(@Body() body: any) {
        return this.commonMethodsService.GetDates(body.CompanyID, body.DisplayCode, body.NoOfDays);
    }

    @Post('GetMonthList')
    async GetMonthList(@Body() body: any) {
        return this.commonMethodsService.GetMonthList(body.CompanyID, body.NoofMths);
    }

    @Post('GetAMCMonthList')
    async GetAMCMonthList(@Body() body: any) {
        return this.commonMethodsService.GetAMCMonthList(body.CompanyID, body.NoofMths, body.AMCDate);
    }

    @Post('GetWeekWiseDates')
    async GetWeekWiseDates(@Body() body: any) {
        return this.commonMethodsService.GetWeekWiseDates(body.CompanyID, body.MonthDate, body.AvoidDay);
    }

    @Post('GetWeekDates')
    async GetWeekDates(@Body() body: any) {
        return this.commonMethodsService.GetWeekDates(body.CompanyID, body.MonthDate, body.AvoidDay, body.WeekDay);
    }

    @Post('GetMonths')
    async GetMonths(@Body() body: any) {
        return this.commonMethodsService.GetMonths(body.CompanyID);
    }

    @Post('GetYears')
    async GetYears(@Body() body: any) {
        return this.commonMethodsService.GetYears(body.CompanyID, body.LastNoOfYears, body.NextNoOfYears);
    }

    @Post('GetFromToDates')
    async GetFromToDates(@Body() body: any) {
        return this.commonMethodsService.GetFromToDates(body.CompanyID, body.FromDate, body.ToDate, body.AvoidDay, body.WeekDay);
    }

    @Post('GetTableFields')
    async GetTableFields(@Body() body: any) {
        return this.commonMethodsService.GetTableFields(body.CompanyID, body.TableName, body.OutputFields, body.WhereClause);
    }

    @Post('GetUserTableFields')
    async GetUserTableFields(@Body() body: any) {
        return this.commonMethodsService.GetUserTableFields(body.TableName, body.OutputFields, body.WhereClause);
    }

    @Post('GetConstAccount')
    async GetConstAccount(@Body() body: any) {
        return this.commonMethodsService.GetConstAccount(
            body.CompanyID || body.ComapnyID,
            body.WhereClause,
            body.TableName || 'MSTACCTCONST'
        );
    }

    @Post('UpdateTableFields')
    async UpdateTableFields(@Body() body: any) {
        return this.commonMethodsService.UpdateTableFields(body.CompanyID, body.TableName, body.UpdFields, body.WhereClause);
    }

    @Post('DeleteTableData')
    async DeleteTableData(@Body() body: any) {
        return this.commonMethodsService.DeleteTableData(body.CompanyID, body.TableName, body.WhereClause);
    }

    @Post('GetMenuViewPage')
    async GetMenuViewPage(@Body() body: any) {
        return this.commonMethodsService.GetMenuViewPage(body.MenuDocno);
    }

    @Post('GetNextRefTranNo')
    async GetNextRefTranNo(@Body() body: any) {
        return this.commonMethodsService.GetNextRefTranNo(
            body.TableName,
            body.CompanyID,
            body.VoucheType,
            body.VoucheSubType,
            body.VoucherSeries,
            body.Tablefield,
            body.EffDate,
        );
    }

    @Post('GetAssignedCompanyList')
    async GetAssignedCompanyList(@Body() body: any) {
        return this.commonMethodsService.GetAssignedCompanyList(body.UserID);
    }

    @Post('ExecuteSp')
    async ExecuteSp(@Body() body: any) {
        return this.commonMethodsService.ExecuteSp(body.CompanyID, body.SpName, body.parameters || {});
    }

    @Post('MastDataList')
    async MastDataList(@Body() body: any) {
        return this.commonMethodsService.MastDataList(
            body.CompanyID,
            body.TableName,
            body.CoIDColumns || '',
            body.HelpColumns || '',
            body.WhereClause || '',
            body.SortOrder || '',
            body.OutPutType || 1,
        );
    }

    @Post('menuDetails')
    async menuDetails(@Body() body: any) {
        return this.commonMethodsService.menuDetails(body);
    }
}

// [commit 100]: feat(common-methods): add column sorting in common methods controller
