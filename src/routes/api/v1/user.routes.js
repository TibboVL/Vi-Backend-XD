import { Router } from "express";
import {
  getUitEvents,
  getUsers,
} from "../../../controllers/api/v1/user.controller.js";

const router = Router();

router.get("/", getUsers);
router.get("/testUitAPI", getUitEvents);

export default router;
