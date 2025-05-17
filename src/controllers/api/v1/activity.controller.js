import db from "../../../db/index.js";
import { getUitEventDecodedList } from "../../../services/UitVlaanderenService.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";

// temporary
export const getActivities = asyncHandler(async (req, res) => {
  const activities = await db("activity as a")
    .leftJoin(
      "activity_activity_category as ac",
      "a.activityId",
      "ac.activityId"
    )
    .leftJoin(
      "activity_category as c",
      "ac.activityCategoryId",
      "c.activityCategoryId"
    )
    .leftJoin("activity_pillar as p", "c.activityPillarId", "p.pillarId")
    /*  .select("*");  */ .select(
      "a.activityId",
      "a.name",
      "a.energyRequired",
      "a.estimatedDurationMinutes",
      "a.currency",
      "a.estimatedCost",
      "a.isGroupActivity",
      "c.name as category",
      "p.name as pillar"
    );

  setTimeout(() => {
    sendSuccess(res, {
      statusCode: 200,
      message: "Activity list retrieved successfully",
      data: activities,
    });
  }, 1000);
});
/* 
export const getActivityDetails = asyncHandler(async (req, res) => {
  const { activityId } = req.body;
  console.log(activityId);

  if (activityId) {
    const activity = await knex("activity").where("activityId");
  }

  console.log(events);

  sendSuccess(res, {
    statusCode: 200,
    message: "UitVlaanderen Events Retrieved",
    data: events,
  });
});
 */
