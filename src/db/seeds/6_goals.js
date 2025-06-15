/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex("goal").del();
  await knex("goal").insert([
    {
      label: "Stress regulation",
      slug: "stress_regulation",
    },
    {
      label: "Increase mindfulness",
      slug: "increase_mindfulness",
    },
    {
      label: "Awesome sleep",
      slug: "awesome_sleep",
    },
    {
      label: "Enhanced focus",
      slug: "enhanced_focus",
    },
    {
      label: "Increase energy",
      slug: "increase_energy",
    },
    {
      label: "Strengthen friendships",
      slug: "strengthen_friendships",
    },
  ]);
}
