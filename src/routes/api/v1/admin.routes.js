import { Router } from "express";
import {
  handleMigrateDB,
  populateUitEvents,
} from "../../../controllers/api/v1/admin.controller.js";

const adminRoutes = Router();

adminRoutes.post("/migrateDB", handleMigrateDB);
adminRoutes.get("/populateUITApiData", populateUitEvents);

export default adminRoutes;
