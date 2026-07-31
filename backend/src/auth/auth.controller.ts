import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(['v1/auth/login', 'auth/login'])
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }
}
