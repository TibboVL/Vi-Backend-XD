import { Router } from "express";
import {
  handleMigrateDB,
  populateUitEvents,
  resetAIRequestCountForUserToday,
} from "../../../controllers/api/v1/admin.controller.js";

const adminRoutes = Router();

adminRoutes.get("/migrateDB", handleMigrateDB);
adminRoutes.get("/populateUITApiData", populateUitEvents);
adminRoutes.get("/resetUserQuota", resetAIRequestCountForUserToday);

export default adminRoutes;
