export async function up(knex) {
  await knex.schema.createTable("checkin", (table) => {
    table.increments("checkinId");
    table
      .integer("userId")
      .unsigned()
      .notNullable()
      .references("userId")
      .inTable("user");
    table
      .integer("beforeMoodId")
      .unsigned()
      .nullable()
      .references("moodId")
      .inTable("mood");
    table.integer("beforeEnergyLevel").unsigned().nullable();
    table
      .integer("afterMoodId")
      .unsigned()
      .nullable()
      .references("moodId")
      .inTable("mood");
    table.integer("afterEnergyLevel").unsigned().nullable();
    table.integer("userActivityId").unsigned().nullable();
    /*.references("userActivityId")
      .inTable("user_activity_list"); */
    table.timestamp("timestamp");
    /*     table
      .integer("typeId")
      .unsigned()
      .notNullable()
      .references("typeId")
      .inTable("checkin_type"); */
  });
}

export async function down(knex) {
  // 1. Drop FK constraint from checkin.userActivityId referencing user_activity_list
  await knex.schema.alterTable("checkin", (table) => {
    table.dropForeign("userActivityId");
  });
  await knex.schema.alterTable("user_activity_list", (table) => {
    table.dropForeign("checkinId");
  });

  // 2. Drop checkin table first, because it references user_activity_list
  await knex.schema.dropTableIfExists("checkin");

  // 3. Now you can safely drop user_activity_list
  await knex.schema.dropTableIfExists("user_activity_list");
}
