import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";

export const getGoals = asyncHandler(async (req, res) => {
  const goals = await db("goal as g")
    .where("g.isActive", true)
    .select("g.goalId", "g.label", "g.slug");

  return sendSuccess(res, {
    statusCode: 200,
    message: "Goal list retrieved successfully",
    data: goals,
  });
});

export const getMyGoals = asyncHandler(async (req, res) => {
  const goals = await db("user_goal_list as ugl")
    .where("ugl.userId", req.user.userId)
    .leftJoin("goal as g", "ugl.goalId", "g.goalId")
    .select("g.goalId", "g.label", "g.slug");

  return sendSuccess(res, {
    statusCode: 200,
    message: "Users goal list retrieved successfully",
    data: goals,
  });
});

export const setGoals = asyncHandler(async (req, res) => {
  let goalIds = [];
  if (req.body?.goalIds != null) {
    goalIds = req.body.goalIds;
  }
  try {
    await db("user_goal_list as ugl").where("userId", req.user.userId).del();

    const goalMap = goalIds.map((goalId) => ({
      userId: req.user.userId,
      goalId: goalId,
    }));
    if (goalMap.length < 1) {
      return sendSuccess(res, {
        statusCode: 200,
        message: "Goals updated, no goals were provided, goals are now empty",
      });
    }
    const newGoals = await db("user_goal_list as ugl").insert(goalMap, ["*"]);

    return sendSuccess(res, {
      statusCode: 200,
      message: "Goals updated",
      data: newGoals,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: `Failed to update goals!, error: ${error}`,
    });
  }
});
