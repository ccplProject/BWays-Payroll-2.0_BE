import { Module } from '@nestjs/common';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { WebHelpViewService } from '../../web/web-help-view.service';


@Module({
    controllers: [CommonController],
    providers: [CommonService, WebHelpViewService],
    exports: [CommonService, WebHelpViewService],
})
export class CommonModule { }