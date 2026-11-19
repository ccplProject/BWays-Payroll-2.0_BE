import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ToolsService,
  SaveReportDto,
  LookupQueryDto,
  LookupOptionResponseDto,
  ExecuteReportDto,
} from './tools.service';

@Controller(['tools', 'api/reporting'])
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  async getHello() {
    return 'HELLO';
  }

  // ==========================================
  // SCHEMA DISCOVERY ROUTES
  // ==========================================
  @Get(['procedures', 'schema/procedures'])
  async getProcedures() {
    return this.toolsService.getProcedures();
  }

  @Post(['procedures', 'schema/procedures'])
  async getProceduresPost() {
    return this.toolsService.getProcedures();
  }

  @Get(['tables', 'schema/tables'])
  async getTables() {
    return this.toolsService.getTables();
  }

  @Post(['tables', 'schema/tables'])
  async getTablesPost() {
    return this.toolsService.getTables();
  }

  @Get('schema/entities')
  async getEntities(@Query('types') types?: string) {
    const typeArray = types ? types.split(',').map((t) => t.trim()) : undefined;
    return this.toolsService.getEntities(typeArray);
  }

  @Post('schema/entities')
  async getEntitiesPost(@Body() body: any) {
    const types = body?.types;
    const typeArray = Array.isArray(types)
      ? types
      : types
      ? types.split(',').map((t: string) => t.trim())
      : undefined;
    return this.toolsService.getEntities(typeArray);
  }

  @Get('columns')
  async getColumns(
    @Query('entityName') entityName: string,
    @Query('schema') schema = 'dbo',
    @Query('type') type?: string,
  ) {
    return this.toolsService.getColumns(entityName, schema, type);
  }

  @Post('columns')
  async getColumnsPost(@Body() body: any) {
    return this.toolsService.getColumns(
      body?.entityName || body?.name,
      body?.schema || 'dbo',
      body?.type,
    );
  }

  @Get('parameters')
  async getParameters(
    @Query('entityName') entityName: string,
    @Query('schema') schema = 'dbo',
  ) {
    return this.toolsService.getParameters(entityName, schema);
  }

  @Post('parameters')
  async getParametersPost(@Body() body: any) {
    return this.toolsService.getParameters(
      body?.entityName || body?.name,
      body?.schema || 'dbo',
    );
  }

  // ==========================================
  // REPORTS MANAGEMENT ROUTES
  // ==========================================
  @Get('reports')
  async listReports() {
    return this.toolsService.listReports();
  }

  @Get('reports/:id/availability')
  async checkReportId(@Param('id') id: string) {
    return this.toolsService.checkReportId(id);
  }

  @Get('reports/:id')
  async loadReport(@Param('id') id: string) {
    return this.toolsService.loadReport(id);
  }

  @Post('reports')
  @HttpCode(HttpStatus.OK)
  async saveReport(@Body() dto: SaveReportDto) {
    return this.toolsService.saveReport(dto);
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id') id: string) {
    return this.toolsService.deleteReport(id);
  }

  @Post('reports/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishReport(
    @Param('id') id: string,
    @Body('version') version = 1,
    @Body('userLogin') userLogin?: string,
  ) {
    await this.toolsService.publishReport(id, version, userLogin);
    return { success: true };
  }

  // ==========================================
  // LOOKUP DATA ROUTES
  // ==========================================
  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  async fetchLookupOptions(@Body() dto: LookupQueryDto): Promise<LookupOptionResponseDto[]> {
    return this.toolsService.fetchLookupOptions(dto);
  }

  @Get('lookup')
  async getLookupOptions(@Query() query: any): Promise<LookupOptionResponseDto[]> {
    return this.toolsService.fetchLookupOptions(query);
  }

  // ==========================================
  // REPORT EXECUTION ROUTES
  // ==========================================
  @Post('execute')
  @HttpCode(HttpStatus.OK)
  async executeReport(@Body() dto: ExecuteReportDto): Promise<Record<string, unknown>[]> {
    return this.toolsService.executeReport(dto);
  }
}
