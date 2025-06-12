import { Router } from "express";
import {
  getActiveSubscription,
  getAvalablePlans,
  modifySubscription,
} from "../../../controllers/api/v1/subscription.controller.js";

const subscriptionRoutes = Router();

subscriptionRoutes.get("/", getActiveSubscription);
subscriptionRoutes.get("/plans", getAvalablePlans);
subscriptionRoutes.post("/", modifySubscription);

export default subscriptionRoutes;
