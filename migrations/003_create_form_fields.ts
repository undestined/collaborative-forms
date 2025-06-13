import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("form_fields", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("form_id").references("id").inTable("forms").onDelete("CASCADE");
    table.string("field_type").notNullable(); // text, textarea, select, checkbox, radio, etc.
    table.string("label").notNullable();
    table.json("options"); // for select, radio, checkbox options
    table.integer("order").notNullable();
    table.boolean("required").defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("form_fields");
}