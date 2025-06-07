import { Router } from "express";
import activityRoutes from "./activity.routes.js";
import moodRoutes from "./mood.routes.js";
import checkinRoutes from "./checkin.routes.js";
import userActivityListRoutes from "./userActivityList.routes.js";
import adminRoutes from "./admin.routes.js";
import activitySuggestionRoutes from "./activitySuggestion.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

// register all routes here
router.use("/admin", adminRoutes);
router.use("/activities", activityRoutes);
router.use("/moods", moodRoutes);
router.use("/checkin", checkinRoutes);
router.use("/useractivitylist", userActivityListRoutes);
router.use("/activitySuggestions", activitySuggestionRoutes);
//router.use("/users", userRoutes); // users route is unprotected by auth

export default router;
