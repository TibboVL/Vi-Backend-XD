import { Router } from "express";
import {
  addActivityToUserList,
  getUserActivityList,
  updateActivityToUserList,
} from "../../../controllers/api/v1/userActivityList.controller.js";

const userActivityListRoutes = Router();

userActivityListRoutes.post("/add", addActivityToUserList);
userActivityListRoutes.post("/update", updateActivityToUserList);
userActivityListRoutes.get("/", getUserActivityList);
userActivityListRoutes.get("/:userActivityListId", getUserActivityList);

export default userActivityListRoutes;
