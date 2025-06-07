import { Router } from "express";
import { getPerPillarStatistics } from "../../../controllers/api/v1/statistic.controller.js";

const statisticRoutes = Router();

statisticRoutes.get("/perPillar", getPerPillarStatistics);

export default statisticRoutes;
