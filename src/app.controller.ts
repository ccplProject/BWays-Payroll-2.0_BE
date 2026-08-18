import { Body, Controller, Delete, Get, Patch, Post, Put, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { __OTP_DATA_ENC_KEY } from './config/config.config';
import { Public } from './auth/Public';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }


  @Public() @Get() @Post() @Put() @Patch() @Delete()
  get(@Req() req) {
    let all_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let ip = all_ip;

    if (all_ip) {
      // If multiple IPs → take first one
      ip = all_ip.split(',')[0].trim();
      // Remove port if exists (e.g. 10.0.0.1:53214)
      ip = all_ip.split(':')[0];
    }
    return {
      message: "BWays Platform... :)",
      all_ip: all_ip,
      ip: ip
    }
  }
}
