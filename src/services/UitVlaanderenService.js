import dotenv from "dotenv";
import "../types/types.js"; // Import type definitions
import db from "../db/index.js";
import { DateTime } from "luxon";

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

  const now = DateTime.now()
    .setZone("Europe/Brussels")
    .toFormat("yyyy-MM-dd'T'HH:mm:ssZZ"); // ✅ NO milliseconds

  const in14Days = DateTime.now()
    .plus({ days: 14 })
    .setZone("Europe/Brussels")
    .toFormat("yyyy-MM-dd'T'HH:mm:ssZZ"); // ✅ Same here

  const escapedNow = now.replace(/:/g, "\\:");
  const escapedIn14Days = in14Days.replace(/:/g, "\\:");
  const dateRangeQuery = `availableRange:[${escapedNow} TO ${escapedIn14Days}]`;
  const q = encodeURIComponent(
    `address.nl.addressLocality:Antwerpen AND ${dateRangeQuery}`
  );

  console.log(dateRangeQuery);

  // return;
  try {
    const events = await fetch(
      UitSearchAPIURI +
        "/events" +
        `?q=${q}` +
        "&bookingAvailability=Available" +
        "&languages[]=nl" +
        "&status=Available" +
        "&limit=500" +
        //"&q=address.nl.addressLocality:Antwerpen" + // can filter on province or postalcode
        (postalCode ? "&postalCode=" + postalCode : ""),
      {
        method: "GET",
        headers: {
          "X-Client-Id": process.env.UIT_CLIENT_ID,
        },
      }
    );
    // return;
    const encodedEvents = await events.json();
    console.log(encodedEvents);
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
    try {
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
      if (exists) continue;

      // Step 5: Insert activity
      const [activityInsertResult] = await db("activity")
        .insert(transformedEvent)
        .returning("activityId");
      const activityId =
        activityInsertResult.activityId ?? activityInsertResult;

      // Step 6: Link activity to all its categories
      const links = categoryIds.map((categoryId) => ({
        activityId: activityId,
        activityCategoryId: categoryId,
      }));
      console.log(categoryIds);
      await db("activity_activity_category").insert(links);
    } catch (error) {
      console.warn("Failed to insert activity for:", JSON.stringify(event));
    }
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

    // debug
    debugUITId: event["@id"],
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

function mapActivityToPillarCategories(uitActivity) {
  const termLabels = uitActivity.terms
    .filter((t) => ["eventtype", "theme"].includes(t.domain))
    .map((t) => t.label.toLowerCase().trim());
  const text = `${uitActivity.title} ${uitActivity.description}`
    .toLowerCase()
    .trim()
    .split(" ");

  const matches = new Set();

  for (const mapping of CATEGORY_MAPPINGS) {
    for (const keyword of mapping.labels) {
      // Match in term labels or full text
      if (
        termLabels.some((label) => label.includes(keyword)) ||
        text.some((word) => word.includes(keyword))
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

const CATEGORY_MAPPINGS = [
  // ------------------------
  // 🧘‍♂️ Mindfulness
  // ------------------------

  {
    labels: [
      "meditatie",
      "mindfulness",
      "zen",
      "stiltewandeling",
      "stilte",
      "innerlijke rust",
      "ontspanning",
      "ademhaling",
      "stressreductie",
      "healing",
      "inner peace",
      "contemplatie",
    ],
    pillar: "Mindfulness",
    category: "Meditation",
  },
  {
    labels: [
      "dankbaarheid",
      "zingeving",
      "spiritualiteit",
      "zelfzorg",
      "persoonlijke groei",
      "persoonlijke ontwikkeling",
      "innerlijke groei",
      "bewustwording",
      "levensvragen",
    ],
    pillar: "Mindfulness",
    category: "Meaning & Self-awareness",
  },
  {
    labels: [
      "religie",
      "kerk",
      "viering",
      "gebed",
      "geloof",
      "bijbel",
      "spiritueel",
      "trouw",
      "doop",
      "mis",
      "boeddhisme",
      "moskee",
      "klooster",
      "interlevensbeschouwelijk",
    ],
    pillar: "Mindfulness",
    category: "Religious/Spiritual Gathering",
  },
  {
    labels: [
      "gezondheid",
      "wellness",
      "ontspanning",
      "massages",
      "spa",
      "therapie",
      "therapeutisch",
      "natuurgeneeskunde",
      "holistisch",
      "balans",
      "mind-body",
      "alternatieve geneeskunde",
    ],
    pillar: "Mindfulness",
    category: "Wellness",
  },

  // ------------------------
  // 🏃 Physical
  // ------------------------

  {
    labels: [
      "sport",
      "sportdag",
      "workout",
      "training",
      "fit",
      "fitheid",
      "fitness",
      "hardlopen",
      "lopen",
      "wandelen",
      "trail",
      "tocht",
      "running",
      "spinning",
      "bootcamp",
      "lopen",
      "bodyweight",
      "krachttraining",
      "cardio",
    ],
    pillar: "Physical",
    category: "Exercise",
  },
  {
    labels: [
      "yoga",
      "qi gong",
      "tai chi",
      "stretching",
      "pilates",
      "body & mind",
      "slow movement",
      "lichte beweging",
      "balansoefeningen",
      "rustige sport",
      "ademhalingsoefeningen",
    ],
    pillar: "Physical",
    category: "Low Impact",
  },
  {
    labels: [
      "dans",
      "zumba",
      "salsa",
      "hiphop",
      "klassiek ballet",
      "dansles",
      "modern",
      "movement",
      "improvisatiedans",
      "choreografie",
    ],
    pillar: "Physical",
    category: "Dance",
  },
  {
    labels: [
      "natuurwandeling",
      "bosbad",
      "natuurbeleving",
      "outdoor",
      "buitensport",
      "klimmen",
      "survival",
      "kajakken",
      "fietstocht",
      "mountainbike",
      "buitenactiviteit",
      "avontuur",
    ],
    pillar: "Physical",
    category: "Nature & Adventure",
  },

  // ------------------------
  // 🎨 Skills
  // ------------------------

  {
    labels: [
      "cursus",
      "opleiding",
      "workshop",
      "training",
      "vaardigheden",
      "vaardigheid",
      "les",
      "bijscholing",
      "leertraject",
      "atelier",
      "vaardigheidstraining",
      "illustratie",
      "tekenen",
      "schilderen",
      "fotografie",
      "creatief",
      "beeldende kunst",
      "handwerk",
      "ambacht",
      "kunst",
      "grafisch",
      "design",
      "keramiek",
      "boetseren",
      "drama",
      "muziekles",
      "gitaarles",
      "zingen",
      "koor",
      "instrument",
      "muziekschool",
      "muziekatelier",
    ],
    pillar: "Skills",
    category: "Workshop",
  },
  {
    labels: [
      "lezing",
      "congres",
      "seminarie",
      "voordracht",
      "college",
      "talk",
      "presentatie",
      "infosessie",
    ],
    pillar: "Skills",
    category: "Lecture",
  },
  {
    labels: [
      "tarot",
      "astrologie",
      "pendelen",
      "energie",
      "reiki",
      "orakel",
      "reading",
      "spiritueel",
      "chakra",
      "ziel",
      "spirituele ontwikkeling",
    ],
    pillar: "Skills",
    category: "Spiritual Course",
  },
  {
    labels: [
      "taal",
      "talen",
      "frans",
      "engels",
      "duits",
      "nt2",
      "taalcursus",
      "taalinitiatie",
    ],
    pillar: "Skills",
    category: "Language Course",
  },
  {
    labels: [
      "digitaal",
      "technologie",
      "computer",
      "it",
      "ai",
      "robotica",
      "webdesign",
      "digitale vaardigheden",
    ],
    pillar: "Skills",
    category: "Digital Skills",
  },

  // ------------------------
  // 🧑‍🤝‍🧑 Social
  // ------------------------

  {
    labels: [
      "bijeenkomst",
      "samenkomst",
      "netwerken",
      "groepsactiviteit",
      "ontmoeting",
      "groepsbijeenkomst",
      "inloop",
      "thema-avond",
      "koffiemoment",
      "sociale activiteit",
    ],
    pillar: "Social",
    category: "Group Activity",
  },
  {
    labels: [
      "kinderen",
      "jongeren",
      "familie",
      "ouder-kind",
      "gezinsactiviteit",
      "peuters",
      "babies",
      "kinderworkshop",
      "jeugd",
      "tieners",
      "gezinsvriendelijk",
      "vakantieactiviteit",
    ],
    pillar: "Social",
    category: "Family/Youth",
  },
  {
    labels: [
      "kamp",
      "vakantie",
      "kampweek",
      "zomerkamp",
      "speelplein",
      "jeugdkamp",
      "midweek",
      "retreat",
    ],
    pillar: "Social",
    category: "Camp or Retreat",
  },
  {
    labels: [
      "buurt",
      "wijk",
      "lokaal",
      "sociaal",
      "gemeente",
      "dorpsfeest",
      "buurtactiviteit",
      "burgerinitiatief",
      "participatie",
      "samenleven",
      "wijkwerking",
    ],
    pillar: "Social",
    category: "Community",
  },
];
