import express from "express";
import cors from "cors";
import routes from "./routes/api/v1/index.js"; // grab all registered routes
import { errorHandler } from "./middleware/errorHandler.js";
import { auth } from "express-oauth2-jwt-bearer";
import { requireUser } from "./middleware/requireUser.js";
import userRoutes from "./routes/api/v1/user.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

const jwtCheck = auth({
  audience: "https://Vi-Auth-API",
  issuerBaseURL: "https://vi-auth.eu.auth0.com/",
  tokenSigningAlg: "RS256",
});
// enforce on all endpoints
app.use(jwtCheck); // Auth0 JWT validation on all endpoints
app.use("/api/v1/users", userRoutes); // use routes need auth but dont need our user to exist yet
app.use(requireUser); // Require the user exists in our local DB for all following endpoints

app.use("/api/v1", routes); // use routes

app.use(errorHandler);

export default app;
