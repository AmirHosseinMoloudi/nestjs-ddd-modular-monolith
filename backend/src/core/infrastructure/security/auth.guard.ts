import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtSecurityService } from './jwt.service';
import { IS_PUBLIC_KEY } from './roles.decorator';
import { TenantContextHolder } from './tenant.context';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtSecurityService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const token = authHeader.substring(7);
    try {
      const userContext = this.jwtService.verifyToken(token);
      request.user = userContext;
      // Allow tenant header override if admin and testing multi-tenant, else default to token tenant
      const headerTenant = request.headers['x-tenant-id'];
      if (headerTenant && userContext.role === 'ADMIN') {
        request.user.tenantId = headerTenant;
      }
      return true;
    } catch (err: any) {
      throw new UnauthorizedException('Token validation failed: ' + (err.message || 'unauthorized'));
    }
  }
}
