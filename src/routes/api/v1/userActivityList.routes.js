import { Router } from "express";
import {
  addActivityToUserList,
  getUserActivityList,
  getUserActivityListItemsToBeReviewed,
  updateActivityToUserList,
  deleteActivityFromUserActivityList,
} from "../../../controllers/api/v1/userActivityList.controller.js";

const userActivityListRoutes = Router();

userActivityListRoutes.post("/add", addActivityToUserList);
userActivityListRoutes.post("/update", updateActivityToUserList);
userActivityListRoutes.get("/", getUserActivityList);
userActivityListRoutes.get("/toReview", getUserActivityListItemsToBeReviewed);
userActivityListRoutes.get("/:userActivityListId", getUserActivityList);
userActivityListRoutes.delete("/:userActivityListId", deleteActivityFromUserActivityList);

export default userActivityListRoutes;
