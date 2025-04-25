import express from "express";
import cors from "cors";
import routes from "./routes/api/v1/index.js"; // grab all registered routes
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", routes); // use routes

app.use(errorHandler);

export default app;
