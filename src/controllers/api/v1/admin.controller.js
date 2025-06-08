import { asyncHandler } from "../../../utils/asyncHandler.js";
import dotenv from "dotenv";
import { sendError, sendSuccess } from "../../../utils/responses.js";
import db from "../../../db/index.js";
import { getUitEventDecodedList } from "../../../services/UitVlaanderenService.js";
import { clearUserAIRequestUsageForToday } from "./aiRequestUsage.controller.js";

export const handleMigrateDB = asyncHandler(async (req, res) => {
  dotenv.config();

  console.log("ADMIN EMAIL", process.env.ADMIN_EMAIL);

  if (req.user.email.toLowerCase() != process.env.ADMIN_EMAIL.toLowerCase()) {
    console.warn(
      `An unauthorized user attempted to call an administative endpoint! - ${JSON.stringify(
        req.user
      )}`
    );
    return sendError(res, {
      statusCode: 401,
      message:
        "User is unauthorized to perform this action, this attempt will be reported",
    });
  }

  if (req.query.reset) {
    try {
      await db.migrate.rollback();
      return sendSuccess(res, {
        statusCode: 200,
        message: "✅  Database has been reset",
      });
    } catch (error) {
      console.warn(error);
      return sendError(res, {
        statusCode: 500,
        message: "❌  Database failed to reset",
      });
    }
  } else {
    try {
      await db.migrate.latest();
      await db.seed.run();
      return sendSuccess(res, {
        statusCode: 200,
        message: "✅  Database has been initialized and seeded",
      });
    } catch (error) {
      console.warn(error);
      return sendError(res, {
        statusCode: 500,
        message: "❌  Database failed to initialize",
      });
    }
  }
});

export const populateUitEvents = asyncHandler(async (req, res) => {
  dotenv.config();

  console.log("ADMIN EMAIL", process.env.ADMIN_EMAIL);

  if (req.user.email.toLowerCase() != process.env.ADMIN_EMAIL.toLowerCase()) {
    console.warn(
      `An unauthorized user attempted to call an administative endpoint! - ${JSON.stringify(
        req.user
      )}`
    );
    return sendError(res, {
      statusCode: 401,
      message:
        "User is unauthorized to perform this action, this attempt will be reported",
    });
  }

  const events = await getUitEventDecodedList(req.query);

  return sendSuccess(res, {
    statusCode: 200,
    message: "UitVlaanderen Events Retrieved",
    data: events,
  });
});
export const resetAIRequestCountForUserToday = asyncHandler(
  async (req, res) => {
    dotenv.config();

    console.log("ADMIN EMAIL", process.env.ADMIN_EMAIL);

    if (req.user.email.toLowerCase() != process.env.ADMIN_EMAIL.toLowerCase()) {
      console.warn(
        `An unauthorized user attempted to call an administative endpoint! - ${JSON.stringify(
          req.user
        )}`
      );
      return sendError(res, {
        statusCode: 401,
        message:
          "User is unauthorized to perform this action, this attempt will be reported",
      });
    }

    if (!req.body.userId && !req.body.email) {
      return sendSuccess(res, {
        statusCode: 400,
        message: "at least one of [userId, email] is required",
      });
    }

    try {
      const result = await clearUserAIRequestUsageForToday();
      return sendSuccess(res, {
        statusCode: 200,
        message: "Reset todays quota for user",
        data: result,
      });
    } catch (error) {
      return sendError(res, {
        statusCode: 500,
        message: `Failed to reset quota, error: ${error}`,
      });
    }
  }
);
