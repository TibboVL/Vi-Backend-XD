/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex("mood").del();

  // Insert base moods first
  const baseMoods = [
    { moodId: 1, label: "Happy" },
    { moodId: 2, label: "Sad" },
    { moodId: 3, label: "Angry" },
    { moodId: 4, label: "Fearful" },
    { moodId: 5, label: "Bad" },
    { moodId: 6, label: "Surprised" },
  ];

  await knex("mood").insert(baseMoods);

  // !! ensure POSTGRES doesnt attempt to use our existing ids in auto assignment !!
  await knex.raw(
    `SELECT setval(pg_get_serial_sequence('mood', 'moodId'), (SELECT MAX("moodId") FROM mood))`
  );

  // Sub-moods referencing parentMoodId
  const subMoods = [
    // Happy
    { label: "Playful", parentMoodId: 1, enjoyment: 0.8, alertness: 0.7 },
    { label: "Content", parentMoodId: 1, enjoyment: 0.6, alertness: 0.3 },
    { label: "Interested", parentMoodId: 1, enjoyment: 0.7, alertness: 0.5 },
    { label: "Proud", parentMoodId: 1, enjoyment: 0.8, alertness: 0.6 },
    { label: "Accepted", parentMoodId: 1, enjoyment: 0.7, alertness: 0.4 },
    { label: "Powerful", parentMoodId: 1, enjoyment: 0.8, alertness: 0.7 },
    { label: "Peaceful", parentMoodId: 1, enjoyment: 0.7, alertness: 0.1 },
    { label: "Trusting", parentMoodId: 1, enjoyment: 0.7, alertness: 0.4 },
    { label: "Optimistic", parentMoodId: 1, enjoyment: 0.8, alertness: 0.5 },

    // Sad
    { label: "Lonely", parentMoodId: 2, enjoyment: -0.6, alertness: -0.3 },
    { label: "Vulnerable", parentMoodId: 2, enjoyment: -0.5, alertness: -0.2 },
    { label: "Despair", parentMoodId: 2, enjoyment: -1.0, alertness: -0.6 },
    { label: "Guilty", parentMoodId: 2, enjoyment: -0.7, alertness: 0.0 },
    { label: "Depressed", parentMoodId: 2, enjoyment: -0.9, alertness: -0.7 },
    { label: "Hurt", parentMoodId: 2, enjoyment: -0.8, alertness: 0.2 },

    // Angry
    { label: "Let Down", parentMoodId: 3, enjoyment: -0.7, alertness: 0.3 },
    { label: "Humiliated", parentMoodId: 3, enjoyment: -0.8, alertness: 0.4 },
    { label: "Bitter", parentMoodId: 3, enjoyment: -0.7, alertness: 0.5 },
    { label: "Mad", parentMoodId: 3, enjoyment: -0.8, alertness: 0.7 },
    { label: "Aggressive", parentMoodId: 3, enjoyment: -0.9, alertness: 0.9 },
    { label: "Frustrated", parentMoodId: 3, enjoyment: -0.7, alertness: 0.6 },
    { label: "Distant", parentMoodId: 3, enjoyment: -0.6, alertness: -0.2 },
    { label: "Critical", parentMoodId: 3, enjoyment: -0.7, alertness: 0.5 },

    // Fearful
    { label: "Scared", parentMoodId: 4, enjoyment: -0.8, alertness: 0.8 },
    { label: "Anxious", parentMoodId: 4, enjoyment: -0.7, alertness: 0.7 },
    { label: "Insecure", parentMoodId: 4, enjoyment: -0.6, alertness: 0.4 },
    { label: "Weak", parentMoodId: 4, enjoyment: -0.7, alertness: 0.1 },
    { label: "Rejected", parentMoodId: 4, enjoyment: -0.8, alertness: 0.3 },
    { label: "Threatened", parentMoodId: 4, enjoyment: -0.9, alertness: 0.9 },

    // Bad
    { label: "Tired", parentMoodId: 5, enjoyment: -0.4, alertness: -0.6 },
    { label: "Stressed", parentMoodId: 5, enjoyment: -0.6, alertness: 0.4 },
    { label: "Busy", parentMoodId: 5, enjoyment: -0.3, alertness: 0.3 },
    { label: "Bored", parentMoodId: 5, enjoyment: -0.5, alertness: -0.4 },
    { label: "Repelled", parentMoodId: 5, enjoyment: -0.7, alertness: 0.1 },
    { label: "Awful", parentMoodId: 5, enjoyment: -0.8, alertness: -0.5 },
    {
      label: "Disappointed",
      parentMoodId: 5,
      enjoyment: -0.7,
      alertness: -0.1,
    },
    { label: "Disapproving", parentMoodId: 5, enjoyment: -0.6, alertness: 0.0 },

    // Surprised
    { label: "Startled", parentMoodId: 6, enjoyment: 0.0, alertness: 1.0 },
    { label: "Confused", parentMoodId: 6, enjoyment: -0.1, alertness: 0.7 },
    { label: "Amazed", parentMoodId: 6, enjoyment: 0.5, alertness: 0.8 },
    { label: "Excited", parentMoodId: 6, enjoyment: 0.7, alertness: 0.9 },
  ];

  await knex("mood").insert(subMoods);
}
