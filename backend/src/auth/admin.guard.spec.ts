/// <reference types="jest" />

import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { AdminGuard, AdminRequest } from './admin.guard';

function createContext(request: Partial<AdminRequest>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('AdminGuard', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const jwtService = { verifyAsync: jest.fn() };
  const prisma = { appUser: { findUnique: jest.fn() } };
  const guard = new AdminGuard(
    jwtService as unknown as JwtService,
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('rejects requests without a bearer token', async () => {
    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects authenticated users whose current role is not admin', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 2 });
    prisma.appUser.findUnique.mockResolvedValue({
      userId: 2,
      email: 'user@wikistock.vn',
      fullName: 'User',
      role: { roleId: 2, roleName: 'user' },
    });

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Bearer valid-token' } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admins and attaches the current database identity', async () => {
    const request = {
      headers: { authorization: 'Bearer valid-token' },
    } as Partial<AdminRequest>;
    jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
    prisma.appUser.findUnique.mockResolvedValue({
      userId: 1,
      email: 'admin@wikistock.vn',
      fullName: 'Admin',
      role: { roleId: 1, roleName: 'admin' },
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toMatchObject({ userId: 1, roleName: 'admin' });
  });
});
