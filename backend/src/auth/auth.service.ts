import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { ApiResponse } from '../common/types/api.types';
import { appConfig } from '../config/app.config';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    userId: number;
    email: string;
    fullName: string | null;
    role: {
      roleId: number;
      roleName: string;
    };
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(payload: LoginDto): Promise<ApiResponse<LoginResponse>> {
    const user = await this.prisma.appUser.findUnique({
      where: { email: payload.email.trim().toLowerCase() },
      include: { role: true },
    });

    if (!user || !(await compare(payload.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!appConfig.jwtSecret || appConfig.jwtSecret.length < 32) {
      throw new ServiceUnavailableException('Authentication is not configured');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.userId,
        email: user.email,
        role: user.role.roleName,
      },
      {
        secret: appConfig.jwtSecret,
        expiresIn: appConfig.jwtExpiresInSeconds,
      },
    );

    return {
      statusCode: 200,
      message: 'Logged in successfully',
      data: {
        accessToken,
        expiresIn: appConfig.jwtExpiresInSeconds,
        user: {
          userId: user.userId,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      error: null,
    };
  }
}
