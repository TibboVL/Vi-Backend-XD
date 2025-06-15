import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { getUTCDateOnly } from "../../../utils/dateHekoer.js";
import { sendSuccess } from "../../../utils/responses.js";

export const getPillarsOvertimeStatistics = asyncHandler(async (req, res) => {
  const now = new Date();
  const day = now.getUTCDay() || 7; // Sunday as 7 for Monday-start weeks

  let start = getUTCDateOnly(now, -(day - 1)); // Monday
  let end = getUTCDateOnly(now, 7 - day); // Sunday

  if (req.query?.startDate && req.query?.endDate) {
    start = req.query.startDate;
    end = req.query.endDate;
  }
  console.log(start, end);

  //return;
  const statistics = await db("user_activity_list as ual")
    .where("ual.userId", req.user.userId)
    //.whereNotNull("ual.checkinId")
    .whereBetween("ual.plannedStart", [start, end])
    .leftJoin("activity as a", "ual.activityId", "a.activityId")
    .leftJoin(
      "activity_activity_category as aac",
      "a.activityId",
      "aac.activityId"
    )
    .leftJoin(
      "activity_category as ac",
      "aac.activityCategoryId",
      "ac.activityCategoryId"
    )
    .leftJoin("activity_pillar as ap", "ac.activityPillarId", "ap.pillarId")
    .distinctOn("ual.userActivityId")
    .select(
      "a.activityId",
      "ual.plannedStart",
      "ual.plannedEnd",
      "ap.pillarId",
      "ap.name",
      db.raw(
        'EXTRACT(EPOCH FROM (ual."plannedEnd" - ual."plannedStart"))  AS durationSeconds'
      ),
      db.raw('DATE(ual."plannedStart") AS date')
    );

  let pillarTotals = {};
  for (const stat of statistics) {
    console.log(typeof stat.durationseconds);
    if (pillarTotals[stat.name]) {
      pillarTotals[stat.name] =
        parseFloat(pillarTotals[stat.name]) + parseFloat(stat.durationseconds);
    } else {
      pillarTotals[stat.name] = parseFloat(stat.durationseconds);
    }
  }

  const pillarTotalMins = {};
  for (const [key, value] of Object.entries(pillarTotals)) {
    pillarTotalMins[key] = value / 60;
  }

  sendSuccess(res, {
    statusCode: 200,
    message: `Statistics for period: ${start} to ${end} retrieved`,
    meta: {
      itemCount: statistics.length,
    },
    data: {
      start: start,
      end: end,
      pillarStats: pillarTotalMins,
      statistics: statistics,
    },
  });
});
export const getEnergyOvertimeStatistics = asyncHandler(async (req, res) => {
  const now = new Date();
  const day = now.getUTCDay() || 7; // Sunday as 7 for Monday-start weeks

  let start = getUTCDateOnly(now, -(day - 1)); // Monday
  let end = getUTCDateOnly(now, 7 - day); // Sunday

  if (req.query?.startDate && req.query?.endDate) {
    start = req.query.startDate;
    end = req.query.endDate;
  }
  console.log(start, end);

  //return;
  const statistics = await db("checkin as c")
    .where("c.userId", req.user.userId)
    .leftJoin("user_activity_list as ual", "ual.checkinId", "c.checkinId")
    .whereBetween("ual.plannedStart", [start, end])
    .orWhereNull("ual.plannedStart")
    .distinctOn("ual.userActivityId")
    .select(
      "ual.plannedStart",
      "ual.plannedEnd",
      "c.beforeEnergyLevel",
      "c.afterEnergyLevel",
      "c.created_at",
      db.raw(`
      CASE 
        WHEN ual."plannedStart" IS NOT NULL 
        THEN DATE(ual."plannedStart") 
        ELSE DATE(c."created_at") 
      END AS date
    `)
    );

  const statisticsArray = [];
  for (let stat of statistics) {
    statisticsArray.push({
      energy: stat.beforeEnergyLevel,
      date: stat.plannedEnd ?? stat.created_at,
    });
    if (!stat.afterEnergyLevel) continue; // skip the second half of freestanding entries that only have a before
    statisticsArray.push({
      energy: stat.afterEnergyLevel,
      date: stat.plannedEnd ?? stat.created_at,
    });
  }
  statisticsArray.sort((a, b) => a.date - b.date);

  /*   statistics.map((item) => (
    {
      energy: item.beforeEnergyLevel,
      date: item.plannedEnd ?? item.created_at,
    },
    {
      energy: item.afterEnergyLevel,
      date: item.plannedEnd ?? item.created_at,
    },
  )); */

  sendSuccess(res, {
    statusCode: 200,
    message: `Energy statistics for period: ${start} to ${end} retrieved`,
    meta: {
      itemCount: statisticsArray.length,
    },
    data: {
      start: start,
      end: end,
      statistics: statisticsArray,
    },
  });
});

export const getPerActivityStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const day = now.getUTCDay() || 7; // Sunday as 7 for Monday-start weeks

  let start = getUTCDateOnly(now, -(day - 1)); // Monday
  let end = getUTCDateOnly(now, 7 - day); // Sunday

  if (req.query?.startDate && req.query?.endDate) {
    start = req.query.startDate;
    end = req.query.endDate;
  }
  console.log(start, end);

  // 1) get all of the valid reviewed activities within the asked for range
  const amountOfEntries = await db("user_activity_list as ual")
    .leftJoin("checkin as c", "ual.checkinId", "c.checkinId")
    .whereNotNull("c.checkinId") // only reviewed and thus completed plans
    .where("ual.userId", req.user.userId) // only from this user
    .whereBetween("ual.plannedStart", [start, end]) // within the given time range
    .leftJoin("activity as a", "ual.activityId", "a.activityId")
    .leftJoin("mood as mb", "c.beforeMoodId", "mb.moodId")
    .leftJoin("mood as ma", "c.afterMoodId", "ma.moodId")
    .select([
      "a.activityId",
      "a.name as activityTitle",
      db.raw(`json_agg(
        json_build_object(
        'checkin', c.*,
        'moodBefore', mb.*,
        'moodAfter', ma.*
        )
        ) as checkins`), // Group checkins
      // Categories Subquery
      db.raw(`
      (
        SELECT json_agg(
          json_build_object(
            'activityCategoryId', ac."activityCategoryId",
            'name', ac."name",
            'pillar', ap."name"
          )
        )
        FROM activity_activity_category aac
        LEFT JOIN activity_category ac ON aac."activityCategoryId" = ac."activityCategoryId"
        LEFT JOIN activity_pillar ap ON ac."activityPillarId" = ap."pillarId"
        WHERE aac."activityId" = a."activityId"
      ) as categories
    `),
    ])
    .groupBy("a.activityId");

  // 2) merge
  const calculatedEntries = amountOfEntries.map((entry) => {
    // @ts-ignore
    const perCheckinDeltas = entry.checkins.map((checkin) => {
      const deltaAlertness =
        checkin.moodAfter.alertness - checkin.moodBefore.alertness;
      const deltaEnjoyment =
        checkin.moodAfter.enjoyment - checkin.moodBefore.enjoyment;
      const deltaEnergy =
        checkin.checkin.afterEnergyLevel - checkin.checkin.beforeEnergyLevel;
      return {
        deltaAlertness,
        deltaEnjoyment,
        deltaEnergy,
      };
    });

    const averageDeltas =
      perCheckinDeltas.length > 0
        ? {
            deltaAlertness:
              perCheckinDeltas.reduce((sum, d) => sum + d.deltaAlertness, 0) /
              perCheckinDeltas.length,
            deltaEnjoyment:
              perCheckinDeltas.reduce((sum, d) => sum + d.deltaEnjoyment, 0) /
              perCheckinDeltas.length, // these are -2 to 2 units
            deltaEnergy:
              perCheckinDeltas.reduce((sum, d) => sum + d.deltaEnergy, 0) /
              perCheckinDeltas.length, // this is a -100 - 100 unit
            normalizedDeltaEnergy:
              perCheckinDeltas.reduce((sum, d) => sum + d.deltaEnergy, 0) /
              perCheckinDeltas.length /
              50, // this brings it back to a -2 to 2 range
            combinedDeltaMood:
              (perCheckinDeltas.reduce((sum, d) => sum + d.deltaEnjoyment, 0) /
                perCheckinDeltas.length) *
                0.6 +
              (perCheckinDeltas.reduce((sum, d) => sum + d.deltaAlertness, 0) /
                perCheckinDeltas.length) *
                0.4,
          }
        : {
            deltaAlertness: 0,
            deltaEnjoyment: 0,
            deltaEnergy: 0,
            normalizedDeltaEnergy: 0,
            combinedDeltaMood: 0,
          };

    return {
      // @ts-ignore
      activityId: entry.activityId,
      // @ts-ignore
      activityTitle: entry.activityTitle,
      // @ts-ignore
      categories: entry.categories,
      // @ts-ignore
      averageDeltas: averageDeltas,
      basedOnCheckinAmount: perCheckinDeltas.length,
    };
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: "Successfully gathered per activity statistics",
    data: calculatedEntries,
  });
});
