import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { getDistanceFromLatLonInKm } from "../../../utils/distanceHelper.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";
// @ts-ignore
import { getActivitiesCore } from "./activity.controller.js";

export const insertSuggestedActivityItems = async (
  req,
  promptInfo,
  suggestions
) => {
  try {
    const [newSuggestedActivityGroup] = await db("suggested_activity_group")
      .insert({
        userId: req.user.userId,

        basedOnCheckinId: promptInfo.checkinId,
        amountActivitiesConsidered: promptInfo.consideredActivities,
        model: promptInfo.model,
      })
      .returning("*");
    console.log(suggestions);
    await db("suggested_activity").insert(
      suggestions.map((s) => ({
        suggestedActivityGroupId:
          newSuggestedActivityGroup.suggestedActivityGroupId,
        activityId: s.activityId,
        confidence: s.confidence,
        reasoning: s.reasoning?.trim(450),
        dismissedAt: null,
        overwriteEnergyRequired: s.yourEstimatedRequiredEnergyLevel,
        overwriteIsGroupActivity: s.yourIsPossibleInGroupIdea ? true : false,
      }))
    );

    return {
      error: null,
      suggestedActivityGroupId:
        newSuggestedActivityGroup.suggestedActivityGroupId,
    };
  } catch (error) {
    return {
      error: error,
      suggestedActivityGroupId: null,
    };
  }
};

export const GetActivitySuggestionsWithDetails = asyncHandler(
  async (req, res) => {
    const { activitySuggestionGroupId } = req.query;

    try {
      const results = await GetActivitySuggestionsWithDetailsCore(
        req,
        activitySuggestionGroupId
      );

      return sendSuccess(res, {
        statusCode: 200,
        message: `successfully retrieved activity suggestions for activitySuggestionGroupId: ${results[0]?.activitySuggestionGroupId}`,
        data: results,
      });
    } catch (error) {
      return sendError(res, {
        statusCode: 500,
        message: `failed to retrieve activity suggestions, error: ${error}`,
      });
    }
  }
);

export const GetActivitySuggestionsWithDetailsCore = async (
  req,
  activitySuggestionGroupId
) => {
  if (!req.query.lon || !req.query.lat) {
    return sendError(req, {
      statusCode: 503,
      message: "long,lat missing",
    });
  }
  // start from the sug act group and only get ones this user is allowed to see
  let query = db("suggested_activity_group as sag").where(
    "sag.userId",
    req.user.userId
  );

  // if asking for a specific one get it else get the latest
  if (activitySuggestionGroupId) {
    query = query.where(
      "sag.suggestedActivityGroupId",
      activitySuggestionGroupId
    );
  } else {
    query = query.orderBy("sag.created_at", "desc");
  }
  const suggestedActivityGroup = await query.first("*"); // only get one

  // get the activity suggestions related to the group
  const activitySuggestionList = await db("suggested_activity as sa")
    .where(
      "suggestedActivityGroupId",
      suggestedActivityGroup.suggestedActivityGroupId
    )
    .select("*");

  // get acivities
  const activitySuggestionListWithActivities = [];
  for (const activitySuggestion of activitySuggestionList) {
    const activity = await db("activity as a")
      .where("a.activityId", activitySuggestion.activityId)
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
      .groupBy("a.activityId")
      .select([
        "a.*",
        db.raw(`
            json_agg(
                json_build_object(
                'activityCategoryId', aac."activityCategoryId",
                'name', ac."name",
                'pillar', ap."name"
                )
            ) as categories
        `),
      ])
      .first();
    if (activity) {
      activitySuggestionListWithActivities.push({
        ...activitySuggestion,
        activity: {
          ...activity,
          // @ts-ignore
          distance: activity.locationLatitude
            ? Math.floor(
                getDistanceFromLatLonInKm(
                  req.query.lat,
                  req.query.lon,
                  // @ts-ignore
                  activity.locationLatitude,
                  // @ts-ignore
                  activity.locationLongitude
                )
              )
            : null,
        },
      });
    }
  }

  return activitySuggestionListWithActivities;
};
