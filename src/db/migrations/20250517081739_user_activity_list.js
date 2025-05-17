export async function up(knex) {
  await knex.schema.createTable("user_activity_list", (table) => {
    table.increments("userActivityId").unsigned().notNullable();
    table.integer("userId").unsigned().notNullable();
    table.integer("activityId").unsigned().notNullable();
    table.integer("checkinId").unsigned().nullable();

    table.timestamp("plannedStart").notNullable();
    table.timestamp("plannedEnd").nullable();

    table.timestamp("timestamp");

    // Foreign keys
    table
      .foreign("userId")
      .references("userId")
      .inTable("user")
      .onDelete("CASCADE"); // user deleted -> delete activity lists

    table
      .foreign("activityId")
      .references("activityId")
      .inTable("activity")
      .onDelete("CASCADE"); // activity deleted -> delete activity lists

    table
      .foreign("checkinId")
      .references("checkinId")
      .inTable("checkin")
      .onDelete("SET NULL"); // checkin deleted -> set null
  });

  // Then add FK constraint on checkin.userActivityId via alter table
  await knex.schema.alterTable("checkin", (table) => {
    table
      .foreign("userActivityId")
      .references("userActivityId")
      .inTable("user_activity_list")
      .onDelete("CASCADE"); //
  });
}

export async function down(knex) {
  //await knex.schema.dropTable("user_activity_list");
}
