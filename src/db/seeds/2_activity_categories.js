/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex("activity_category").del();

  // Dynamically fetch pillar IDs
  const pillars = await knex("activity_pillar").select("pillarId", "name");
  const pillarMap = Object.fromEntries(
    pillars.map((p) => [p.name, p.pillarId])
  );

  const categories = [
    // Mindfulness
    {
      pillar: "Mindfulness",
      name: "Meditation",
      description: "Guided or silent mindfulness practice.",
    },
    {
      pillar: "Mindfulness",
      name: "Journaling",
      description: "Writing thoughts or feelings in a notebook or app.",
    },
    {
      pillar: "Mindfulness",
      name: "Breathing Exercises",
      description: "Simple breathwork routines to calm the mind.",
    },
    {
      pillar: "Mindfulness",
      name: "Gratitude Practice",
      description: "Reflecting on things you're thankful for.",
    },
    {
      pillar: "Mindfulness",
      name: "Nature Time",
      description: "Spending quiet time in natural surroundings.",
    },
    {
      pillar: "Mindfulness",
      name: "Stretching",
      description: "Gentle body stretches to release tension.",
    },

    // Physical
    {
      pillar: "Physical",
      name: "Walking",
      description: "Low-intensity movement, indoor or outdoor.",
    },
    {
      pillar: "Physical",
      name: "Running",
      description: "Higher intensity cardio.",
    },
    {
      pillar: "Physical",
      name: "Cycling",
      description: "Biking indoors or outdoors.",
    },
    {
      pillar: "Physical",
      name: "Swimming",
      description: "Water-based physical exercise.",
    },
    {
      pillar: "Physical",
      name: "Strength Training",
      description: "Bodyweight or weighted exercises.",
    },
    {
      pillar: "Physical",
      name: "Dance",
      description: "Movement through music, solo or with others.",
    },
    {
      pillar: "Physical",
      name: "Yoga",
      description: "A mix of movement and mindfulness.",
    },

    // Social
    {
      pillar: "Social",
      name: "Call Someone",
      description: "Have a voice or video call with someone you know.",
    },
    {
      pillar: "Social",
      name: "Meet a Friend",
      description: "Hang out with someone in real life.",
    },
    {
      pillar: "Social",
      name: "Group Activity",
      description: "Join an event or community session.",
    },
    {
      pillar: "Social",
      name: "Volunteering",
      description: "Help out a cause or local organization.",
    },
    {
      pillar: "Social",
      name: "Play a Game",
      description: "Board games, online games, or local matches.",
    },
    {
      pillar: "Social",
      name: "Shared Meal",
      description: "Cook or eat with others.",
    },

    // Skillset
    {
      pillar: "Skills",
      name: "Learn a Language",
      description: "Study or practice a new language.",
    },
    {
      pillar: "Skills",
      name: "Creative Writing",
      description: "Write poems, short stories, or blog posts.",
    },
    {
      pillar: "Skills",
      name: "Drawing",
      description: "Create visual art by sketching or painting.",
    },
    {
      pillar: "Skills",
      name: "DIY Projects",
      description: "Build or fix something by yourself.",
    },
    {
      pillar: "Skills",
      name: "Coding",
      description: "Learn or practice programming.",
    },
    {
      pillar: "Skills",
      name: "Cooking New Recipe",
      description: "Try something new in the kitchen.",
    },
    {
      pillar: "Skills",
      name: "Online Course",
      description: "Take a class to learn a skill.",
    },
    {
      pillar: "Skills",
      name: "Play an Instrument",
      description: "Practice or learn music.",
    },
  ];

  /*   console.log(pillarMap);
  console.log(pillarMap["Skills"]); */

  // Insert while resolving pillarId
  await knex("activity_category").insert(
    categories.map((cat) => ({
      activityPillar: pillarMap[cat.pillar],
      name: cat.name,
      description: cat.description,
    }))
  );
}
