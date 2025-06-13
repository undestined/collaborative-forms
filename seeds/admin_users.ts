import { Knex } from "knex";
import * as dotenv from "dotenv";
import { hashPassword } from "../lib/password";

dotenv.config();

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("users").del();

    // Hash passwords before inserting
    const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || "admin123");
    const testUserPassword = await hashPassword(process.env.TEST_USER_PASSWORD || "test123");

    // Inserts seed admin users with hashed passwords
    await knex("users").insert([
        { 
            email: process.env.ADMIN_EMAIL || "admin@formsync.com", 
            password: adminPassword,
            role: "admin" 
        },
        { 
            email: process.env.TEST_USER_EMAIL || "test@formsync.com", 
            password: testUserPassword,
            role: "user" 
        }
    ]);
};
