export async function up(knex) {
  await knex.schema.createTable("subscription", (table) => {
    table.increments("subscriptionId").unsigned().notNullable();
    table.integer("userId").unsigned().notNullable();
    table.integer("planId").unsigned().notNullable();

    table.timestamp("startDate").notNullable();
    table.timestamp("endDate").nullable();

    table.boolean("isActive").unsigned().notNullable().defaultTo(true);
    table.boolean("autoRenew").unsigned().notNullable().defaultTo(false);

    table
      .foreign("userId")
      .references("userId")
      .inTable("user")
      .onDelete("SET NULL"); // user deleted -> set linked user to null
    table
      .foreign("planId")
      .references("planId")
      .inTable("plan")
      .onDelete("RESTRICT"); // dont allow deleting plans if any subscription is tied to them
  });
}

export async function down(knex) {
  await knex.schema.dropTable("subscription");
}
