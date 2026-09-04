import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { requireQuestlineOwnership } from "../middleware/questlineOwnership";
import { runValidation } from "../controllers/validationController";

const router = Router({ mergeParams: true });

router.use(requireAuth, requireQuestlineOwnership);
router.get("/", runValidation);

export default router;
