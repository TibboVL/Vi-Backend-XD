import { Router } from "express";
import userRoutes from "./user.routes.js";

const router = Router();

// register all routes here
router.use("/users", userRoutes);

export default router;
