import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireQuestlineOwnership } from "../middleware/questlineOwnership";
import { importQuestline } from "../controllers/importController";
import {
  listQuestlines,
  createQuestline,
  deleteQuestline,
} from "../controllers/questlinesController";

const router = Router();

router.get("/", requireAuth, listQuestlines);
router.post("/", requireAuth, createQuestline);
router.post("/import", requireAuth, importQuestline);
router.delete(
  "/:questlineId",
  requireAuth,
  requireQuestlineOwnership,
  deleteQuestline,
);

export default router;
