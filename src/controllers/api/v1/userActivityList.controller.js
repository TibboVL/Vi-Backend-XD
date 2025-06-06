import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";

export const getUserActivityList = asyncHandler(async (req, res) => {
  const userActivityListId = req.params.userActivityListId;
  try {
    let query = db("user_activity_list as ual").where(
      "ual.userId",
      req.user.userId
    );
    if (userActivityListId) {
      query = query.where("ual.userActivityId", userActivityListId);
    }
    const userActivityLists = await query
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
      .groupBy("ual.userActivityId", "a.activityId")
      .select([
        "ual.userActivityId",
        "ual.userId",
        "a.activityId",
        "ual.plannedStart",
        "ual.plannedEnd",
        "a.name as activityTitle",
        db.raw(`
            json_agg(
                json_build_object(
                'activityCategoryId', ac."activityCategoryId",
                'name', ac."name",
                'pillar', ap."name"
                )
            ) as categories
        `),
      ]);

    // group by date because frontend library expects it that way
    let groupedUserActivityLists = [];
    for (let item of userActivityLists) {
      //console.log(item.plannedStart);
      //console.log(item.plannedStart.toISOString());
      // @ts-ignore
      const newDate = item.plannedStart.toISOString().split("T")[0];

      const existingEntry = groupedUserActivityLists.find(
        (entry) => entry.title == newDate
      );
      //console.log(existingEntry);
      if (existingEntry) {
        const existingEntryIndex = groupedUserActivityLists.findIndex(
          (entry) => entry.title == newDate
        );
        groupedUserActivityLists = [
          ...groupedUserActivityLists.slice(0, existingEntryIndex),
          {
            title: existingEntry.title,
            data: [...existingEntry.data, item],
          },
          ...groupedUserActivityLists.slice(existingEntryIndex + 1),
        ];
      } else {
        groupedUserActivityLists.push({
          title: newDate,
          data: [item],
        });
      }
      // also make sure to order within the day
      const newEntry = groupedUserActivityLists.find(
        (entry) => entry.title == newDate
      );
      newEntry.data.sort(
        // @ts-ignore
        (a, b) => new Date(a.plannedStart) - new Date(b.plannedStart)
      );
    }
    groupedUserActivityLists = groupedUserActivityLists.sort(
      // @ts-ignore
      (a, b) => new Date(a.title) - new Date(b.title)
    );
    //console.log(groupedUserActivityLists);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Successfully fetched user activity list entry item(s)",
      data: groupedUserActivityLists,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: `Failed to get user activity list entries - error: ${error}`,
    });
  }
});
export const getUserActivityListItemsToBeReviewed = asyncHandler(
  async (req, res) => {
    try {
      let query = db("user_activity_list as ual")
        .where("ual.userId", req.user.userId)
        .where("ual.plannedEnd", "<", new Date())
        .whereNull("ual.markedCompletedAt");

      const userActivityLists = await query
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
        .groupBy("ual.userActivityId", "a.activityId")
        .select([
          "ual.userActivityId",
          "ual.userId",
          "ual.plannedStart",
          "ual.plannedEnd",
          "ual.markedCompletedAt",
          "a.activityId",
          "a.name as activityTitle",
          db.raw(`
            json_agg(
                json_build_object(
                'activityCategoryId', ac."activityCategoryId",
                'name', ac."name",
                'pillar', ap."name"
                )
            ) as categories
        `),
        ]);

      return sendSuccess(res, {
        statusCode: 200,
        meta: {
          itemCount: userActivityLists.length,
        },
        message: "Successfully fetched user activity list entry items",
        data: userActivityLists,
      });
    } catch (error) {
      return sendError(res, {
        statusCode: 500,
        message: `Failed to get user activity list entries - error: ${error}`,
      });
    }
  }
);
export const addActivityToUserList = asyncHandler(async (req, res) => {
  if (
    !req.body?.activityId ||
    !req.body?.plannedStart ||
    !req.body?.plannedEnd
  ) {
    return sendError(res, {
      statusCode: 500,
      message: "Request is missing parameters!",
    });
  }
  const { activityId, plannedStart, plannedEnd } = req.body;

  // check if activity exists
  const activity = await db("activity").where("activityId", activityId).first();

  if (!activity) {
    return sendError(res, {
      statusCode: 404,
      message: `No activity with Id: ${activityId}!`,
    });
  }

  try {
    const [result] = await db("user_activity_list")
      .insert({
        userId: req.user.userId,
        activityId: activityId,
        suggestedActivityId: req.body.suggestedActivityId ?? null,
        plannedStart: plannedStart,
        plannedEnd: plannedEnd,
      })
      .returning("*");
    sendSuccess(res, {
      statusCode: 200,
      message: "Successfully created user activity list entry",
      data: result,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: `Failed to create user activity list entry - error: ${error}`,
    });
  }
});
export const updateActivityToUserList = asyncHandler(async (req, res) => {
  const {
    userActivityListId,
    plannedStart,
    plannedEnd,
    markedCompletedAt,
    checkinId,
  } = req.query;

  if (!userActivityListId) {
    return sendError(res, {
      statusCode: 500,
      message: "Request is missing userActivityId!",
    });
  }

  // check if user activity list entry exists
  const userActivityList = await db("user_activity_list")
    .where("userActivityId", userActivityListId)
    .where("userId", req.user.userId)
    .first();

  if (!userActivityList) {
    return sendError(res, {
      statusCode: 404,
      message: `No user activity list with Id: ${userActivityListId}!`,
    });
  }

  const updates = {
    plannedStart: plannedStart ?? null,
    plannedEnd: plannedEnd ?? null,
    markedCompletedAt: markedCompletedAt ?? null,
    checkinId: checkinId ?? null,
  };

  try {
    const [result] = await db("user_activity_list")
      .where("userActivityId", userActivityListId)
      .update(
        Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value != null)
        )
      )
      .returning("*");
    sendSuccess(res, {
      statusCode: 200,
      message: "Successfully updated user activity list entry",
      data: result,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: `Failed to update user activity list entry - error: ${error}`,
    });
  }
});
