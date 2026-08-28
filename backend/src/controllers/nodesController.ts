import { Request, Response } from "express";
import { pool } from "../db";

export async function getAllNodes(req: Request, res: Response) {
  try {
    const result = await pool.query("SELECT * FROM nodes ORDER BY created_at");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
}

export async function getDownstreamNodes(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `WITH RECURSIVE downstream AS (
        SELECT id, label, 0 AS depth
        FROM nodes
        WHERE id = $1

        UNION ALL

        SELECT n.id, n.label, d.depth + 1
        FROM downstream d
        JOIN edges e ON e.from_node_id = d.id
        JOIN nodes n ON n.id = e.to_node_id
      )
      SELECT DISTINCT id, label, depth FROM downstream ORDER BY depth;`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Node not found" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to traverse downstream nodes" });
  }
}
