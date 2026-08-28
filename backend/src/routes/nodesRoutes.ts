import { Router } from "express";
import {
  getAllNodes,
  getDownstreamNodes,
} from "../controllers/nodesController";

const router = Router();

router.get("/", getAllNodes);
router.get("/:id/downstream", getDownstreamNodes);

export default router;
