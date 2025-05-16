/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("user", (table) => {
    table.increments("userId");
    table.string("email").notNullable().unique();
    table.string("firstname").notNullable();
    table.string("lastname").notNullable();
    table.timestamps();

    table.dateTime("lastLogin");

    /*     table
      .foreign("subscription")
      .references("subscriptionId")
      .inTable("subscription"); */
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("user");
}
