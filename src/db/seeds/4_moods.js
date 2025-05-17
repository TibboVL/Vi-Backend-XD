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
    { label: "Playful", parentMoodId: 1 },
    { label: "Content", parentMoodId: 1 },
    { label: "Interested", parentMoodId: 1 },
    { label: "Proud", parentMoodId: 1 },
    { label: "Accepted", parentMoodId: 1 },
    { label: "Powerful", parentMoodId: 1 },
    { label: "Peaceful", parentMoodId: 1 },
    { label: "Trusting", parentMoodId: 1 },
    { label: "Optimistic", parentMoodId: 1 },

    // Sad
    { label: "Lonely", parentMoodId: 2 },
    { label: "Vulnerable", parentMoodId: 2 },
    { label: "Despair", parentMoodId: 2 },
    { label: "Guilty", parentMoodId: 2 },
    { label: "Depressed", parentMoodId: 2 },
    { label: "Hurt", parentMoodId: 2 },

    // Angry
    { label: "Let Down", parentMoodId: 3 },
    { label: "Humiliated", parentMoodId: 3 },
    { label: "Bitter", parentMoodId: 3 },
    { label: "Mad", parentMoodId: 3 },
    { label: "Aggressive", parentMoodId: 3 },
    { label: "Frustrated", parentMoodId: 3 },
    { label: "Distant", parentMoodId: 3 },
    { label: "Critical", parentMoodId: 3 },

    // Fearful
    { label: "Scared", parentMoodId: 4 },
    { label: "Anxious", parentMoodId: 4 },
    { label: "Insecure", parentMoodId: 4 },
    { label: "Weak", parentMoodId: 4 },
    { label: "Rejected", parentMoodId: 4 },
    { label: "Threatened", parentMoodId: 4 },

    // Bad
    { label: "Tired", parentMoodId: 5 },
    { label: "Stressed", parentMoodId: 5 },
    { label: "Busy", parentMoodId: 5 },
    { label: "Bored", parentMoodId: 5 },
    { label: "Repelled", parentMoodId: 5 },
    { label: "Awful", parentMoodId: 5 },
    { label: "Disappointed", parentMoodId: 5 },
    { label: "Disapproving", parentMoodId: 5 },

    // Surprised
    { label: "Startled", parentMoodId: 6 },
    { label: "Confused", parentMoodId: 6 },
    { label: "Amazed", parentMoodId: 6 },
    { label: "Excited", parentMoodId: 6 },
  ];

  await knex("mood").insert(subMoods);
}
