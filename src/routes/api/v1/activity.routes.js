import { Router } from "express";
import { getActivities } from "../../../controllers/api/v1/activity.controller.js";

const activityRoutes = Router();

activityRoutes.get("/", getActivities);
// router.get("/:id", getActivityDetails);

export default activityRoutes;
