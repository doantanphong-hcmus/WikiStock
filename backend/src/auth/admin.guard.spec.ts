/// <reference types="jest" />

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard, AdminRequest } from './admin.guard';
import { AuthenticatedGuard } from './authenticated.guard';

function createContext(request: Partial<AdminRequest>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('AdminGuard', () => {
  const authenticatedGuard = { canActivate: jest.fn() };
  const guard = new AdminGuard(
    authenticatedGuard as unknown as AuthenticatedGuard,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    authenticatedGuard.canActivate.mockResolvedValue(true);
  });

  it('rejects authenticated users whose current role is not admin', async () => {
    await expect(
      guard.canActivate(
        createContext({
          user: {
            userId: 2,
            email: 'user@wikistock.vn',
            fullName: 'User',
            role: { roleId: 2, roleName: 'user' },
          },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admins and attaches the current database identity', async () => {
    const request = {
      user: {
        userId: 1,
        email: 'admin@wikistock.vn',
        fullName: 'Admin',
        role: { roleId: 1, roleName: 'admin' },
      },
    } as Partial<AdminRequest>;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(authenticatedGuard.canActivate).toHaveBeenCalled();
  });
});
