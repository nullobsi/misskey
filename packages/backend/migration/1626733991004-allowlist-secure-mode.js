

class allowlistSecureMode1626733991004  {
	constructor() {
		this.name = 'allowlistSecureMode1626733991004';
	}
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "allowedHosts" character varying(256) [] default '{}'`, undefined);
		await queryRunner.query(`ALTER TABLE "meta" ADD "secureMode" bool default false`, undefined);
		await queryRunner.query(`ALTER TABLE "meta" ADD "privateMode" bool default false`, undefined);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "allowedHosts"`, undefined);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "secureMode"`, undefined);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "privateMode"`, undefined);
	}
}

exports.allowlistSecureMode1626733991004 = allowlistSecureMode1626733991004;
