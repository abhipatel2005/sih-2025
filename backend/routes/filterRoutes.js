import express from "express";
import { filterAttendance } from "../controllers/filterController.js";

const router = express.Router();

router.get("/", filterAttendance);

export default router;
