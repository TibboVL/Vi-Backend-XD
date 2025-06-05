export async function up(knex) {
  await knex.schema.createTable("suggested_activity_group", (table) => {
    table.increments("suggestedActivityGroupId").unsigned().notNullable();
    table.integer("userId").unsigned().notNullable();
    table.integer("basedOnCheckinId").unsigned().notNullable();
    table.integer("amountActivitiesConsidered").unsigned().nullable();
    table.string("model").unsigned().nullable();

    // Foreign keys
    table
      .foreign("userId")
      .references("userId")
      .inTable("user")
      .onDelete("CASCADE"); // user deleted -> delete activity lists
    table
      .foreign("basedOnCheckinId")
      .references("checkinId")
      .inTable("checkin")
      .onDelete("SET NULL"); // checkin deleted -> set null

    table
      .dateTime("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
  });
}

export async function down(knex) {
  await knex.schema.dropTable("suggested_activity_group");
}
