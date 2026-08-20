import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import type { AdminRequest } from '../auth/admin.guard';
import { AdminService } from './admin.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller(['v1/admin', 'admin'])
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('companies')
  listCompanies() {
    return this.adminService.listCompanies();
  }

  @Get('documents')
  listDocuments() {
    return this.adminService.listDocuments();
  }

  @Get('document-options')
  getDocumentOptions() {
    return this.adminService.getDocumentOptions();
  }

  @Post('documents')
  createDocument(@Body() payload: CreateDocumentDto) {
    return this.adminService.createDocument(payload);
  }

  @Patch('documents/:documentId/review')
  reviewDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Req() request: AdminRequest,
    @Body() payload: ReviewDocumentDto,
  ) {
    return this.adminService.reviewDocument(
      documentId,
      request.user.userId,
      payload,
    );
  }

  @Post('citations/check')
  runCitationCheck() {
    return this.adminService.runCitationCheck();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Post('users')
  createUser(@Body() payload: CreateUserDto) {
    return this.adminService.createUser(payload);
  }

  @Get('roles')
  listRoles() {
    return this.adminService.listRoles();
  }

  @Patch('users/:userId/role')
  updateUserRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AdminRequest,
    @Body() payload: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(
      userId,
      payload.roleId,
      request.user.userId,
    );
  }
}
