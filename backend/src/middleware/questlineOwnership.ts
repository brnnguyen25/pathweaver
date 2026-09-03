import { Response, NextFunction } from "express";
import { pool } from "../db";
import { AuthenticatedRequest } from "./authMiddleware";

export async function requireQuestlineOwnership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { questlineId } = req.params;

  try {
    const result = await pool.query(
      "SELECT owner_id FROM questlines WHERE id = $1",
      [questlineId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Questline not found" });
    }

    if (result.rows[0].owner_id !== req.userId) {
      return res.status(404).json({ error: "Questline not found" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify questline ownership" });
  }
}
