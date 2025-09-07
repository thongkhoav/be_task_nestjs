import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load .env file before anything else
dotenv.config();
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/src/migrations/*{.ts,.js}'],
  // ssl:
  //   process.env.NODE_ENV === 'production'
  //     ? { rejectUnauthorized: false }
  //     : false,
  ssl: { rejectUnauthorized: false },
  synchronize: false, // set to false in production
});
