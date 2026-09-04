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
export async function createEdge(req: Request, res: Response) {
  const { questlineId } = req.params;
  const { from_node_id, to_node_id, condition_type } = req.body;

  if (!from_node_id || !to_node_id) {
    return res
      .status(400)
      .json({ error: "from_node_id and to_node_id are required" });
  }
  if (from_node_id === to_node_id) {
    return res.status(400).json({ error: "A node cannot depend on itself" });
  }

  const type =
    condition_type === "one_of_many" ? "one_of_many" : "hard_requirement";

  try {
    // Confirm BOTH nodes actually belong to this questline. A foreign key alone
    // only guarantees the node IDs exist somewhere in the nodes table — not that
    // they belong to the specific questline this edge is being created in.
    const nodeCheck = await pool.query(
      "SELECT id FROM nodes WHERE id = ANY($1) AND questline_id = $2",
      [[from_node_id, to_node_id], questlineId],
    );

    if (nodeCheck.rows.length !== 2) {
      return res
        .status(400)
        .json({ error: "Both nodes must belong to this questline" });
    }

    const result = await pool.query(
      `INSERT INTO edges (from_node_id, to_node_id, condition_type, questline_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [from_node_id, to_node_id, type, questlineId],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create edge" });
  }
}

export async function deleteEdge(req: Request, res: Response) {
  const { questlineId, id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM edges WHERE id = $1 AND questline_id = $2 RETURNING id",
      [id, questlineId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Edge not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete edge" });
  }
}
