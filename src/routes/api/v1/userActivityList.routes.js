import { Router } from "express";
import {
  addActivityToUserList,
  getUserActivityList,
  getUserActivityListItemsToBeReviewed,
  updateActivityToUserList,
  deleteActivityFromUserActivityList,
} from "../../../controllers/api/v1/userActivityList.controller.js";

const userActivityListRoutes = Router();

userActivityListRoutes.get("/", getUserActivityList);
userActivityListRoutes.get("/toReview", getUserActivityListItemsToBeReviewed);
userActivityListRoutes.get("/:userActivityListId", getUserActivityList);
userActivityListRoutes.post("/add", addActivityToUserList);
userActivityListRoutes.post("/update", updateActivityToUserList);
userActivityListRoutes.delete("/delete", deleteActivityFromUserActivityList);

export default userActivityListRoutes;
