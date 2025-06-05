import { Router } from "express";
import { GetActivitySuggestionsWithDetails } from "../../../controllers/api/v1/suggestedActivity.controller.js";

const activitySuggestionRoutes = Router();

activitySuggestionRoutes.get("/", GetActivitySuggestionsWithDetails);

export default activitySuggestionRoutes;
