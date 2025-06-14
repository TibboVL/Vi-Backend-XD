/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("activity_category", (table) => {
    table.increments("activityCategoryId");

    // Define the foreign key column (integer, unsigned)
    table.integer("activityPillarId").unsigned().notNullable();
    // Then create the foreign key constraint
    table
      .foreign("activityPillarId")
      .references("pillarId")
      .inTable("activity_pillar")
      .onDelete("CASCADE"); // When an activity pillar is deleted -> delete all activity categories linked to it

    table.string("name").notNullable() /* .unique() */;
    table.string("description");

    // Composite unique constraint
    table.unique(["name", "activityPillarId"]);

    table
      .dateTime("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    table.dateTime("updated_at").nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("activity_category");
}
