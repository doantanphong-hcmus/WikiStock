import { Controller, Get, Param, Query } from '@nestjs/common';
import { FinancialsService } from './financials.service';

@Controller()
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Get([
    'v1/companies/:companyCode/financials',
    'companies/:companyCode/financials',
  ])
  getFinancials(
    @Param('companyCode') companyCode: string,
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
  ) {
    return this.financialsService.getFinancials(companyCode, year, quarter);
  }
}
