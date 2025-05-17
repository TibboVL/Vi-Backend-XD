export async function up(knex) {
  await knex.schema.createTable("mood", (table) => {
    table.increments("moodId").unsigned().notNullable();
    table.integer("parentMoodId").unsigned().nullable();
    table.string("label").unique().notNullable();

    table
      .foreign("parentMoodId")
      .references("moodId")
      .inTable("mood")
      .onDelete("CASCADE"); // if parent deleted -> delete sub mood
  });
}

export async function down(knex) {
  await knex.schema.dropTable("mood");
}
