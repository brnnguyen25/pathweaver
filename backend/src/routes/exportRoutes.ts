import { Router } from "express";
import { exportAsJson, exportAsXml } from "../controllers/exportController";

const router = Router();
router.get("/json", exportAsJson);
router.get("/xml", exportAsXml);

export default router;
