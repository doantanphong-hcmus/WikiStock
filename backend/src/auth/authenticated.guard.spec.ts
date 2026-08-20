/// <reference types="jest" />

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import {
  AuthenticatedGuard,
  AuthenticatedRequest,
} from './authenticated.guard';

function createContext(request: Partial<AuthenticatedRequest>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('AuthenticatedGuard', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const jwtService = { verifyAsync: jest.fn() };
  const prisma = { appUser: { findUnique: jest.fn() } };
  const guard = new AuthenticatedGuard(
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

  it('rejects invalid or expired tokens', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Bearer invalid-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token whose user no longer exists', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 2 });
    prisma.appUser.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Bearer valid-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the current database identity to a valid request', async () => {
    const request = {
      headers: { authorization: 'Bearer valid-token' },
    } as Partial<AuthenticatedRequest>;
    jwtService.verifyAsync.mockResolvedValue({ sub: 2 });
    prisma.appUser.findUnique.mockResolvedValue({
      userId: 2,
      email: 'user@wikistock.vn',
      fullName: 'User',
      role: { roleId: 2, roleName: 'user' },
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toMatchObject({
      userId: 2,
      role: { roleName: 'user' },
    });
  });
});
