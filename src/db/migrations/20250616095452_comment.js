export async function up(knex) {
  await knex.schema.createTable("comment", (table) => {
    table.increments("commentId").unsigned().notNullable();
    table.integer("checkinId").unsigned().notNullable();

    table.string("comment", 200).notNullable();

    // Add CHECK constraint for allowed values
    table
      .enu("type", ["pro", "neutral", "con"], {
        useNative: true,
        enumName: "comment_type",
      })
      .notNullable();

    // Foreign keys
    table
      .foreign("checkinId")
      .references("checkinId")
      .inTable("checkin")
      .onDelete("CASCADE"); // checkin deleted -> delete this too

    table
      .dateTime("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
  });
}

export async function down(knex) {
  await knex.schema.dropTable("comment");

  await knex.raw('DROP TYPE IF EXISTS "comment_type"');
}
