import { Router } from "express";
import userRoutes from "./user.routes.js";
import activityRoutes from "./activity.routes.js";
import moodRoutes from "./mood.routes.js";

const router = Router();

// register all routes here
router.use("/users", userRoutes);
router.use("/activities", activityRoutes);
router.use("/moods", moodRoutes);

export default router;
