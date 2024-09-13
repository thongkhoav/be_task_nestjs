import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { AbstractEntity } from 'src/database/abstract.entity';

export enum RoleType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity()
export class Role extends AbstractEntity<Role> {
  @Column({ default: RoleType.USER })
  title: string; // e.g., "Admin", "User", "Manager"

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
