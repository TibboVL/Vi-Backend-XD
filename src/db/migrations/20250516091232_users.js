/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("user", (table) => {
    table.increments("userId").unsigned().notNullable(); // internal PK
    table.string("auth0Id").notNullable().unique(); // Auth0's unique user ID from the JWT "sub"

    table.string("email").notNullable().unique();
    table.string("username").notNullable();
    table.string("firstname").nullable();
    table.string("lastname").nullable();

    table.dateTime("lastLogin");

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
  await knex.schema.dropTable("user");
}
