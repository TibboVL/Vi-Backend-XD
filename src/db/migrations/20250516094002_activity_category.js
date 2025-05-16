/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("activity_category", (table) => {
    table.increments("activityCategoryId");

    // Define the foreign key column (integer, unsigned)
    table.integer("activityPillar").unsigned().notNullable();
    // Then create the foreign key constraint
    table
      .foreign("activityPillar")
      .references("pillarId")
      .inTable("activity_pillar")
      .onDelete("CASCADE"); // When an activity pillar is deleted -> delete all activity categories linked to it

    table.string("name").notNullable().unique();
    table.string("description");
    table.timestamps();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("activity_category");
}
