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
      name: "Coffee Catch-Up",
      description:
        "Grab a coffee (in person or virtually) with a friend and chat for 30 minutes.",
      source: "Hardcoded",
      energyRequired: "medium",
      estimatedCost: 3,
      isGroupActivity: true,
      estimatedDurationMinutes: 30,
      categories: [
        { category: "Coffee", pillar: "Social" },
        { category: "Chat", pillar: "Social" },
      ],
    },
    {
      name: "Evening Walk",
      description: "Go for a 5 km walk outdoors at a leisurely pace.",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: true,
      estimatedDurationMinutes: 45,
      categories: [
        { category: "Walk", pillar: "Physical" },
        { category: "Outdoor", pillar: "Physical" },
      ],
    },
    {
      name: "Gratitude Journal",
      description: "Write down three things you’re grateful for today and why.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 10,
      categories: [
        { category: "Journal", pillar: "Mindfulness" },
        { category: "Reflection", pillar: "Mindfulness" },
      ],
    },
    {
      name: "Desk Stretch Break",
      description:
        "Set an hourly timer; when it rings, do a 5-minute desk stretch routine.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 5,
      categories: [
        { category: "Stretch", pillar: "Physical" },
        { category: "Break", pillar: "Physical" },
      ],
    },
    {
      name: "Micro-Course Session",
      description:
        "Complete one ~20 min lesson on a learning platform (coding, language, etc.).",
      source: "Hardcoded",
      energyRequired: "medium",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 20,
      categories: [{ category: "Course", pillar: "Skills" }],
    },
    {
      name: "Guided Breathing",
      description:
        "Follow a 5-minute box-breathing exercise (4 s inhale/hold/exhale/hold).",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 5,
      categories: [{ category: "Breathing", pillar: "Mindfulness" }],
    },
    {
      name: "Try a New Workout",
      description:
        "Pick a 15–20 min YouTube yoga or HIIT video you’ve never done before.",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 20,
      categories: [
        { category: "Workout", pillar: "Physical" },
        { category: "Video", pillar: "Physical" },
      ],
    },
    {
      name: "Send a Thank-You Note",
      description:
        "Write and send a short message of appreciation to someone who helped you.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 10,
      categories: [
        { category: "Note", pillar: "Social" },
        { category: "Thanks", pillar: "Social" },
      ],
    },
    {
      name: "Learn a Shortcut",
      description:
        "Spend 15 minutes mastering a new keyboard shortcut or IDE plugin.",
      source: "Hardcoded",
      energyRequired: "medium",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 15,
      categories: [{ category: "Shortcut", pillar: "Skills" }],
    },
    {
      id: 10,
      name: "Volunteer Online",
      description:
        "Spend 30 minutes helping a nonprofit (tutoring, translations, etc.).",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: true,
      estimatedDurationMinutes: 30,
      categories: [
        { category: "Volunteer", pillar: "Social" },
        { category: "Service", pillar: "Social" },
      ],
    },
    {
      name: "Nature Observation",
      description:
        "Spend 10 minutes outside noting three new things you’ve never noticed before.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 10,
      categories: [
        { category: "Nature", pillar: "Mindfulness" },
        { category: "Observation", pillar: "Mindfulness" },
      ],
    },

    {
      name: "isGroupActivity Yoga",
      description: "Join a friend for a 30 min yoga session (live or online).",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: true,
      estimatedDurationMinutes: 30,
      categories: [
        { category: "Yoga", pillar: "Physical" },
        { category: "isGroupActivity", pillar: "Physical" },
      ],
    },
    {
      name: "Teach Back",
      description:
        "Explain a tough concept you learned yesterday to an imaginary peer.",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 20,
      categories: [
        { category: "Teach", pillar: "Skills" },
        { category: "Review", pillar: "Skills" },
      ],
    },
    {
      name: "Bike Ride",
      description: "Go for a 10 km bike ride around your neighborhood.",
      source: "Hardcoded",
      energyRequired: "very high",
      estimatedCost: 0,
      isGroupActivity: true,
      estimatedDurationMinutes: 45,
      categories: [
        { category: "Cycle", pillar: "Physical" },
        { category: "Outdoor", pillar: "Physical" },
      ],
    },
    {
      name: "Language Practice",
      description:
        "Have a 20 min conversation in a foreign language on a tandem app.",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: true,
      estimatedDurationMinutes: 20,
      categories: [
        { category: "Language", pillar: "Skills" },
        { category: "Chat", pillar: "Skills" },
      ],
    },
    {
      name: "Digital Detox",
      description:
        "Put away all screens for 30 minutes and do a paper puzzle or read a book.",
      source: "Hardcoded",
      energyRequired: "medium",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 30,
      categories: [
        { category: "Detox", pillar: "Mindfulness" },
        { category: "Reading", pillar: "Mindfulness" },
      ],
    },
    {
      name: "Dance Break",
      description:
        "Put on your favorite song and dance for 5 minutes non-stop.",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 5,
      categories: [
        { category: "Dance", pillar: "Physical" },
        { category: "Music", pillar: "Mindfulness" },
      ],
    },
    {
      name: "Send a Meme",
      description: "Share a funny meme with a friend to brighten their day.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedCost: 0,
      isGroupActivity: true,
      estimatedDurationMinutes: 5,
      categories: [
        { category: "Meme", pillar: "Social" },
        { category: "Humor", pillar: "Mindfulness" },
      ],
    },
    {
      name: "Read a Tech Article",
      description:
        "Spend 20 minutes reading an article on a tech topic you’re curious about.",
      source: "Hardcoded",
      energyRequired: "medium",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 20,
      categories: [{ category: "Read", pillar: "Skills" }],
    },
    {
      name: "Gratitude Call",
      description:
        "Call someone and tell them why you appreciate them for 10 minutes.",
      source: "Hardcoded",
      energyRequired: "medium",
      estimatedCost: 0,
      isGroupActivity: true,
      estimatedDurationMinutes: 10,
      categories: [
        { category: "Call", pillar: "Social" },
        { category: "Gratitude", pillar: "Mindfulness" },
      ],
    },
    {
      name: "Quick Cleanup",
      description: "Spend 15 minutes tidying your workspace or a room.",
      source: "Hardcoded",
      energyRequired: "medium",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 15,
      categories: [
        { category: "Clean", pillar: "Physical" },
        { category: "Organize", pillar: "Skills" },
      ],
    },
    {
      name: "Guided Meditation",
      description: "Use an app for a 10 minute guided mindfulness meditation.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 10,
      categories: [{ category: "Meditate", pillar: "Mindfulness" }],
    },
    {
      name: "Photo Walk",
      description: "Take a 30 min walk and snap photos of interesting scenes.",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 30,
      categories: [
        { category: "Walk", pillar: "Physical" },
        { category: "Photo", pillar: "Mindfulness" },
      ],
    },
    {
      name: "Peer Feedback",
      description:
        "Share a piece of your work and ask a colleague for 15 min of feedback.",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: true,
      estimatedDurationMinutes: 15,
      categories: [
        { category: "Feedback", pillar: "Skills" },
        { category: "Share", pillar: "Social" },
      ],
    },
    {
      name: "Mindful Drawing",
      description:
        "Spend 10 minutes doodling or sketching without any goal in mind.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 10,
      categories: [
        { category: "Art", pillar: "Mindfulness" },
        { category: "Creative", pillar: "Mindfulness" },
      ],
    },
    {
      name: "Sprint Session",
      description:
        "Do a 25 min focused work sprint followed by a 5 min break (Pomodoro).",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 30,
      categories: [
        { category: "Focus", pillar: "Skills" },
        { category: "Break", pillar: "Physical" },
      ],
    },
    {
      name: "Fruit Smoothie",
      description: "Make and enjoy a healthy fruit smoothie in 10 minutes.",
      source: "Hardcoded",
      energyRequired: "medium",
      estimatedCost: 2,
      isGroupActivity: false,
      estimatedDurationMinutes: 10,
      categories: [
        { category: "Nutrition", pillar: "Physical" },
        { category: "Healthy", pillar: "Mindfulness" },
      ],
    },
    {
      name: "Game Night Invite",
      description:
        "Invite a friend to play an online or board game for 1 hour.",
      source: "Hardcoded",
      energyRequired: "high",
      estimatedCost: 0,
      isGroupActivity: true,
      estimatedDurationMinutes: 60,
      categories: [
        { category: "Game", pillar: "Social" },
        { category: "Play", pillar: "Social" },
      ],
    },
    {
      name: "Read a Poem",
      description: "Spend 10 minutes reading and reflecting on a poem.",
      source: "Hardcoded",
      energyRequired: "low",
      estimatedCost: 0,
      isGroupActivity: false,
      estimatedDurationMinutes: 10,
      categories: [
        { category: "Read", pillar: "Mindfulness" },
        { category: "Poetry", pillar: "Mindfulness" },
      ],
    },
  ];

  // Insert activities without categories first
  const insertedActivities = await knex("activity")
    .insert(activities.map(({ id, categories, ...rest }) => rest))
    .returning(["activityId", "name"]);

  // Dynamically fetch pillar IDs
  const pillars = await knex("activity_pillar").select("pillarId", "name");
  const pillarMap = pillars.map((p) => ({
    name: p.name.toLowerCase(),
    pillarId: p.pillarId,
  }));

  let categories = activities
    .map(({ categories, ...rest }) => categories)
    .flat(1);

  // remove duplicates
  const seen = new Set();
  categories = categories.filter((el) => {
    const duplicate = seen.has(el.category);
    seen.add(el.category);
    return !duplicate;
  });

  categories = categories.map((cat) => ({
    pillarId: pillarMap.find(
      (pillar) => pillar.name == cat.pillar.toLowerCase()
    ).pillarId,
    ...cat,
  }));

  // Insert while resolving pillarId
  const categoriesFromDb = await knex("activity_category").insert(
    categories.map((cat) => ({
      activityPillarId: cat.pillarId,
      name: cat.category.toLowerCase(),
      description: cat.description,
    })),
    ["activityCategoryId", "name"]
  );

  // Map category name to ID
  const categoryNameToId = await categoriesFromDb.reduce((map, cat) => {
    map[cat.name] = cat.activityCategoryId;
    return map;
  }, {});

  // Prepare join table rows (activityId, activityCategoryId)
  const activityCategoryLinks = [];

  for (const activity of activities) {
    // find inserted activity ID by name
    const inserted = insertedActivities.find((a) => a.name === activity.name);
    if (!inserted) continue;
    console.log("heeere");
    for (const categoryName of activity.categories.map((cat) => cat.category)) {
      console.log(categoryName);
      const categoryId = categoryNameToId[categoryName.toLowerCase()];
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
