import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";

export const addCheckin = asyncHandler(async (req, res) => {
  console.log(`ℹ️  Adding checkin for user: ${req.user.email}`);

  const {
    beforeMoodId,
    afterMoodId,
    beforeEnergy,
    afterEnergy,
    userActivityId,
  } = req.query;

  if (
    !beforeMoodId ||
    !afterMoodId ||
    !beforeEnergy ||
    !afterEnergy ||
    !userActivityId
  ) {
    return sendError(res, {
      statusCode: 400,
      message: `Request is missing parameters!`,
    });
  }
  if (
    beforeEnergy < 0 ||
    beforeEnergy > 100 ||
    afterEnergy < 0 ||
    afterEnergy > 100
  ) {
    return sendError(res, {
      statusCode: 400,
      message: `Energy level outside of expected range!`,
    });
  }

  // check if there is indeed a user activity list entry for this user with the given id
  const userActivityListEntry = await db("user_activity_list")
    .where("userId", req.user.userId)
    .where("userActivityId", userActivityId)
    .first();

  if (!userActivityListEntry) {
    return sendError(res, {
      statusCode: 400,
      message: `No userActivityList entry with id: ${userActivityId} found for this user!`,
    });
  }

  try {
    const [checkin] = await db("checkin")
      .insert({
        userId: req.user.userId,
        beforeMoodId: beforeMoodId,
        afterMoodId: afterMoodId,
        beforeEnergyLevel: beforeEnergy,
        afterEnergyLevel: afterEnergy,
        userActivityId: userActivityId,
      })
      .returning("*");
    return sendSuccess(res, {
      statusCode: 201,
      message: `Successfully created checkin entry`,
      data: checkin,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: `Failed to insert checkin item - error: ${error}`,
    });
  }
});
