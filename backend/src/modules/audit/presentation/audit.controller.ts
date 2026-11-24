import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuditService } from '../application/audit.service';
import { AuthGuard } from '../../../core/infrastructure/security/auth.guard';
import { RolesGuard } from '../../../core/infrastructure/security/roles.guard';
import { RequirePermissions } from '../../../core/infrastructure/security/roles.decorator';
import { Permission } from '../../iam/domain/iam.types';

@Controller('api/v1/audit')
@UseGuards(AuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.AUDIT_READ)
  async getAuditTrail(
    @Req() req: any,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user.tenantId;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditService.queryAuditTrail(tenantId, entityId, limitNum);
  }
}
