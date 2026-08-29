import { Router } from "express";
import { getAllEdges } from "../controllers/edgesController";

const router = Router();
router.get("/", getAllEdges);

export default router;
