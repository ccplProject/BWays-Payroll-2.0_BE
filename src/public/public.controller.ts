import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { Public } from '../auth/Public';

@Controller('public')
export class PublicController {

    @Public()
    @Get('getSiteConfig')
    async getSiteConfig(@Query('key') key: string, @Req() req: any) {
        const filePath = join(__dirname, '..', '..', 'site.config.js');
        if (!fs.existsSync(filePath)) {
            return {
                URL: {
                    oldSiteUrl: 'http://192.168.1.207/PayWebSite/Login.Aspx'
                }
            };
        }

        try {
            delete require.cache[require.resolve(filePath)];
            const config = require(filePath);
            const selectedKey = (key || 'DEFAULT').toUpperCase();
            const siteConfig = config[selectedKey] || config['DEFAULT'] || {};
            return siteConfig;
        } catch (e) {
            return {
                URL: {
                    oldSiteUrl: 'http://192.168.1.207/PayWebSite/Login.Aspx'
                }
            };
        }
    }

    @Public()
    @Post('Sel_LastUser')
    async Sel_LastUser(@Body() body: any) {
        // Return 2D array matching multiflag structure so client indexing never fails
        return [[], []];
    }

    @Public()
    @Post('Sel_GetUserInfo')
    async Sel_GetUserInfo(@Body() body: any) {
        // Fallback for user info check - granting unit/company access
        return [{
            USER_ID: body?.chrUserId || '',
            STATUS_CODE: 0,
            EXPIRE_DAYS: 999,
            IS_MULTICOMPANY: 0
        }];
    }

    @Public()
    @Post('AddWorkLog')
    async AddWorkLog(@Body() body: any) {
        return { success: true };
    }
}
