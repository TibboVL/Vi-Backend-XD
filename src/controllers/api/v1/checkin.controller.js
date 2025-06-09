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
  } = req.body;

  if (!beforeMoodId || !beforeEnergy) {
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

  // if this checkin is meant to be linked to an activity and thus not one of the freestanding checkins
  // check if there is indeed a user activity list entry for this user with the given id
  if (userActivityId) {
    if (!afterMoodId || !afterEnergy) {
      return sendError(res, {
        statusCode: 400,
        message: `Request is missing parameters!`,
      });
    }
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
  }
  console.log(req.body);
  try {
    const [checkin] = await db("checkin")
      .insert({
        userId: req.user.userId,
        beforeMoodId: beforeMoodId,
        afterMoodId: afterMoodId,
        beforeEnergyLevel: beforeEnergy,
        afterEnergyLevel: afterEnergy,
        userActivityId: userActivityId ?? null,
      })
      .returning("*");
    if (userActivityId) {
      const [userActivityListItem] = await db("user_activity_list")
        .where("userActivityId", userActivityId)
        .update({
          markedCompletedAt: new Date(),
          checkinId: checkin.checkinId,
        })
        .returning("*");
      return sendSuccess(res, {
        statusCode: 201,
        message: `Successfully created checkin entry and updated user activity list entry`,
        data: checkin,
      });
    } else {
      return sendSuccess(res, {
        statusCode: 201,
        message: `Successfully created checkin entry`,
        data: checkin,
      });
    }
  } catch (error) {
    return sendError(res, {
      statusCode: 400,
      message: `Failed to insert checkin item - error: ${error}`,
    });
  }
});

export const lastValidCheckinHelper = async (req) => {
  try {
    const latestNonFreestandingCheckin = await db("checkin as c")
      .leftJoin(
        "user_activity_list as ual",
        "ual.userActivityId",
        "c.userActivityId"
      )
      .leftJoin("mood as m", "m.moodId", "c.afterMoodId") // activity linked so after is closer to now
      .leftJoin("mood as pm", "pm.moodId", "m.parentMoodId") // freestanding so only before is filled in
      .where("c.userId", req.user.userId) // only checkins this user
      .whereNotNull("c.userActivityId") // only non freestanding activities
      .whereNotNull("ual.markedCompletedAt") // that attached to completed activities
      .orderBy("ual.plannedEnd", "desc") // ordered by their planned end date
      .first()
      .select([
        "c.checkinId",
        "c.afterMoodId as moodId", // activity linked so after is closer to now
        "c.afterEnergyLevel as energy", // activity linked so after is closer to now
        "m.label as mood",
        "m.parentMoodId",
        "pm.label as parentMood",
        "ual.plannedEnd as validAtDate",
      ]);
    const latestFreestandingCheckin = await db("checkin as c")
      .leftJoin("mood as m", "m.moodId", "c.beforeMoodId") // freestanding so only before is filled in
      .leftJoin("mood as pm", "pm.moodId", "m.parentMoodId") // freestanding so only before is filled in
      .where("c.userId", req.user.userId) // only checkins this user
      .whereNull("c.userActivityId") // only non freestanding activities
      .orderBy("c.created_at", "desc") // ordered by their planned end date
      .first()
      .select([
        "c.checkinId",
        "c.beforeMoodId as moodId", // freestanding so only before is filled in
        "c.beforeEnergyLevel as energy", // freestanding so only before is filled in
        "m.label as mood",
        "m.parentMoodId",
        "pm.label as parentMood",
        "c.created_at as validAtDate",
      ]);
    if (!latestFreestandingCheckin && !latestNonFreestandingCheckin) {
      return { error: null, data: null };
    } else {
      const latestCheckin =
        (latestNonFreestandingCheckin?.validAtDate ?? new Date(0)) >
        (latestFreestandingCheckin?.validAtDate ?? new Date(0))
          ? latestNonFreestandingCheckin
          : latestFreestandingCheckin;
      return { error: null, data: latestCheckin };
    }
  } catch (error) {
    console.error(error);
    return { error: error, data: null };
  }
};

export const getLastValidCheckin = asyncHandler(async (req, res) => {
  const checkin = await lastValidCheckinHelper(req);
  if (checkin.error) {
    return sendError(res, {
      statusCode: 400,
      message: `Failed to get checkin item - error: ${checkin.error.message}`,
    });
  }
  if (checkin.data == null) {
    return sendError(res, {
      statusCode: 204,
      message: `User does not have any (valid) checkins yet`,
    });
  }
  return sendSuccess(res, {
    statusCode: 201,
    message: `Successfully fetched checkin entry`,
    data: checkin.data,
  });
});

export const getCheckinById = async (checkinId) => {
  try {
    const checkin = await db("checkin as c")
      .where("c.checkinId", checkinId)
      .leftJoin(
        "user_activity_list as ual",
        "ual.userActivityId",
        "c.userActivityId"
      )
      .leftJoin("mood as bm", "bm.moodId", "c.beforeMoodId")
      .leftJoin("mood as am", "am.moodId", "c.afterMoodId")
      .leftJoin("mood as bpm", "bpm.moodId", "bm.parentMoodId")
      .leftJoin("mood as apm", "apm.moodId", "am.parentMoodId")
      .select([
        "c.checkinId",
        "c.beforeMoodId",
        "c.beforeEnergyLevel",
        "c.afterMoodId",
        "c.afterEnergyLevel",
        "am.label as afterMood",
        "am.parentMoodId as afterParentMoodId",
        "apm.label as afterParentMood",
        "bm.label as beforeMood",
        "bm.parentMoodId as beforeParentMoodId",
        "bpm.label as beforeParentMood",
        "c.created_at as createdAt",
        "ual.plannedEnd as plannedEnd",
      ])
      .first();
    if (!checkin) {
      return {
        error: {
          statusCode: 404,
          message: `Failed to get find checkin with id: ${checkinId}`,
        },
        data: null,
      };
    }
    return {
      error: null,
      data: checkin,
    };
  } catch (error) {
    return {
      error: {
        statusCode: 500,
        message: `Failed to get checkin by id, error: ${error}`,
      },
      data: null,
    };
  }
};
