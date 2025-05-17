import { Router } from "express";
import {
  getBaseMoods,
  getMoods,
  getSubMoods,
} from "../../../controllers/api/v1/mood.controller.js";

const moodRoutes = Router();

moodRoutes.get("/", getMoods);
moodRoutes.get("/base-moods", getBaseMoods);
moodRoutes.get("/sub-moods/:parentMoodId", getSubMoods);
// router.get("/:id", getActivityDetails);

export default moodRoutes;
