import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PublicModule } from './public/public.module';
import { CommonModule } from './libs/Common/common.module';
import { CommonMethodsModule } from './modules/CommonMethods/common-methods.module';
import { ToolsModule } from './tools/tools.module';

import {
  __MSSQL_DB_SERVER,
  __MSSQL_DB_PORT,
  __MSSQL_DB_USER,
  __MSSQL_DB_PASSWORD,
  __MSSQL_DATABASE_MAIN,
  __MSSQL_DB_USSERVER,
  __MSSQL_DB_USPORT,
  __MSSQL_DB_USUSER,
  __MSSQL_DB_USPASSWORD,
  __MSSQL_DATABASE_USER
} from './config/config.config';

import { DataSource } from 'typeorm';
import {
  setDefaultDbSource,
  createDataSourceProxy,
  setDefaultUserDbSource,
  CustomDbLogger
} from './database/connection_manager';
import { APP_ENTITIES } from './database/entities';
import { CompanyContextMiddleware } from './database/company-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => ({
        type: 'mssql',
        host: __MSSQL_DB_SERVER,
        port: __MSSQL_DB_PORT,
        username: __MSSQL_DB_USER,
        password: __MSSQL_DB_PASSWORD,
        database: __MSSQL_DATABASE_MAIN,
        entities: APP_ENTITIES,
        synchronize: false,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
        logging: true,
      }),
      dataSourceFactory: async (options) => {
        const mssqlOpts = options as any;
        const dbName = typeof mssqlOpts.database === 'string' ? mssqlOpts.database : 'default_db';
        const dataSource = new DataSource({
          ...options,
          logger: new CustomDbLogger(`${mssqlOpts.host}:${mssqlOpts.port}/${dbName}`, 'DEFAULT'),
        });
        console.log(`\x1b[32m[DefaultDB] Connecting to default database: ${dbName} at ${mssqlOpts.host}:${mssqlOpts.port}...\x1b[0m`);
        await dataSource.initialize();
        console.log(`\x1b[32m[DefaultDB] Successfully connected to default database: ${dbName}\x1b[0m`);
        setDefaultDbSource(dataSource);
        return createDataSourceProxy(dataSource, false);
      },
    }),
    TypeOrmModule.forRootAsync({
      name: 'userConnection',
      useFactory: async () => ({
        type: 'mssql',
        host: __MSSQL_DB_USSERVER,
        port: __MSSQL_DB_USPORT,
        username: __MSSQL_DB_USUSER,
        password: __MSSQL_DB_USPASSWORD,
        database: __MSSQL_DATABASE_USER,
        synchronize: false,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
        logging: true,
      }),
      dataSourceFactory: async (options) => {
        const mssqlOpts = options as any;
        const dbName = typeof mssqlOpts.database === 'string' ? mssqlOpts.database : 'default_user_db';
        const dataSource = new DataSource({
          ...options,
          logger: new CustomDbLogger(`${mssqlOpts.host}:${mssqlOpts.port}/${dbName}`, 'DEFAULT'),
        });
        console.log(`\x1b[32m[DefaultUserDB] Connecting to default user database: ${dbName} at ${mssqlOpts.host}:${mssqlOpts.port}...\x1b[0m`);
        await dataSource.initialize();
        console.log(`\x1b[32m[DefaultUserDB] Successfully connected to default user database: ${dbName}\x1b[0m`);
        setDefaultUserDbSource(dataSource);
        return createDataSourceProxy(dataSource, true);
      },
    }),
    TypeOrmModule.forFeature(APP_ENTITIES),
    CommonModule,
    CommonMethodsModule,
    AuthModule,
    PublicModule,
    ToolsModule
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CompanyContextMiddleware)
      .forRoutes('*');
  }
}
