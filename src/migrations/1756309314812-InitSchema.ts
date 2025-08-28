import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1756309314812 implements MigrationInterface {
    name = 'InitSchema1756309314812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "name" character varying NOT NULL, "description" character varying NOT NULL, "inviteCode" character varying NOT NULL, CONSTRAINT "UQ_853f347c1bbaada6e8394f5be26" UNIQUE ("inviteCode"), CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deletedDate" TIMESTAMP, "isOwner" boolean NOT NULL DEFAULT false, "userId" uuid, "roomId" uuid, CONSTRAINT "PK_9416d08fb276a62be271c9a3c21" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "title" character varying NOT NULL DEFAULT 'USER', CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "login_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "fcmToken" character varying, "userId" uuid, CONSTRAINT "PK_705d252226d51c48c6368d52855" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "title" character varying NOT NULL, "body" character varying NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "userId" uuid, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "email" character varying NOT NULL, "password" character varying NOT NULL, "isVerified" boolean NOT NULL DEFAULT false, "fullName" character varying NOT NULL, "roleId" uuid, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedDate" TIMESTAMP, "title" character varying NOT NULL, "description" character varying NOT NULL, "dueDate" TIMESTAMP WITH TIME ZONE, "status" character varying NOT NULL DEFAULT 'TODO', "review" character varying, "userId" uuid, "roomId" uuid, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_room" ADD CONSTRAINT "FK_6a20569bb399fa9feb2f0dd683a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_room" ADD CONSTRAINT "FK_a074a2b9287d9941dcf5144bffe" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "login_session" ADD CONSTRAINT "FK_98763f1bce75d5b823896f5adad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_204707cd615492e7280e24aea01" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_204707cd615492e7280e24aea01"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_f316d3fe53497d4d8a2957db8b9"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`ALTER TABLE "login_session" DROP CONSTRAINT "FK_98763f1bce75d5b823896f5adad"`);
        await queryRunner.query(`ALTER TABLE "user_room" DROP CONSTRAINT "FK_a074a2b9287d9941dcf5144bffe"`);
        await queryRunner.query(`ALTER TABLE "user_room" DROP CONSTRAINT "FK_6a20569bb399fa9feb2f0dd683a"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "login_session"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TABLE "user_room"`);
        await queryRunner.query(`DROP TABLE "room"`);
    }

}
