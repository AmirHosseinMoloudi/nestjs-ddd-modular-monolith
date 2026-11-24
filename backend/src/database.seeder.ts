import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { TenantTypeOrmEntity, UserTypeOrmEntity } from './modules/iam/infrastructure/entities/iam.typeorm-entities';
import { UserRole } from './modules/iam/domain/iam.types';

@Injectable()
export class DatabaseSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectRepository(TenantTypeOrmEntity)
    private readonly tenantRepo: Repository<TenantTypeOrmEntity>,
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepo: Repository<UserTypeOrmEntity>,
  ) {}

  async onApplicationBootstrap() {
    const tenantCount = await this.tenantRepo.count();
    if (tenantCount === 0) {
      this.logger.log('Seeding initial Tenants and Administrative Users...');

      const defaultTenant = this.tenantRepo.create({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Acme Enterprise Solutions',
        slug: 'acme-corp',
        isActive: true,
      });

      const secondTenant = this.tenantRepo.create({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Beta Global Industries',
        slug: 'beta-global',
        isActive: true,
      });

      await this.tenantRepo.save([defaultTenant, secondTenant]);

      const salt = await bcrypt.genSalt(10);
      const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

      const adminUser = this.userRepo.create({
        id: 'aaaa1111-1111-1111-1111-111111111111',
        tenantId: defaultTenant.id,
        email: 'admin@acme.com',
        fullName: 'Alice Administrator',
        passwordHash: defaultPasswordHash,
        role: UserRole.ADMIN,
        isActive: true,
      });

      const managerUser = this.userRepo.create({
        id: 'bbbb2222-2222-2222-2222-222222222222',
        tenantId: defaultTenant.id,
        email: 'manager@acme.com',
        fullName: 'Bob Manager',
        passwordHash: defaultPasswordHash,
        role: UserRole.MANAGER,
        isActive: true,
      });

      const standardUser = this.userRepo.create({
        id: 'cccc3333-3333-3333-3333-333333333333',
        tenantId: defaultTenant.id,
        email: 'user@acme.com',
        fullName: 'Charlie Developer',
        passwordHash: defaultPasswordHash,
        role: UserRole.USER,
        isActive: true,
      });

      await this.userRepo.save([adminUser, managerUser, standardUser]);
      this.logger.log('Database seeding completed successfully.');
    }
  }
}
