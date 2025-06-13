import type { Knex } from "knex";
import * as dotenv from "dotenv";

dotenv.config();

const config: Record<string, Knex.Config> = {
  development: {
    client: "postgresql",
    connection: process.env.DATABASE_URI || {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "form_sync_dev",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./seeds",
      extension: "ts",
    },
  },
  production: {
    client: "postgresql",
    connection: process.env.DATABASE_URI || {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./seeds",
      extension: "ts",
    },
  },
};

export default config;
