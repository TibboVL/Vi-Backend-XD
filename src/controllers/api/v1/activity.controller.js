import db from "../../../db/index.js";
import { getUitEventDecodedList } from "../../../services/UitVlaanderenService.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";

/**
 * @typedef {'low' | 'medium' | 'high' | 'very high'} Energy
 * @typedef {Object} ActivityFilters
 * @property {Energy[]} [energyLevel]
 * @property {boolean} [sharable]
 * @property {number[]} [categoryId]
 * @property {number} [maxPrice]
 * @property {number} [minAge]
 * @property {number} [duration]
 * @property {number} [distance]
 */

// temporary
export const getActivities = asyncHandler(async (req, res) => {
  const energyLevelParam = req.query.energyLevel;

  const energyLevel =
    typeof energyLevelParam === "string"
      ? [energyLevelParam]
      : Array.isArray(energyLevelParam)
      ? energyLevelParam.filter((r) =>
          ["low", "medium", "high", "very high"].includes(r)
        )
      : undefined;

  const categoryIdParam = req.query.categoryId;
  const categoryId =
    typeof categoryIdParam === "string"
      ? [categoryIdParam]
      : Array.isArray(categoryIdParam)
      ? categoryIdParam
      : undefined;

  /** @type {ActivityFilters} */
  const filters = {
    // @ts-ignore
    energyLevel: energyLevel,
    sharable:
      req.query.sharable === "true"
        ? true
        : req.query.sharable === "false"
        ? false
        : undefined,
    minAge: req.query.minAge ? parseInt(req.query.minAge, 10) : undefined,
    maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice, 10) : undefined,
    duration: undefined,
    distance: undefined,
    // @ts-ignore
    categoryId: categoryId,
  };

  let query = db("activity as a")
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
    .leftJoin("activity_pillar as p", "c.activityPillarId", "p.pillarId");

  if (filters.energyLevel) {
    query = query.whereIn("a.energyRequired", filters.energyLevel);
  }
  if (filters.sharable) {
    query = query.where("a.isGroupActivity", filters.sharable);
  }
  if (filters.minAge !== undefined && filters.minAge !== null) {
    query = query.where("a.minAge", ">=", filters.minAge);
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    query = query.where("a.estimatedCost", "<=", filters.maxPrice);
  }
  if (filters.categoryId) {
    query = query.whereIn("ac.activityCategoryId", filters.categoryId);
  }

  const rawActivities = await query.select(
    "a.activityId",
    "a.name",
    "a.energyRequired",
    "a.estimatedDurationMinutes",
    "a.currency",
    "a.estimatedCost",
    "a.isGroupActivity",
    "c.name as category",
    "p.name as pillar",
    "a.debugUITId",
    "a.locationLatitude",
    "a.locationLongitude"
  );

  // group categories in memory
  const grouped = {};

  for (const row of rawActivities) {
    if (!grouped[row.activityId]) {
      grouped[row.activityId] = {
        activityId: row.activityId,
        name: row.name,
        energyRequired: row.energyRequired,
        estimatedDurationMinutes: row.estimatedDurationMinutes,
        currency: row.currency,
        estimatedCost: row.estimatedCost,
        isGroupActivity: row.isGroupActivity,
        categories: [],
        debugUITId: row.debugUITId,
        lat: row.locationLatitude,
        lon: row.locationLongitude,
      };
    }

    if (row.category) {
      grouped[row.activityId].categories.push({
        name: row.category,
        pillar: row.pillar,
      });
    }
  }

  const activities = Object.values(grouped);

  console.log(activities.length);

  sendSuccess(res, {
    statusCode: 200,
    message: "Activity list retrieved successfully",
    data: activities,
  });
});

export const getActivityDetails = asyncHandler(async (req, res) => {
  if (req?.params?.activityId) {
    const activity = await db("activity")
      .where("activityId", req.params.activityId)
      .first();

    if (activity) {
      sendSuccess(res, {
        statusCode: 200,
        message: "UitVlaanderen Events Retrieved",
        data: activity,
      });
      return;
    }
    sendError(res, {
      statusCode: 404,
      message: `No event exists with id: ${req.params.activityId}`,
    });
    return;
  }
  sendError(res, {
    statusCode: 404,
    message: `No activityId provided`,
  });
});
