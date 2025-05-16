/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear join table and activities first
  await knex("activity_activity_category").del();
  await knex("activity").del();

  // Activities with category names (must exactly match category.name)
  const activities = [
    {
      name: "Stretching Routine",
      description: "A short routine of full-body stretches to release tension.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedDurationMinutes: 10,
      currency: "EUR",
      estimatedCost: 0,
      isGroupActivity: false,
      locationLatitude: null,
      locationLongitude: null,
      categories: ["Stretching"], // Your category name from mindfulness pillar
    },
    {
      name: "Meditation",
      description: "Spend a few minutes focusing on your breath or a mantra.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedDurationMinutes: 10,
      currency: "EUR",
      estimatedCost: 0,
      isGroupActivity: false,
      locationLatitude: null,
      locationLongitude: null,
      categories: ["Meditation"],
    },
    {
      name: "Journaling",
      description:
        "Write down your thoughts, goals, or reflections for the day.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedDurationMinutes: 15,
      currency: "EUR",
      estimatedCost: 0,
      isGroupActivity: false,
      locationLatitude: null,
      locationLongitude: null,
      categories: ["Journaling"],
    },
    {
      name: "Bodyweight Exercise",
      description:
        "A short set of exercises like push-ups, squats, and planks.",
      source: "Hardcoded",
      energyRequired: "medium",
      estimatedDurationMinutes: 15,
      currency: "EUR",
      estimatedCost: 0,
      isGroupActivity: false,
      locationLatitude: null,
      locationLongitude: null,
      categories: ["Strength Training"],
    },
    {
      name: "Take a Power Nap",
      description: "Lie down for a short 15-minute nap to refresh your mind.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedDurationMinutes: 15,
      currency: "EUR",
      estimatedCost: 0,
      isGroupActivity: false,
      locationLatitude: null,
      locationLongitude: null,
      categories: [], // no category for this one
    },
    {
      name: "Drink a Glass of Water",
      description: "Rehydrate your body — simple and effective.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedDurationMinutes: 2,
      currency: "EUR",
      estimatedCost: 0,
      isGroupActivity: false,
      locationLatitude: null,
      locationLongitude: null,
      categories: [], // no category here either
    },
  ];

  // Insert activities without categories first
  const insertedActivities = await knex("activity").insert(
    activities.map(({ categories, ...rest }) => rest),
    ["activityId", "name"]
  );

  // Fetch all categories from DB to get IDs
  const categoriesFromDb = await knex("activity_category").select(
    "activityCategoryId",
    "name"
  );

  // Map category name to ID
  const categoryNameToId = categoriesFromDb.reduce((map, cat) => {
    map[cat.name] = cat.activityCategoryId;
    return map;
  }, {});

  // Prepare join table rows (activityId, activityCategoryId)
  const activityCategoryLinks = [];

  for (const activity of activities) {
    // find inserted activity ID by name
    const inserted = insertedActivities.find((a) => a.name === activity.name);
    if (!inserted) continue;

    for (const categoryName of activity.categories) {
      const categoryId = categoryNameToId[categoryName];
      if (categoryId) {
        activityCategoryLinks.push({
          activityId: inserted.activityId,
          activityCategoryId: categoryId,
        });
      }
    }
  }

  // Insert into join table
  if (activityCategoryLinks.length > 0) {
    await knex("activity_activity_category").insert(activityCategoryLinks);
  }
}
