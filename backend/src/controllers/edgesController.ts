import { Request, Response } from "express";
import { pool } from "../db";

export async function getAllEdges(req: Request, res: Response) {
  const { questlineId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM edges WHERE questline_id = $1 ORDER BY created_at",
      [questlineId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch edges" });
  }
}
