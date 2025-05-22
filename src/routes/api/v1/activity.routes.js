import { Router } from "express";
import {
  getActivities,
  getActivityDetails,
  getActivitySuggestions,
} from "../../../controllers/api/v1/activity.controller.js";

const activityRoutes = Router();

activityRoutes.get("/", getActivities);
activityRoutes.get("/personalized", getActivitySuggestions);
activityRoutes.get("/:activityId", getActivityDetails);

export default activityRoutes;
