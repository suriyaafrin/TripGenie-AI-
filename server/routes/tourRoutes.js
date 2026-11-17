import { Router } from "express";
import { createTour, listAreas } from "../controllers/tourController.js";

const router = Router();

router.get("/areas", listAreas);
router.post("/tours/generate", createTour);

export default router;
