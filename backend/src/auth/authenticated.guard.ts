import {
  CanActivate,
  ExecutionContext,
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

export interface AuthenticatedUser {
  userId: number;
  email: string;
  fullName: string | null;
  role: {
    roleId: number;
    roleName: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
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

    request.user = {
      userId: user.userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    return true;
  }
}
