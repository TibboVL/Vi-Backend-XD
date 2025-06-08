import { Router } from "express";
import { modifySubscription } from "../../../controllers/api/v1/subscription.controller.js";

const subscriptionRoutes = Router();

subscriptionRoutes.post("/", modifySubscription);

export default subscriptionRoutes;
