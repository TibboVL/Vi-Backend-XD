export async function up(knex) {
  await knex.schema.createTable("activity_activity_category", (table) => {
    table.integer("activityId").unsigned().notNullable();
    table.integer("activityCategoryId").unsigned().notNullable();

    table.primary(["activityId", "activityCategoryId"]); // composite PK

    table
      .foreign("activityId")
      .references("activityId")
      .inTable("activity")
      .onDelete("CASCADE");

    table
      .foreign("activityCategoryId")
      .references("activityCategoryId")
      .inTable("activity_category")
      .onDelete("CASCADE");
  });
}

export async function down(knex) {
  await knex.schema.dropTable("activity_activity_category");
}
