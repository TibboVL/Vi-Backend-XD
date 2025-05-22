import { Router } from "express";
import {
  addActivityToUserList,
  updateActivityToUserList,
} from "../../../controllers/api/v1/userActivityList.controller.js";

const userActivityListRoutes = Router();

userActivityListRoutes.post("/add", addActivityToUserList);
userActivityListRoutes.post("/update", updateActivityToUserList);

export default userActivityListRoutes;
