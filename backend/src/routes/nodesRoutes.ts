import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireQuestlineOwnership } from "../middleware/questlineOwnership";
import {
  getAllNodes,
  getDownstreamNodes,
} from "../controllers/nodesController";

const router = Router({ mergeParams: true });

router.use(requireAuth, requireQuestlineOwnership);
router.get("/", getAllNodes);
router.get("/:id/downstream", getDownstreamNodes);

export default router;
