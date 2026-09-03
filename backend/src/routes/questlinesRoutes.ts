import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireQuestlineOwnership } from "../middleware/questlineOwnership";
import {
  listQuestlines,
  createQuestline,
  deleteQuestline,
} from "../controllers/questlinesController";

const router = Router();

router.get("/", requireAuth, listQuestlines);
router.post("/", requireAuth, createQuestline);
router.delete(
  "/:questlineId",
  requireAuth,
  requireQuestlineOwnership,
  deleteQuestline,
);

export default router;
