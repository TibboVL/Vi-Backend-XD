export async function up(knex) {
  await knex.schema.createTable("user_goal_list", (table) => {
    table.integer("goalId").unsigned().notNullable();
    table.integer("userId").unsigned().notNullable();

    table.primary(["goalId", "userId"]); // composite PK

    // Foreign keys
    table
      .foreign("userId")
      .references("userId")
      .inTable("user")
      .onDelete("CASCADE"); // user deleted -> delete this too
    table
      .foreign("goalId")
      .references("goalId")
      .inTable("goal")
      .onDelete("CASCADE"); // goal deleted -> delete this too

    table
      .dateTime("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
  });
}

export async function down(knex) {
  await knex.schema.dropTable("user_goal_list");
}
