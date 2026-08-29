import { Request, Response } from "express";
import { pool } from "../db";

export async function getAllEdges(req: Request, res: Response) {
  try {
    const result = await pool.query("SELECT * FROM edges ORDER BY created_at");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch edges" });
  }
}
