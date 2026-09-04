import { Request, Response } from "express";
import { pool } from "../db";

export async function getAllNodes(req: Request, res: Response) {
  const { questlineId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM nodes WHERE questline_id = $1 ORDER BY created_at",
      [questlineId],
    );
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

interface NodePositionUpdate {
  id: string;
  position_x: number;
  position_y: number;
}

export async function saveNodePositions(req: Request, res: Response) {
  const { questlineId } = req.params;
  const updates: NodePositionUpdate[] = req.body.positions;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res
      .status(400)
      .json({ error: "A non-empty positions array is required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const update of updates) {
      await client.query(
        `UPDATE nodes
         SET position_x = $1, position_y = $2, updated_at = now()
         WHERE id = $3 AND questline_id = $4`,
        [update.position_x, update.position_y, update.id, questlineId],
      );
    }

    await client.query("COMMIT");
    res.json({ saved: updates.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to save node positions" });
  } finally {
    client.release();
  }
}
export async function createNode(req: Request, res: Response) {
  const { questlineId } = req.params;
  const { label, node_type, properties, position_x, position_y } = req.body;

  if (!label || typeof label !== "string" || label.trim().length === 0) {
    return res.status(400).json({ error: "A node label is required" });
  }

  const validTypes = ["required", "optional", "mutually_exclusive", "time_sensitive"];
  const type = validTypes.includes(node_type) ? node_type : "required";

  try {
    const result = await pool.query(
      `INSERT INTO nodes (label, node_type, properties, position_x, position_y, questline_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        label.trim(),
        type,
        properties ?? {},
        position_x ?? 0,
        position_y ?? 0,
        questlineId,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create node" });
  }
}

export async function updateNode(req: Request, res: Response) {
  const { questlineId, id } = req.params;
  const { label, node_type, properties } = req.body;

  try {
    const result = await pool.query(
      `UPDATE nodes
       SET label = COALESCE($1, label),
           node_type = COALESCE($2, node_type),
           properties = COALESCE($3, properties),
           updated_at = now()
       WHERE id = $4 AND questline_id = $5
       RETURNING *`,
      [label ?? null, node_type ?? null, properties ?? null, id, questlineId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Node not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update node" });
  }
}

export async function deleteNode(req: Request, res: Response) {
  const { questlineId, id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM nodes WHERE id = $1 AND questline_id = $2 RETURNING id",
      [id, questlineId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Node not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete node" });
  }
}
