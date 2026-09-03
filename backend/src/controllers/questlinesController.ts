import { Response } from "express";
import { pool } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function listQuestlines(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await pool.query(
      "SELECT id, name, created_at, updated_at FROM questlines WHERE owner_id = $1 ORDER BY updated_at DESC",
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch questlines" });
  }
}

export async function createQuestline(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "A questline name is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO questlines (owner_id, name) VALUES ($1, $2) RETURNING id, name, created_at, updated_at",
      [req.userId, name.trim()],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create questline" });
  }
}

// Runs AFTER requireQuestlineOwnership, so we already know this user owns this questline.
export async function deleteQuestline(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { questlineId } = req.params;

  try {
    await pool.query("DELETE FROM questlines WHERE id = $1", [questlineId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete questline" });
  }
}
