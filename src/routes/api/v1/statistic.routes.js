import { Router } from "express";
import {
  getEnergyOvertimeStatistics,
  getPerActivityStats,
  getPillarsOvertimeStatistics,
} from "../../../controllers/api/v1/statistic.controller.js";

const statisticRoutes = Router();

statisticRoutes.get("/timelinePillar", getPillarsOvertimeStatistics);
statisticRoutes.get("/timelineEnergy", getEnergyOvertimeStatistics);
statisticRoutes.get("/perActivity", getPerActivityStats);

export default statisticRoutes;
