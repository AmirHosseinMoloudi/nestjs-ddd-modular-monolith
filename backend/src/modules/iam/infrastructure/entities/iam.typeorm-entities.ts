import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenants')
export class TenantTypeOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('varchar', { length: 50, unique: true })
  slug: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('users')
export class UserTypeOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  tenantId: string;

  @Column('varchar', { length: 150 })
  email: string;

  @Column('varchar', { length: 100 })
  fullName: string;

  @Column('varchar', { length: 255 })
  passwordHash: string;

  @Column('varchar', { length: 50, default: 'USER' })
  role: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
