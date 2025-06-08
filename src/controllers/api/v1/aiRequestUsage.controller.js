import db from "../../../db/index.js";
import { getUTCDateOnly } from "../../../utils/dateHekoer.js";

export const insertAIRequestUsageEntry = async (req) => {
  try {
    const aiRequestUsageEntry = await db("ai_request_usage").insert({
      userId: req.user.userId,
    });

    return {
      error: null,
      data: aiRequestUsageEntry,
    };
  } catch (error) {
    return {
      error: {
        statusCode: 500,
        message: `Failed to insert AI request ussage entry, ${error}`,
      },
      data: null,
    };
  }
};

export const getAIRequestUsageForToday = async (req) => {
  const now = new Date();
  const today = getUTCDateOnly(now, 0);
  const tomorrow = getUTCDateOnly(now, 1);

  try {
    const ussageCount = await db("ai_request_usage")
      .where("userId", req.user.userId)
      .whereBetween("usedAt", [today, tomorrow])
      .count()
      .first();
    return {
      error: null,
      data: ussageCount,
    };
  } catch (error) {
    return {
      error: {
        statusCode: 500,
        message: `Failed to get ussage count ${error}`,
      },
      data: null,
    };
  }
};

export const clearUserAIRequestUsageForToday = async (userId, email) => {
  const now = new Date();
  const today = getUTCDateOnly(now, 0);
  const tomorrow = getUTCDateOnly(now, 1);

  try {
    let query = db("ai_request_usage");

    if (userId) {
      query = query.where("userId", userId);
    } else if (email) {
      query = query.orWhere("email", email);
    }
    const ussageCount = await query
      .whereBetween("usedAt", [today, tomorrow])
      .del();
    return {
      error: null,
      data: ussageCount,
    };
  } catch (error) {
    return {
      error: {
        statusCode: 500,
        message: `Failed to clear ussage data ${error}`,
      },
      data: null,
    };
  }
};
