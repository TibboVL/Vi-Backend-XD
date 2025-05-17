import db from "../../../db/index.js";
import { getUitEventDecodedList } from "../../../services/UitVlaanderenService.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";

// temporary
export const getUsers = asyncHandler(async (req, res) => {
  const works = false;

  console.log(req.body);
  console.log(req.body.username);

  if (works) {
    sendSuccess(res, {
      statusCode: 200,
      message: "Users loaded succesfully",
      data: [{ id: 1, name: "Alice" }],
    });
  } else {
    sendError(res, {
      statusCode: 400,
      message: "Validation failed",
      errors: [
        "Password must be more than 8 characters",
        "Password must include at least one special character",
      ],
    });
  }
});

export const getUitEvents = asyncHandler(async (req, res) => {
  console.log(req.query);
  const events = await getUitEventDecodedList(req.query);

  //console.log(events);

  sendSuccess(res, {
    statusCode: 200,
    message: "UitVlaanderen Events Retrieved",
    data: events,
  });
});

export async function getOrCreateUser(auth0User) {
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
