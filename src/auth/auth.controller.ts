import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService
    ) { }

    @Post('')
    async signIn(@Body() data: any) {
        const user = await this.authService.findOne(data.username);
        let result: boolean = false;
        if (user.length != 0) {
            let temp: any;
            if (data.pass != '') {
                temp = this.authService.encrypt3DES(data.pass);
            } else {
                temp = null;
            }
            if (user[0]?.PASSWORD == temp) {
                //------------ password mathc
                result = true;
            } else {
                throw new UnauthorizedException('Invalid Password', {
                    cause: new Error(),
                    description: 'Invalid Password',
                });
            }
        } else {
            throw new UnauthorizedException('Invalid Username', {
                cause: new Error(),
                description: 'Invalid Username',
            });
            // throw new UnauthorizedException({
            //   STATUS_CODE: 21,
            //   message: 'Invalid User Name',
            // });
        }

        if (!result) {
            throw new UnauthorizedException('Invalid Password', {
                cause: new Error(),
                description: 'Invalid Password',
            });
            // // throw new UnauthorizedException({
            // //   STATUS_CODE: 22,
            // //   message: 'Invalid Password',
            // });
        }
        const payload = { sub: user[0].USER_ID || user[0].userId, username: user[0].USER_ID || user[0].username };
        let session_id = await this.generateRandamString(12);
        if (user[0].PASSWORD) delete user[0].PASSWORD;
        if (user[0].NEW_PASSWORD) delete user[0].NEW_PASSWORD;

        return {
            access_token: await this.jwtService.signAsync(payload, { secret: 'BDS', expiresIn: '8h' }),
            session_id: session_id,
            userInfo: user[0],
            STATUS_CODE: '0'
        };
    }

    @Post('company-list')
    async getCompanyList(@Body() data: any) {
        return await this.authService.getAssignedCompanies(data?.USER_ID || '');
    }

    @Post('getCompanyListUserWise')
    async getCompanyListUserWise(@Body() data: any) {
        return await this.authService.getAssignedCompanies(data?.USER_ID || '');
    }

    @Post('getCompanyListUserWiseList')
    async getCompanyListUserWiseList(@Body() data: any) {
        const companies = await this.authService.getAssignedCompanies(data?.USER_ID || '');
        const selected = companies.filter((c: any) => c.COMPANY_ID === data?.COMPANY_ID) || companies;
        return selected;
    }

    async generateRandamString(length: number) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
