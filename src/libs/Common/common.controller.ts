import { Controller, Post, Body } from '@nestjs/common';
import { CommonService } from './common.service';
import { Public } from '../../auth/Public';

@Controller('common')
export class CommonController {
    constructor(private readonly commonService: CommonService) { }

    @Public()
    @Post('/getCompanyListUserWise')
    async getCompanyListUserWise(@Body() data: any) {
        return await this.commonService.getCompanyListUserWise(data);
    }

    @Public()
    @Post('/getCompanyListUserWiseList')
    async getCompanyListUserWiseList(@Body() data: any) {
        return await this.commonService.getCompanyListUserWiseList(data);
    }

    @Public()
    @Post('/Sel_GetModuleWiseMainMenu')
    async Sel_GetModuleWiseMainMenu(@Body() body: any) {
        return await this.commonService.Sel_GetModuleWiseMainMenu(body);
    }

    @Public()
    @Post('/getHrmsDashboard')
    async getHrmsDashboard(@Body() body: any) {
        return await this.commonService.getHrmsDashboardData(body);
    }

    @Public()
    @Post('/getModuleDashboardData')
    async getModuleDashboardData(@Body() body: any) {
        return await this.commonService.getModuleDashboardData(body);
    }

    @Public()
    @Post('/getSpData')
    async getSpData(@Body() data: any) {
        return await this.commonService.getSpData(data);
    }

    @Public()
    @Post('/getUserSpdata')
    async getUserSpdata(@Body() data: any) {
        return await this.commonService.getSpData(data);
    }

    @Public()
    @Post('/getSp')
    async getSp(@Body() data: any) {
        return await this.commonService.getSpData(data);
    }

    @Post('/Get_HelpList')
    async Get_HelpList(@Body() data: any) {
        if (data?.WhereClauseDesc) {
            const idx = data.WhereClauseDesc.search(/(^|\s+)ORDER\s+BY\s+/i);
            if (idx >= 0) data.WhereClauseDesc = data.WhereClauseDesc.slice(0, idx).trim();
        }
        return this.commonService.Get_HelpList(data);
    }

    @Post('Get_TableFields')
    async Get_TableFields(@Body() data: any) {
        return this.commonService.GetTableFields(data.CompanyID, data.ChrTableName, data.ChrFields, data.WhereClause);
    }

    @Post('Get_MastDataList')
    async GetMastDataList(@Body() data: any) {
        const stripOrderBy = (s: string): string => {
            const idx = (s ?? '').search(/(^|\s+)ORDER\s+BY\s+/i);
            return idx >= 0 ? s.slice(0, idx).trim() : (s ?? '');
        };

        const rawDesc: string = (data.WhereClauseDesc ?? '').trim();
        const orderByIdx = rawDesc.search(/(^|\s+)ORDER\s+BY\s+/i);
        const whereClause = stripOrderBy(
            data.WhereClause ?? (orderByIdx >= 0 ? rawDesc.slice(0, orderByIdx).trim() : rawDesc)
        );
        const rawSortOrder: string = data.SortOrder
            ?? (orderByIdx >= 0 ? rawDesc.slice(orderByIdx).replace(/^\s*ORDER\s+BY\s+/i, '').trim() : '');
        const sortOrder = /^\d+$/.test((rawSortOrder ?? '').trim()) ? '' : (rawSortOrder ?? '');

        let result = await this.commonService.GetMastDataList(
            data.CompanyID,
            data.ChrTableName ?? data.TableName ?? '',
            data.CoIDColumns ?? '',
            data.HelpColumns ?? '',
            whereClause,
            sortOrder,
            data.OutPutType ?? 1,
        );
        return result[0];
    }
}
