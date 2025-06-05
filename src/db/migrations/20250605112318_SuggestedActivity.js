export async function up(knex) {
  await knex.schema.createTable("suggested_activity", (table) => {
    table.increments("suggestedActivityId").unsigned().notNullable();
    table.integer("suggestedActivityGroupId").unsigned().notNullable();
    table.integer("activityId").unsigned().notNullable();

    table.float("confidence").unsigned().notNullable();
    table.string("reasoning", 500).unsigned().notNullable();
    table.dateTime("dismissedAt").nullable();

    table
      .enum("overwriteEnergyRequired", ["low", "medium", "high", "very high"])
      .notNullable();

    table.boolean("overwriteIsGroupActivity").defaultTo(false);

    // Foreign keys
    table
      .foreign("suggestedActivityGroupId")
      .references("suggestedActivityGroupId")
      .inTable("suggested_activity_group")
      .onDelete("CASCADE"); // user deleted -> delete activity lists

    table
      .foreign("activityId")
      .references("activityId")
      .inTable("activity")
      .onDelete("CASCADE"); // activity deleted -> delete activity lists

    table
      .dateTime("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    table.dateTime("updated_at").nullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTable("suggested_activity");
}
