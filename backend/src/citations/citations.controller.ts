import { Controller, Get, Param } from '@nestjs/common';
import { CitationsService } from './citations.service';

@Controller()
export class CitationsController {
  constructor(private readonly citationsService: CitationsService) {}

  @Get([
    'v1/companies/:companyCode/citations',
    'companies/:companyCode/citations',
  ])
  getCitations(@Param('companyCode') companyCode: string) {
    return this.citationsService.getCitations(companyCode);
  }
}
