import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireQuestlineOwnership } from "../middleware/questlineOwnership";
import {
  getAllEdges,
  createEdge,
  deleteEdge,
} from "../controllers/edgesController";

const router = Router({ mergeParams: true });

router.use(requireAuth, requireQuestlineOwnership);
router.get("/", getAllEdges);
router.post("/", createEdge);
router.delete("/:id", deleteEdge);

export default router;
