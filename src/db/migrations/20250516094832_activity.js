/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("activity", (table) => {
    table.increments("activityId");
    table.string("name").notNullable();
    table.string("description", 1000);
    table.enum("source", ["UITVlaanderen", "Hardcoded"]); // did we hardcode this activity or did it come from the api?

    table
      .enum("energyRequired", ["low", "medium", "high", "very high"])
      .notNullable();

    table.integer("estimatedDurationMinutes").notNullable();
    table.enum("currency", ["EUR"]).nullable();
    table.float("estimatedCost").nullable();
    table.boolean("isGroupActivity").defaultTo(false);

    table.timestamp("startDate").nullable();
    table.timestamp("endDate").nullable();

    table.string("locationName").nullable();
    table.string("locationDescription", 1000).nullable();

    table.decimal("locationLatitude", 10, 7).nullable();
    table.decimal("locationLongitude", 10, 7).nullable();
    table.string("locationCity").nullable();
    table.string("locationStreetAddress").nullable();
    table.string("locationPostcode").nullable();
    table.string("locationCountry").nullable();

    table.string("debugUITId").nullable();

    table.jsonb("contactEmails").nullable();
    table.jsonb("contactPhones").nullable();
    table.jsonb("contactURLs").nullable();

    table.integer("minAge").nullable();
    table.integer("maxAge").nullable();

    table.jsonb("openingHoursStructured").nullable();
    table.jsonb("tags").nullable(); // store tags, just so we dont have to re-query uitDB and can do local updates of our own categories

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
  await knex.schema.dropTable("activity");
}
