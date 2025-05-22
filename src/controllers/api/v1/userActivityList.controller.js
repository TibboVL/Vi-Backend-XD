import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";

export const addActivityToUserList = asyncHandler(async (req, res) => {
  const { activityId, plannedStart, plannedEnd } = req.query;

  if (!activityId || !plannedStart || !plannedEnd) {
    return sendError(res, {
      statusCode: 500,
      message: "Request is missing parameters!",
    });
  }

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

  if (!userActivityListId || !plannedStart || !plannedEnd) {
    return sendError(res, {
      statusCode: 500,
      message: "Request is missing parameters!",
    });
  }

  // check if user activity list entry exists
  const userActivityList = await db("user_activity_list")
    .where("userActivityId", userActivityListId)
    .first();

  if (!userActivityList) {
    return sendError(res, {
      statusCode: 404,
      message: `No user activity list with Id: ${userActivityListId}!`,
    });
  }

  try {
    const [result] = await db("user_activity_list")
      .where("userActivityId", userActivityListId)
      .update({
        plannedStart: plannedStart,
        plannedEnd: plannedEnd,
        markedCompletedAt: markedCompletedAt ?? null,
        checkinId: checkinId ?? null,
      })
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
