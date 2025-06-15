export async function up(knex) {
  await knex.schema.createTable("goal", (table) => {
    table.increments("goalId").unsigned().notNullable();
    table.string("label", 50).unique().notNullable();
    table.string("slug", 50).unique().notNullable();
    table.boolean("isActive").defaultTo(true).notNullable();
    table
      .dateTime("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
  });
}

export async function down(knex) {
  await knex.schema.dropTable("goal");
}
