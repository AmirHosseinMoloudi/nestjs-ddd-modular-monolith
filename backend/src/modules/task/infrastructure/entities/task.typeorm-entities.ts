import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('tasks')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'priority'])
export class TaskTypeOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  tenantId: string;

  @Column('varchar', { length: 150 })
  title: string;

  @Column('text', { default: '' })
  description: string;

  @Column('varchar', { length: 20 })
  priority: string;

  @Column('varchar', { length: 20 })
  status: string;

  @Column('varchar', { length: 36 })
  creatorId: string;

  @Column('varchar', { length: 36, nullable: true })
  assigneeId: string | null;

  @Column('varchar', { length: 150, nullable: true })
  assigneeEmail: string | null;

  @Column('boolean', { default: false })
  requiresApproval: boolean;

  @Column('varchar', { length: 20, default: 'NONE' })
  approvalStatus: string;

  @Column('varchar', { length: 36, nullable: true })
  approvedById: string | null;

  @Column('text', { nullable: true })
  approvalComment: string | null;

  @Column('simple-json', { default: '[]' })
  tags: string[];

  @Column('simple-json', { default: '[]' })
  subtasks: { id: string; title: string; isCompleted: boolean }[];

  @Column('datetime', { nullable: true })
  deadline: Date | null;

  @Column('int', { default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
