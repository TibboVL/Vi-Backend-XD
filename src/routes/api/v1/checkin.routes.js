import { Router } from "express";
import {
  addCheckin,
  getLastValidCheckin,
} from "../../../controllers/api/v1/checkin.controller.js";

const checkinRoutes = Router();

checkinRoutes.post("/add", addCheckin);
checkinRoutes.get("/lastValidCheckin", getLastValidCheckin);

export default checkinRoutes;
