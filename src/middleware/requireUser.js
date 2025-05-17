// middleware/requireUser.js

import { getOrCreateUser } from "../controllers/api/v1/user.controller.js";
import { sendError } from "../utils/responses.js";

export async function requireUser(req, res, next) {
  try {
    const auth0User = req.auth;
    //console.log("req.auth =", req.auth);

    if (!auth0User?.payload?.sub) {
      return sendError(res, {
        statusCode: 401,
        message: "Invalid Auth0 token.",
      });
    }

    const user = await getOrCreateUser(auth0User);

    if (!user) {
      return sendError(res, {
        statusCode: 403,
        message: "User could not be created.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
