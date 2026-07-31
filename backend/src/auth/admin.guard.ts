import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { appConfig } from '../config/app.config';
import { PrismaService } from '../database/prisma.service';

interface AccessTokenPayload {
  sub: number;
}

export interface AdminRequest extends Request {
  user: {
    userId: number;
    email: string;
    fullName: string | null;
    roleName: string;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    if (!appConfig.jwtSecret || appConfig.jwtSecret.length < 32) {
      throw new ServiceUnavailableException('Authentication is not configured');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: appConfig.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException('Bearer token is invalid or expired');
    }

    if (!Number.isInteger(payload.sub) || payload.sub <= 0) {
      throw new UnauthorizedException('Bearer token has an invalid subject');
    }

    const user = await this.prisma.appUser.findUnique({
      where: { userId: payload.sub },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.role.roleName !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }

    request.user = {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      roleName: user.role.roleName,
    };

    return true;
  }
}
