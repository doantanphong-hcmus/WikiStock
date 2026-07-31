/// <reference types="jest" />

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const jwtService = { signAsync: jest.fn() };
  const prisma = { appUser: { findUnique: jest.fn() } };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwtService as unknown as JwtService,
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

  it('returns a JWT and never exposes the password hash', async () => {
    prisma.appUser.findUnique.mockResolvedValue({
      userId: 1,
      email: 'admin@wikistock.vn',
      passwordHash: await hash('strong-password', 4),
      fullName: 'Admin',
      role: { roleId: 1, roleName: 'admin' },
    });
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await service.login({
      email: 'ADMIN@wikistock.vn',
      password: 'strong-password',
    });

    expect(result.data?.accessToken).toBe('signed-token');
    expect(result.data?.user).not.toHaveProperty('passwordHash');
    expect(prisma.appUser.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'admin@wikistock.vn' } }),
    );
  });

  it('uses one generic error for an invalid password', async () => {
    prisma.appUser.findUnique.mockResolvedValue({
      passwordHash: await hash('correct-password', 4),
    });

    await expect(
      service.login({
        email: 'admin@wikistock.vn',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
