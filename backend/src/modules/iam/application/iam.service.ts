import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserTypeOrmEntity, TenantTypeOrmEntity } from '../infrastructure/entities/iam.typeorm-entities';
import { UserRole, ROLE_PERMISSIONS } from '../domain/iam.types';
import { JwtSecurityService } from '../../../core/infrastructure/security/jwt.service';

@Injectable()
export class IamService {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepo: Repository<UserTypeOrmEntity>,
    @InjectRepository(TenantTypeOrmEntity)
    private readonly tenantRepo: Repository<TenantTypeOrmEntity>,
    private readonly jwtService: JwtSecurityService,
  ) {}

  public async getTenants(): Promise<TenantTypeOrmEntity[]> {
    return this.tenantRepo.find({ where: { isActive: true } });
  }

  public async register(dto: { email: string; password: string; fullName: string; tenantId: string; role?: UserRole }) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email, tenantId: dto.tenantId },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists in the selected tenant.');
    }

    const tenant = await this.tenantRepo.findOne({ where: { id: dto.tenantId } });
    if (!tenant) {
      throw new NotFoundException('Selected tenant not found.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const role = dto.role || UserRole.USER;

    const user = this.userRepo.create({
      id: crypto.randomUUID(),
      tenantId: dto.tenantId,
      email: dto.email.toLowerCase().trim(),
      fullName: dto.fullName.trim(),
      passwordHash,
      role,
      isActive: true,
    });

    await this.userRepo.save(user);

    const permissions = ROLE_PERMISSIONS[role as UserRole] || [];
    const token = this.jwtService.signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      permissions,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        permissions,
      },
    };
  }

  public async login(dto: { email: string; password: string; tenantId: string }) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase().trim(), tenantId: dto.tenantId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const permissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
    const token = this.jwtService.signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      permissions,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        permissions,
      },
    };
  }

  public async findUsersByTenant(tenantId: string) {
    return this.userRepo.find({
      where: { tenantId, isActive: true },
      select: ['id', 'email', 'fullName', 'role', 'tenantId', 'createdAt'],
    });
  }
}
