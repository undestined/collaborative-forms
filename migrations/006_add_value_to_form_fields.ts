import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("form_fields", (table) => {
    table.text("value").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("form_fields", (table) => {
    table.dropColumn("value");
  });
}