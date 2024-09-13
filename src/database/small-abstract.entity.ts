import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class SmallAbstractEntity<T> {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  constructor(partial: Partial<T>) {
    Object.assign(this, partial);
  }
}
