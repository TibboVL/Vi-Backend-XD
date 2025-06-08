import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";
import { createSubscriptionCore } from "./subscription.controller.js";

export const getDoesUserExist = asyncHandler(async (req, res) => {
  const auth0User = req.auth;
  //console.log("req.auth =", req.auth);

  if (!auth0User?.payload?.sub) {
    return sendError(res, {
      statusCode: 401,
      message: "Invalid Auth0 token.",
    });
  }

  const user = await db("user")
    .where({ auth0Id: auth0User.payload.sub })
    .first()
    .select("userId"); // Only select needed fields

  if (user) {
    return sendSuccess(res, {
      statusCode: 200,
      message: "User exists",
      data: { exists: true },
    });
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: "User does not exist",
    data: { exists: false },
  });
});

export async function getOrCreateUser(auth0User) {
  const hasUserTable = await db.schema.hasTable("user");

  if (!hasUserTable) {
    console.warn("⚠️ 'user' table missing. Running migrations...");
    try {
      //await db.migrate.up({ name: "20250516091232_users.js" });
      //await db.migrate.up();
      await db.migrate.latest();
      console.info("✅ Migrations run successfully.");
      try {
        await db.seed.run();
        console.info("✅ Seeds run successfully.");
      } catch (error) {
        console.error("❌ Error running seeds:", error);
        throw new Error("Database seeding failed.");
      }
    } catch (error) {
      console.error("❌ Error running migrations:", error);
      throw new Error("Database migration failed.");
    }
  }

  let user = await db("user").where({ auth0Id: auth0User.payload.sub }).first();

  if (!user) {
    // Get extra user details from AUTH0
    let userInfo;
    try {
      const response = await fetch("https://vi-auth.eu.auth0.com/userinfo", {
        headers: { Authorization: `Bearer ${auth0User.token}` },
      });
      userInfo = await response.json();

      //console.log(userInfo);
    } catch (error) {
      console.warn("is not logged in via app! missing userinfo!:", error);
    }

    // New user, create record
    const [{ userId }] = await db("user")
      .insert({
        auth0Id: auth0User.payload.sub,
        email: userInfo.email,
        username: userInfo.name,
        firstname: userInfo.given_name,
        lastname: userInfo.family_name,
      })
      .returning("userId");

    user = await db("user").where("userId", userId).first();

    console.info(`ℹ️  New user added to DB - ${user.email}`);
  }

  return user;
}
