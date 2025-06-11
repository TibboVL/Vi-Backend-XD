import { Router } from "express";
import {
  getPerActivityStats,
  getPerPillarStatistics,
} from "../../../controllers/api/v1/statistic.controller.js";

const statisticRoutes = Router();

statisticRoutes.get("/perPillar", getPerPillarStatistics);
statisticRoutes.get("/perActivity", getPerActivityStats);

export default statisticRoutes;
