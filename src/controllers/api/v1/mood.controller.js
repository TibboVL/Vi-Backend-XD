import db from "../../../db/index.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendError, sendSuccess } from "../../../utils/responses.js";

// temporary
export const getMoods = asyncHandler(async (req, res) => {
  const moods = await db("mood as m").select(
    "m.moodId",
    "m.parentMoodId",
    "m.label"
  );

  sendSuccess(res, {
    statusCode: 200,
    message: "Mood list retrieved successfully",
    data: moods,
  });
});
export const getBaseMoods = asyncHandler(async (req, res) => {
  const moods = await db("mood as m")
    .whereNull("m.parentMoodId")
    .select("m.moodId", "m.parentMoodId", "m.label");

  sendSuccess(res, {
    statusCode: 200,
    message: "Base mood list retrieved successfully",
    data: moods,
  });
});
export const getSubMoods = asyncHandler(async (req, res) => {
  const { parentMoodId } = req.params;

  const parentMood = await db("mood as m")
    .whereNull("m.parentMoodId")
    .where("m.moodId", parentMoodId)
    .first() // only ever get one result and dont return an array
    .select("*");

  if (parentMood) {
    console.log(parentMood);
    const moods = await db("mood as m")
      .where("m.parentMoodId", parentMoodId)
      .select("m.moodId", "m.parentMoodId", "m.label");

    sendSuccess(res, {
      statusCode: 200,
      message: `Sub moods for ${parentMood.label} retrieved successfully`,
      data: moods,
    });
  } else {
    sendError(res, {
      statusCode: 404,
      message: "Parent mood not found!",
    });
  }
});
