/// <reference types="jest" />

import {
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  interface CreateUserArgs {
    data: {
      email: string;
      passwordHash: string;
      fullName: string;
      roleId: number;
    };
  }

  const originalJwtSecret = process.env.JWT_SECRET;
  const jwtService = { signAsync: jest.fn() };
  const prisma = {
    appUser: {
      create: jest.fn<(args: CreateUserArgs) => Promise<unknown>>(),
      findUnique: jest.fn(),
    },
    userRole: { findUnique: jest.fn() },
  };
  let createdUserData: CreateUserArgs['data'] | undefined;
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwtService as unknown as JwtService,
  );

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
    jest.clearAllMocks();
    createdUserData = undefined;
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

  it('registers a normalized user with the default role and hashed password', async () => {
    prisma.userRole.findUnique.mockResolvedValue({
      roleId: 2,
      roleName: 'user',
    });
    prisma.appUser.create.mockImplementation(({ data }: CreateUserArgs) => {
      createdUserData = data;
      return Promise.resolve({
        userId: 2,
        email: data.email,
        fullName: data.fullName,
        role: { roleId: 2, roleName: 'user' },
      });
    });

    const result = await service.register({
      fullName: '  Nguyễn Văn An  ',
      email: ' AN@Example.com ',
      password: 'Strong123',
    });

    expect(result.statusCode).toBe(201);
    expect(result.data).toMatchObject({
      email: 'an@example.com',
      fullName: 'Nguyễn Văn An',
      role: { roleName: 'user' },
    });
    expect(createdUserData?.passwordHash).not.toBe('Strong123');
    expect(createdUserData?.roleId).toBe(2);
    expect(result.data).not.toHaveProperty('passwordHash');
  });

  it('rejects registration when the email already exists', async () => {
    prisma.userRole.findUnique.mockResolvedValue({
      roleId: 2,
      roleName: 'user',
    });
    prisma.appUser.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.register({
        fullName: 'Nguyễn Văn An',
        email: 'an@example.com',
        password: 'Strong123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('fails closed when the default user role is missing', async () => {
    prisma.userRole.findUnique.mockResolvedValue(null);

    await expect(
      service.register({
        fullName: 'Nguyễn Văn An',
        email: 'an@example.com',
        password: 'Strong123',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
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
