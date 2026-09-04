import { Response } from "express";
import { pool } from "../db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  validateImportNodes,
  resolveNodesForInsert,
  resolveEdgesForInsert,
} from "../graph/importSchema";

export async function importQuestline(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { name, nodes } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "A questline name is required" });
  }

  if (!validateImportNodes(nodes)) {
    return res
      .status(400)
      .json({
        error: "Invalid import file: nodes array is missing or malformed",
      });
  }

  const resolvedNodes = resolveNodesForInsert(nodes);
  const resolvedEdges = resolveEdgesForInsert(nodes);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const questlineResult = await client.query(
      "INSERT INTO questlines (owner_id, name) VALUES ($1, $2) RETURNING id",
      [req.userId, name.trim()],
    );
    const questlineId = questlineResult.rows[0].id;

    // Insert every node, tracking old ID -> new ID as we go.
    const idMap = new Map<string, string>();

    for (let i = 0; i < resolvedNodes.length; i++) {
      const node = resolvedNodes[i];
      const result = await client.query(
        `INSERT INTO nodes (label, node_type, properties, position_x, position_y, questline_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          node.label,
          node.node_type,
          node.properties,
          (i % 5) * 220,
          Math.floor(i / 5) * 150,
          questlineId,
        ],
      );
      idMap.set(node.originalId, result.rows[0].id);
    }

    // Now insert edges, translating old IDs to new ones via the map.
    for (const edge of resolvedEdges) {
      const newFromId = idMap.get(edge.fromOriginalId);
      const newToId = idMap.get(edge.toOriginalId);
      if (!newFromId || !newToId) continue;

      await client.query(
        `INSERT INTO edges (from_node_id, to_node_id, condition_type, questline_id)
         VALUES ($1, $2, $3, $4)`,
        [newFromId, newToId, edge.condition_type, questlineId],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      questlineId,
      name: name.trim(),
      nodesImported: resolvedNodes.length,
      edgesImported: resolvedEdges.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to import questline" });
  } finally {
    client.release();
  }
}
