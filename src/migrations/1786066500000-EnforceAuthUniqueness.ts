import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceAuthUniqueness1786066500000 implements MigrationInterface {
  name = 'EnforceAuthUniqueness1786066500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_email" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_room_active_unique" ON "user_room" ("userId", "roomId") WHERE "deletedDate" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_room_active_unique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_email"`,
    );
  }
}
