import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class SmallAbstractEntity<T> {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @DeleteDateColumn({ select: false })
  deletedDate?: Date;

  constructor(partial: Partial<T>) {
    Object.assign(this, partial);
  }
}
