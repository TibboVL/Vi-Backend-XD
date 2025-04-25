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
