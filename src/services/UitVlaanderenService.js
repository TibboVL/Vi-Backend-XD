import dotenv from "dotenv";
import "../types/types.js"; // Import type definitions
import db from "../db/index.js";
import { DateTime } from "luxon";
import { mapActivityToPillarCategories } from "./mapToCategoryHelper.js";
import { stripAll } from "../utils/textUtils.js";
import cliProgress from "cli-progress";

// const UitSearchAPIURI = "https://search-test.uitdatabank.be";
const UitSearchAPIURI = "https://search-test.uitdatabank.be";

/**
 * @typedef {Object} Filters
 * @property {string} [postalCode]
 * @property {number} [limit]
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
  const limit = filters.limit ?? 100;
  console.log(`ℹ️  Getting UITVlaanderen API entries, Limit: ${limit}`);
  dotenv.config();
  //console.log("Client ID:", process.env.UIT_CLIENT_ID);

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
    // `address.nl.addressLocality:Antwerpen AND ${dateRangeQuery}`
    `${dateRangeQuery}`
  );

  //console.log(dateRangeQuery);

  // return;
  try {
    const events = await fetch(
      UitSearchAPIURI +
        "/events" +
        `?q=${q}` +
        "&bookingAvailability=Available" +
        "&languages[]=nl" +
        "&status=Available" +
        `&limit=${limit}` +
        "&regions=nis-10000" +
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

    console.log(`Found: ${encodedEvents.totalItems} items`);

    const decodedEvents = await handleEventListDecode(encodedEvents.member);
    await handleInsertToDB(decodedEvents);

    return decodedEvents;
  } catch (error) {
    console.error(error);
  }

  // console.log(events.body);
};

const handleInsertToDB = async (decodedEvents) => {
  const pillars = await db("activity_pillar").select("*");

  for (const event of decodedEvents) {
    try {
      const transformedEvent = transformUitEvent(event);
      const categories = transformedEvent.categories;

      if (!Array.isArray(categories) || categories.length === 0) {
        console.warn(`Activity: "${transformedEvent.name}" has no categories`);
        // console.log(
        //   JSON.parse(transformedEvent.tags).filter((tag) =>
        //     ["eventtype", "theme"].includes(tag.domain)
        //   )
        // );
        continue;
      }

      // Step 1: Prepare list of category IDs
      const categoryIds = [];
      for (const cat of categories) {
        const pillar = pillars.find(
          (pillar) => pillar.name.toLowerCase() == cat.pillar.toLowerCase()
        );

        // Check if category exists
        let categoryId = await db("activity_category")
          .where("name", cat.category)
          .where("activityPillarId", pillar?.pillarId) // !! only check on name ?! may need to change in the future
          .first()
          .then((res) => {
            //console.log(res);
            return res?.activityCategoryId;
          });

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
      //console.log(categoryIds);
      await db("activity_activity_category").insert(links);
    } catch (error) {
      console.warn(
        "Failed to insert activity for:",
        JSON.stringify(event),
        error
      );
    }
  }
};

const handleEventListDecode = async (eventList) => {
  /** @type {import('../types/types.js').Event[]} */
  const decodedEventsList = [];

  // Setup CLI progress bar
  const bar = new cliProgress.SingleBar({
    format: "Decoding Events [{bar}] {percentage}% | {value}/{total} events",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });

  bar.start(eventList.length, 0);

  for (const event of eventList) {
    // console.log(event);
    // console.log(event["@id"]);
    const response = await fetch(event["@id"], {
      method: "GET",
      headers: {
        "X-Client-Id": process.env.UIT_CLIENT_ID,
      },
    });
    const decodedEvent = await response.json();
    decodedEventsList.push(decodedEvent);
    bar.increment();
  }
  return decodedEventsList;
};
export function transformUitEvent(event) {
  const minAgeRegex = new RegExp("^(\\d+)");
  const maxAgeRegex = new RegExp("(\\d+)$");

  const minAge = minAgeRegex.exec(event.typicalAgeRange);
  const maxAge = maxAgeRegex.exec(event.typicalAgeRange);
  return {
    // Core fields
    name: stripAll(event.name.nl.trim()),
    description: stripAll(event?.description?.nl?.substring(0, 1000)),
    source: "UITVlaanderen",

    // Categories (event type + theme terms)
    categories: mapActivityToPillarCategories(event),

    // Duration calculation (handles subEvents)
    estimatedDurationMinutes: calculateTotalDuration(event),

    // Energy placeholder (see options below)
    energyRequired: "low", // Temporary value

    // Location data
    locationName: event.location?.name?.nl,
    locationCountry: event.location?.address?.nl?.addressCountry,
    locationCity: event.location?.address?.nl?.addressLocality,
    locationPostcode: event.location?.address?.nl?.postalCode,
    locationStreetAddress: event.location?.address?.nl?.streetAddress,
    locationLatitude: event.location?.geo?.latitude,
    locationLongitude: event.location?.geo?.longitude,

    // dates
    startDate: event.startDate,
    endDate: event.endDate,
    openingHoursStructured: JSON.stringify(parseOpeningHours(event)),

    // Price info
    currency: getCurrency(event.priceInfo),
    estimatedCost: getPrice(event.priceInfo),

    // Group activity detection
    isGroupActivity: detectGroupActivity(event.terms),

    // Age range
    minAge: minAge ? minAge[0] : null,
    maxAge: maxAge ? maxAge[0] : null,

    // Contact
    contactEmails: JSON.stringify(event.contactPoint?.email),
    contactPhones: JSON.stringify(event.contactPoint?.phone),
    contactURLs: JSON.stringify(event.contactPoint?.url),

    // debug
    debugUITId: event["@id"],
    tags: JSON.stringify(event.terms),
  };
}

function parseOpeningHours(event) {
  if (event.location.openingHours && event.location.openingHours.length > 0) {
    const openingHours = event.location.openingHours;
    const structuredHours = [];
    openingHours.map((hoursBlock) => {
      hoursBlock.dayOfWeek?.map((day) => {
        const existingEntryForDay = structuredHours.find(
          (weekdayHours) => weekdayHours.weekday == day
        );
        if (existingEntryForDay) {
          existingEntryForDay.intervals.push({
            opens: hoursBlock.opens,
            closes: hoursBlock.closes,
          });
        } else {
          structuredHours.push({
            weekday: day,
            intervals: [
              {
                opens: hoursBlock.opens,
                closes: hoursBlock.closes,
              },
            ],
          });
        }
      });
    });

    return structuredHours;
  }
  return [];
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
  const groupIndicators = ["workshop", "les", "opleiding", "groep"];
  return (terms || []).some((term) =>
    groupIndicators.some((indicator) =>
      term.label.toLowerCase().includes(indicator)
    )
  );
}
