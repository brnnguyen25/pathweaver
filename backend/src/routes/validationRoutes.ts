import { Router } from "express";
import { runValidation } from "../controllers/validationController";

const router = Router();
router.get("/", runValidation);

export default router;
