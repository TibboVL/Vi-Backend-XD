export async function up(knex) {
  await knex.schema.createTable("ai_request_usage", (table) => {
    table.increments("AIRequestUsageId").unsigned().notNullable();
    table.integer("userId").unsigned().notNullable();

    table
      .timestamp("usedAt")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));

    table
      .foreign("userId")
      .references("userId")
      .inTable("user")
      .onDelete("SET NULL"); // user deleted -> set linked user to null
  });
}

export async function down(knex) {
  await knex.schema.dropTable("ai_request_usage");
}
