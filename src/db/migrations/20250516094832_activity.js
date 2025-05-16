/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("activity", (table) => {
    table.increments("activityId");
    table.string("name").notNullable().unique();
    table.string("description");
    table.enum("source", ["UITVlaanderen", "Hardcoded"]); // did we hardcode this activity or did it come from the api?

    table
      .enum("energyRequired", ["low", "medium", "high", "very high"])
      .notNullable();

    table.integer("estimatedDurationMinutes").notNullable();
    table.enum("currency", ["EUR"]).nullable();
    table.float("estimatedCost").nullable();
    table.boolean("isGroupActivity").defaultTo(false);

    table.decimal("locationLatitude", 10, 7).nullable();
    table.decimal("locationLongitude", 10, 7).nullable();

    table.timestamps();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("activity");
}
