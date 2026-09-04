import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireQuestlineOwnership } from "../middleware/questlineOwnership";
import {
  getAllNodes,
  getDownstreamNodes,
  saveNodePositions,
  createNode,
  updateNode,
  deleteNode,
} from "../controllers/nodesController";

const router = Router({ mergeParams: true });

router.use(requireAuth, requireQuestlineOwnership);
router.get("/", getAllNodes);
router.get("/:id/downstream", getDownstreamNodes);
router.put("/positions", saveNodePositions);
router.post("/", createNode);
router.patch("/:id", updateNode);
router.delete("/:id", deleteNode);

export default router;
