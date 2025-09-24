import express from "express";
import { getSchools, getSchoolById } from "../controllers/schoolController.js";

const router = express.Router();

router.get("/", getSchools);
router.get("/:id", getSchoolById);

export default router;
