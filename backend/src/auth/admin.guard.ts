import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  AuthenticatedGuard,
  AuthenticatedRequest,
} from './authenticated.guard';

export type AdminRequest = AuthenticatedRequest;

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authenticatedGuard: AuthenticatedGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.authenticatedGuard.canActivate(context);
    const request = context.switchToHttp().getRequest<AdminRequest>();

    if (request.user.role.roleName !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }

    return true;
  }
}
