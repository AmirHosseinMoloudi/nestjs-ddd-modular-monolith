import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserContext } from './tenant.context';

@Injectable()
export class JwtSecurityService {
  private readonly secret = process.env.JWT_SECRET || 'production-grade-super-secret-key-32chars-min!';
  private readonly issuer = 'todo-platform-auth';
  private readonly audience = 'todo-platform-api';

  public signToken(payload: { userId: string; email: string; role: string; tenantId: string; permissions: string[] }): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: '8h',
      issuer: this.issuer,
      audience: this.audience,
      jwtid: crypto.randomUUID(),
    });
  }

  public verifyToken(token: string): UserContext {
    const decoded = jwt.verify(token, this.secret, {
      issuer: this.issuer,
      audience: this.audience,
    }) as any;

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      tenantId: decoded.tenantId,
    };
  }
}
