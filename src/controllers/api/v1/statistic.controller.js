import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { getUTCDateOnly } from "../../../utils/dateHekoer.js";
import { sendSuccess } from "../../../utils/responses.js";

export const getPerPillarStatistics = asyncHandler(async (req, res) => {
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
