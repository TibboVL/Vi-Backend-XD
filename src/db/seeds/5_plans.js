/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex("plan").del();
  await knex("plan").insert([
    {
      planId: 1,
      name: "Free",
      slug: "free",
      price: 0,
      maxAIRequestsPerDay: 3,
      maxAIResultsShown: 3,
      currency: "EUR",
      isActive: true,
    },
    {
      planId: 2,
      name: "Premium",
      slug: "premium",
      price: 3.99,
      maxAIRequestsPerDay: 10,
      maxAIResultsShown: 5,
      currency: "EUR",
      isActive: true,
    },
  ]);
}
