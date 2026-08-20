import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { ApiResponse } from '../common/types/api.types';
import { appConfig } from '../config/app.config';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthUser {
  userId: number;
  email: string;
  fullName: string | null;
  role: {
    roleId: number;
    roleName: string;
  };
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: RegisterDto): Promise<ApiResponse<AuthUser>> {
    const fullName = payload.fullName.trim();
    if (fullName.length < 2) {
      throw new BadRequestException(
        'Full name must contain at least 2 characters',
      );
    }

    const userRole = await this.prisma.userRole.findUnique({
      where: { roleName: 'user' },
    });
    if (!userRole) {
      throw new ServiceUnavailableException(
        'Default user role is not configured',
      );
    }

    try {
      const user = await this.prisma.appUser.create({
        data: {
          email: payload.email.trim().toLowerCase(),
          passwordHash: await hash(payload.password, 12),
          fullName,
          roleId: userRole.roleId,
        },
        select: {
          userId: true,
          email: true,
          fullName: true,
          role: true,
        },
      });

      return {
        statusCode: 201,
        message: 'Registered successfully',
        data: user,
        error: null,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

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
