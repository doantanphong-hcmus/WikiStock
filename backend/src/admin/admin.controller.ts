import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get(['v1/admin/companies', 'admin/companies'])
  listCompanies() {
    return this.adminService.listCompanies();
  }
}
