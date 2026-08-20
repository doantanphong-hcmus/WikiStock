import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './authenticated.guard';
import type { AuthenticatedRequest } from './authenticated.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(['v1/auth/register', 'auth/register'])
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post(['v1/auth/login', 'auth/login'])
  @HttpCode(200)
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Get(['v1/auth/me', 'auth/me'])
  @UseGuards(AuthenticatedGuard)
  me(@Req() request: AuthenticatedRequest) {
    return {
      statusCode: 200,
      message: 'Fetched current user',
      data: request.user,
      error: null,
    };
  }
}
