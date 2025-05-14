import express from "express";
import cors from "cors";
import routes from "./routes/api/v1/index.js"; // grab all registered routes
import { errorHandler } from "./middleware/errorHandler.js";
import { auth } from "express-oauth2-jwt-bearer";
import { testConnection } from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());

const jwtCheck = auth({
  audience: "https://Vi-Auth-API",
  issuerBaseURL: "https://vi-auth.eu.auth0.com/",
  tokenSigningAlg: "RS256",
});
// enforce on all endpoints
app.use(jwtCheck);

app.get("/authorized", function (req, res) {
  res.send("Secured Resource");
});

app.use("/api/v1", routes); // use routes

app.use(errorHandler);

console.log("DB-version:", await testConnection());

export default app;
