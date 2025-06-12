import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { getDistanceFromLatLonInKm } from "../../../utils/distanceHelper.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";
// @ts-ignore
import { getActivitiesCore } from "./activity.controller.js";
import { getAIRequestUsageForToday } from "./aiRequestUsage.controller.js";
import { getCheckinById, getLastValidCheckin } from "./checkin.controller.js";
import { getUserActiveSubscription } from "./subscription.controller.js";

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
      if (results.error) {
        return sendError(res, {
          statusCode: results.error.statusCode,
          message: results.error.message,
        });
      }

      return sendSuccess(res, {
        statusCode: 200,
        message: `successfully retrieved activity suggestions for activitySuggestionGroupId: ${results.data[0]?.activitySuggestionGroupId}`,
        data: results.data,
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
    return {
      error: { statusCode: 503, message: "long,lat missing" },
      data: null,
    };
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

  if (!suggestedActivityGroup) {
    return {
      error: {
        statusCode: 404,
        message: `Failed to find group of suggested activities ${
          activitySuggestionGroupId
            ? "with provided id: " + activitySuggestionGroupId
            : ""
        }`,
      },
      data: null,
    };
  }

  // get the activity suggestions related to the group
  const activitySuggestionList = await db("suggested_activity as sa")
    .where(
      "suggestedActivityGroupId",
      suggestedActivityGroup.suggestedActivityGroupId
    )
    .select("*");

  const basedOnCheckin = await getCheckinById(
    suggestedActivityGroup.basedOnCheckinId
  );
  if (basedOnCheckin.error) {
    return {
      error: {
        statusCode: 500,
        message: `Failed to find based on checkin!, error: ${basedOnCheckin.error.message}`,
      },
      data: null,
    };
  }

  const subscription = await getUserActiveSubscription(req);
  const usage = await getAIRequestUsageForToday(req);
  if (subscription.error || usage.error) {
    return {
      error: {
        statusCode: 500,
        message: `Failed to get users subscription or quota! error: ${subscription.error.message} ${usage.error.message}`,
      },
      data: null,
    };
  }

  // get acivities
  const activitySuggestionListWithActivities = [];
  let count = 1;
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
        isPremiumLocked: count > subscription.data.maxAIResultsShown,
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
    count = count + 1;
  }

  return {
    error: null,
    data: {
      basedOnCheckin: basedOnCheckin.data,
      subscriptionStatus: {
        usage: parseInt(usage.data.count),
        subscription: subscription.data,
      },
      activitySuggestionList: activitySuggestionListWithActivities,
    },
  };
};
