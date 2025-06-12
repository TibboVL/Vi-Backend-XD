import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";

// for now this will always cancel the previus sub
// TODO: add extend functionality
export const createSubscriptionCore = async (
  req,
  planId,
  durationDays = 30,
  autoRenew = false
) => {
  if (!planId) {
    return {
      error: {
        statusCode: 400,
        message: "no plan provided",
      },
      data: null,
    };
  }
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);

  try {
    const existingSubscription = await db("subscription")
      .where("userId", req.user.userId)
      .where("isActive", true)
      .first();
    if (existingSubscription) {
      await db("subscription")
        .where("userId", req.user.userId)
        .where("isActive", true)
        .update({ isActive: false });
    }
    const result = await db("subscription")
      .insert({
        userId: req.user.userId,
        planId: planId,
        startDate: start,
        endDate: end,
        autoRenew: autoRenew,
      })
      .returning("*");
    return {
      error: null,
      data: result,
    };
  } catch (error) {
    return {
      error: {
        statusCode: 500,
        message: `Failed to create subscription, error: ${error}`,
      },
      data: null,
    };
  }
};

export const modifySubscription = asyncHandler(async (req, res) => {
  console.log(`ℹ️  modifying subscription for user: ${req.user.email}`);
  const { planId, durationDays, autoRenew } = req.body;

  if (!planId) {
    return sendError(res, {
      statusCode: 400,
      message: `Request is missing parameters!`,
    });
  }
  const result = await createSubscriptionCore(
    req,
    planId,
    durationDays,
    autoRenew
  );

  if (result.error) {
    return sendError(res, {
      statusCode: result.error.statusCode,
      message: result.error.message,
    });
  } else {
    return sendSuccess(res, {
      statusCode: 200,
      message: "successfully modified subscription",
      data: result.data,
    });
  }
});

export const getActiveSubscription = asyncHandler(async (req, res) => {
  const result = await getUserActiveSubscription(req);
  if (result.error) {
    return sendError(res, {
      statusCode: result.error.statusCode,
      message: result.error.message,
    });
  } else {
    return sendSuccess(res, {
      statusCode: 200,
      message: "successfully found subscription",
      data: result.data,
    });
  }
});
export const getAvalablePlans = asyncHandler(async (req, res) => {
  try {
    const result = await db("plan").where("isActive", true);
    return sendSuccess(res, {
      statusCode: 200,
      message: "successfully found avalable plans",
      data: result,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: error,
    });
  }
});

export const getUserActiveSubscription = async (req) => {
  const now = new Date();

  try {
    const subscription = await db("subscription as s")
      .leftJoin("plan as p", "p.planId", "s.planId")
      .where("s.userId", req.user.userId)
      .where("s.isActive", true)
      .where("s.startDate", "<=", now)
      .where("s.endDate", ">", now)
      .select("*");

    if (subscription.length > 1) {
      return {
        error: {
          statusCode: 500,
          message:
            "❌ User has multiple active subscriptions!! this should not happen!!",
        },
        data: null,
      };
    }

    if (subscription.length == 0) {
      const newSubscription = await createSubscriptionCore(req, 1, 30, false);
      if (newSubscription.error) {
        return {
          error: {
            statusCode: 500,
            message: `❌ No active subscription found, automatically creating free subscription for user. Failed to add a free subscription to user!, ${newSubscription.error.message}`,
          },
          data: null,
        };
      }
      return {
        statusCode: 201,
        message:
          "successfully added free subscription after not finding any active subscription",
        data: {
          error: null,
          data: newSubscription.data,
        },
      };
    } else {
      return {
        error: null,
        data: subscription[0],
      };
    }
  } catch (error) {
    return {
      error: {
        statusCode: 500,
        message: `Something went wrong while trying to read user subscriptions, ${error}`,
      },
      data: null,
    };
  }
};
