import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("field_values", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("response_id").references("id").inTable("form_responses").onDelete("CASCADE");
    table.uuid("field_id").references("id").inTable("form_fields").onDelete("CASCADE");
    table.text("value");
    table.uuid("updated_by").references("id").inTable("users");
    table.timestamps(true, true);
    
    // Ensure only one value per field per response
    table.unique(["response_id", "field_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("field_values");
}