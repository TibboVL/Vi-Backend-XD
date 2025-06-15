import { Router } from "express";
import {
  getGoals,
  getMyGoals,
  setGoals,
} from "../../../controllers/api/v1/goal.controller.js";

const goalRoutes = Router();

goalRoutes.get("/", getGoals);
goalRoutes.get("/current", getMyGoals);
goalRoutes.post("/", setGoals);

export default goalRoutes;
