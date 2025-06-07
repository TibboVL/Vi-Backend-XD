import { Router } from "express";
import { getDoesUserExist } from "../../../controllers/api/v1/user.controller.js";

const userRoutes = Router();

userRoutes.get("/exists", getDoesUserExist);

export default userRoutes;
