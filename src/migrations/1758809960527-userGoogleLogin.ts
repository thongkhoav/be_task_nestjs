import { MigrationInterface, QueryRunner } from "typeorm";

export class UserGoogleLogin1758809960527 implements MigrationInterface {
    name = 'UserGoogleLogin1758809960527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "googleLogin" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "googleLogin"`);
    }

}
