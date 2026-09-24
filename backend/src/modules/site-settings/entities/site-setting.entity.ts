import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('site_settings')
export class SiteSetting {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'jsonb', default: '{}' })
  value: any;

  @UpdateDateColumn()
  updatedAt: Date;
}
