import { Router } from "express";
import { getUsers } from "../../../controllers/api/v1/user.controller.js";

const router = Router();

router.get("/", getUsers);

export default router;
