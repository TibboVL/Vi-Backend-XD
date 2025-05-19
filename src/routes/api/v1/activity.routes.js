import { Router } from "express";
import {
  getActivities,
  getActivityDetails,
} from "../../../controllers/api/v1/activity.controller.js";

const activityRoutes = Router();

activityRoutes.get("/", getActivities);
activityRoutes.get("/:activityId", getActivityDetails);

export default activityRoutes;
