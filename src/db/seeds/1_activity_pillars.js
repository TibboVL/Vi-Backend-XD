/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex("activity_pillar").del();
  // Insert the 4 pillars
  await knex("activity_pillar").insert([
    {
      pillarId: 1,
      name: "Mindfulness",
      description: "Practices to enhance awareness, calm, and mental clarity.",
    },
    {
      pillarId: 2,
      name: "Physical",
      description: "Physical activities to improve energy and health.",
    },
    {
      pillarId: 3,
      name: "Social",
      description: "Interactions that build community and relationships.",
    },
    {
      pillarId: 4,
      name: "Skills",
      description: "Activities that grow personal and professional abilities.",
    },
  ]);
}
