import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantTypeOrmEntity, UserTypeOrmEntity } from './infrastructure/entities/iam.typeorm-entities';
import { IamService } from './application/iam.service';
import { AuthController } from './presentation/auth.controller';
import { JwtSecurityService } from '../../core/infrastructure/security/jwt.service';
import { AuthGuard } from '../../core/infrastructure/security/auth.guard';
import { RolesGuard } from '../../core/infrastructure/security/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantTypeOrmEntity, UserTypeOrmEntity]),
  ],
  controllers: [AuthController],
  providers: [
    IamService,
    JwtSecurityService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [
    IamService,
    JwtSecurityService,
    AuthGuard,
    RolesGuard,
    TypeOrmModule,
  ],
})
export class IamModule {}
