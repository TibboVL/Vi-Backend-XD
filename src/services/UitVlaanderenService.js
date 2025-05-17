import dotenv from "dotenv";
import "../types/types.js"; // Import type definitions
import db from "../db/index.js";

// const UitSearchAPIURI = "https://search-test.uitdatabank.be";
const UitSearchAPIURI = "https://search-test.uitdatabank.be";

/**
 * @typedef {Object} Filters
 * @property {string} [postalCode]
 *  */

/**
 * @typedef {import('../types/types.js').Event} Event
 */

/**
 * @param {Filters} filters
 * @returns {Promise<Event[]>}
 */
export const getUitEventDecodedList = async (filters) => {
  const { postalCode } = filters;
  console.log(filters);
  console.log(postalCode);
  dotenv.config();

  console.log("Client ID:", process.env.UIT_CLIENT_ID);

  const now = new Date().toISOString();
  const in14Days = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000
  ).toISOString();
  const dateRange = `availableRange:[${now} TO ${in14Days}]`;
  const dateRangeQuery = `&q=${encodeURIComponent(
    dateRange
  )}&availableFrom=*&availableTo=*`;
  try {
    const events = await fetch(
      UitSearchAPIURI +
        "/events" +
        "?bookingAvailability=Available" +
        "&languages[]=nl" +
        dateRangeQuery +
        "&status=Available" +
        "&q=address.nl.addressLocality:Antwerpen" + // can filter on province or postalcode
        (postalCode ? "&postalCode=" + postalCode : ""),
      {
        method: "GET",
        headers: {
          "X-Client-Id": process.env.UIT_CLIENT_ID,
        },
      }
    );
    const encodedEvents = await events.json();
    //console.log(encodedEvents);
    const decodedEvents = await handleEventListDecode(encodedEvents.member);
    //console.log(decodedEvents);

    await handleInsertToDB(decodedEvents);

    return decodedEvents;
  } catch (error) {
    console.error(error);
  }

  // console.log(events.body);
};

const handleInsertToDB = async (decodedEvents) => {
  const pillars = await db("activity_pillar").select("*");
  //console.log(pillars);

  for (const event of decodedEvents) {
    const transformedEvent = transformUitEvent(event);
    const categories = transformedEvent.categories;

    if (!Array.isArray(categories) || categories.length === 0) {
      console.warn(`Activity: "${transformedEvent.name}" has no categories`);
      continue;
    }

    // Step 1: Prepare list of category IDs
    const categoryIds = [];
    for (const cat of categories) {
      const pillar = pillars.find(
        (pillar) => pillar.name.toLowerCase() == cat.pillar.toLowerCase()
      );
      // console.log(cat);
      // console.log(pillar);
      // console.log("pillar?.pillarId ", pillar?.pillarId);
      // Check if category exists
      let categoryId = await db("activity_category")
        .where("name", cat.category)
        .where("activityPillarId", pillar?.pillarId) // !! only check on name ?! may need to change in the future
        .first()
        .then((res) => {
          console.log(res);
          return res?.activityCategoryId;
        });

      console.log(
        `Does it exist? category id: ${categoryId} - pillar: ${
          pillar?.pillarId
        } - cat: ${JSON.stringify(cat)} - cats ${JSON.stringify(categories)}`
      );
      // Insert if not exists
      if (categoryId == null) {
        const [newCategory] = await db("activity_category")
          .insert({ name: cat.category, activityPillarId: pillar?.pillarId })
          .returning("activityCategoryId");
        categoryId = newCategory.activityCategoryId;
      }

      categoryIds.push(categoryId);
    }

    // Step 2: Remove categories before inserting activity
    delete transformedEvent.categories;

    // Step 3: Truncate fields
    if (transformedEvent.name.length > 255)
      transformedEvent.name = transformedEvent.name.slice(0, 255);
    if (transformedEvent.description?.length > 1000)
      transformedEvent.description = transformedEvent.description.slice(
        0,
        1000
      );

    // Step 4: Check if activity already exists
    const exists = await db("activity")
      .where({
        name: transformedEvent.name,
        startDate: transformedEvent.startDate,
        locationCity: transformedEvent.locationCity,
      })
      .first();
    if (exists) return;

    // Step 5: Insert activity
    const [activityInsertResult] = await db("activity")
      .insert(transformedEvent)
      .returning("activityId");
    const activityId = activityInsertResult.activityId ?? activityInsertResult;

    // Step 6: Link activity to all its categories
    const links = categoryIds.map((categoryId) => ({
      activityId: activityId,
      activityCategoryId: categoryId,
    }));
    console.log(categoryIds);
    await db("activity_activity_category").insert(links);
  }
};

const handleEventListDecode = async (eventList) => {
  /** @type {import('../types/types.js').Event[]} */
  const decodedEventsList = [];
  for (const event of eventList) {
    // console.log(event);
    console.log(event["@id"]);
    const response = await fetch(event["@id"], {
      method: "GET",
      headers: {
        "X-Client-Id": process.env.UIT_CLIENT_ID,
      },
    });
    const decodedEvent = await response.json();
    //console.log(decodedEvent);
    // const decodedEvent = await decoedEvent.json();
    decodedEventsList.push(decodedEvent);
  }
  return decodedEventsList;
};
export function transformUitEvent(event) {
  return {
    // Core fields
    name: event.name.nl.trim(),
    description: event?.description?.nl?.substring(0, 1000),
    source: "UITVlaanderen",

    // Categories (event type + theme terms)
    categories: mapActivityToPillarCategories(event),

    // Duration calculation (handles subEvents)
    estimatedDurationMinutes: calculateTotalDuration(event),

    // Energy placeholder (see options below)
    energyRequired: "low", // Temporary value

    // Location data
    locationCity: event.location?.address?.nl?.addressLocality,
    locationLatitude: event.location?.geo?.latitude,
    locationLongitude: event.location?.geo?.longitude,

    // dates
    startDate: event.startDate,
    endDate: event.endDate,

    // Price info
    currency: getCurrency(event.priceInfo),
    estimatedCost: getPrice(event.priceInfo),

    // Group activity detection
    isGroupActivity: detectGroupActivity(event.terms),
  };
}

// Duration calculation (handles single events and subEvents)
function calculateTotalDuration(event) {
  if (event.subEvent?.length > 0) {
    return event.subEvent.reduce((total, subEvent) => {
      return (
        total + calculateSingleDuration(subEvent.startDate, subEvent.endDate)
      );
    }, 0);
  }
  return calculateSingleDuration(event.startDate, event.endDate);
}

function calculateSingleDuration(startISO, endISO) {
  try {
    const start = new Date(startISO);
    const end = new Date(endISO);
    // @ts-ignore
    return Math.round((end - start) / (1000 * 60)); // Minutes
  } catch {
    return 0; // Fallback for invalid dates
  }
}

// Price helpers
function getCurrency(priceInfo) {
  return priceInfo?.[0]?.priceCurrency || "EUR";
}

function getPrice(priceInfo) {
  return priceInfo?.[0]?.price || null;
}

// Group activity detection
function detectGroupActivity(terms) {
  const groupIndicators = ["workshop", "class", "course", "group"];
  return (terms || []).some((term) =>
    groupIndicators.some((indicator) =>
      term.label.toLowerCase().includes(indicator)
    )
  );
}

const CATEGORY_MAPPINGS = [
  // Mindfulness
  {
    labels: [
      "meditatie",
      "mindfulness",
      "dankbaarheid",
      "zingeving",
      "religie",
    ],
    pillar: "Mindfulness",
    category: "Meditation",
  },
  {
    labels: ["gezondheid", "wellness"],
    pillar: "Mindfulness",
    category: "Wellness",
  },

  // Physical
  {
    labels: ["sport", "wandelen", "yoga", "dans"],
    pillar: "Physical",
    category: "Exercise",
  },
  { labels: ["slow sports"], pillar: "Physical", category: "Low Impact" },

  // Skills
  {
    labels: ["cursus", "opleiding", "illustratie", "kunsteducatie"],
    pillar: "Skills",
    category: "Creative Workshop",
  },
  { labels: ["lezing", "congres"], pillar: "Skills", category: "Lecture" },
  { labels: ["tarot"], pillar: "Skills", category: "Spiritual Course" },

  // Social
  {
    labels: ["bijeenkomst", "samenkomst", "kamp", "vakantie"],
    pillar: "Social",
    category: "Group Activity",
  },
  {
    labels: ["kinderen", "jongeren", "familie"],
    pillar: "Social",
    category: "Family/Youth",
  },
];

function mapActivityToPillarCategories(uitActivity) {
  const termLabels = uitActivity.terms.map((t) => t.label.toLowerCase().trim());
  const text = `${uitActivity.title} ${
    uitActivity.description || ""
  }`.toLowerCase();

  const matches = new Set();

  for (const mapping of CATEGORY_MAPPINGS) {
    for (const keyword of mapping.labels) {
      // Match in term labels or full text
      if (
        termLabels.some((label) => label.includes(keyword)) ||
        text.includes(keyword)
      ) {
        matches.add(
          JSON.stringify({ pillar: mapping.pillar, category: mapping.category })
        );
        break; // Avoid duplicate from same mapping
      }
    }
  }

  return Array.from(matches).map((m) => JSON.parse(m));
}
