import { Controller, Get, Param, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get(['v1/companies', 'companies'])
  listCompanies() {
    return this.companiesService.listCompanies();
  }

  @Get(['v1/companies/:companyCode/news', 'companies/:companyCode/news'])
  getCompanyNews(
    @Param('companyCode') companyCode: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.companiesService.getCompanyNews(companyCode, page, limit);
  }

  @Get([
    'v1/companies/:companyCode/profile',
    'v1/companies/:companyCode',
    'companies/:companyCode',
  ])
  getCompany(@Param('companyCode') companyCode: string) {
    return this.companiesService.findByCompanyCode(companyCode);
  }
}
