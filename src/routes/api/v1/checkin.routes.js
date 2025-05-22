import { Router } from "express";
import { addCheckin } from "../../../controllers/api/v1/checkin.controller.js";

const checkinRoutes = Router();

checkinRoutes.post("/add", addCheckin);

export default checkinRoutes;
