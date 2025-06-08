export async function up(knex) {
  await knex.schema.createTable("plan", (table) => {
    table.increments("planId").unsigned().notNullable();
    table.string("name", 50).unique().notNullable();
    table.string("slug", 50).unique().notNullable();
    table.float("price").unsigned().notNullable();
    table.string("currency", 50).notNullable();
    table.integer("maxAIRequestsPerDay").unsigned().notNullable();
    table.integer("maxAIResultsShown").unsigned().notNullable();
    table.boolean("isActive").unsigned().notNullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTable("plan");
}
