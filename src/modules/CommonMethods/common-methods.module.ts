import { Module } from '@nestjs/common';
import { CommonMethodsService } from './common-methods.service';
import { CommonMethodsController } from './common-methods.controller';

@Module({
    providers: [CommonMethodsService],
    controllers: [CommonMethodsController],
    exports: [CommonMethodsService],
})
export class CommonMethodsModule { }
