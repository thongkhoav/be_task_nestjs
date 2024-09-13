import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  jwtTokenId: string;

  @Column()
  refreshToken: string;

  @Column({ default: true })
  isValid: boolean;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
