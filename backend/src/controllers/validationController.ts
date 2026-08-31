import { Request, Response } from "express";
import { pool } from "../db";
import {
  findOrphanedNodes,
  findDeadEndNodes,
  findCycles,
  type GraphNode,
  type GraphEdge,
} from "../graph/algorithms";

export async function runValidation(req: Request, res: Response) {
  try {
    const nodesResult = await pool.query<GraphNode>(
      "SELECT id, label FROM nodes",
    );
    const edgesResult = await pool.query<GraphEdge>(
      "SELECT from_node_id, to_node_id FROM edges",
    );

    const nodes = nodesResult.rows;
    const edges = edgesResult.rows;

    const orphanedNodes = findOrphanedNodes(nodes, edges);
    const deadEndNodes = findDeadEndNodes(nodes, edges);
    const cycleGroups = findCycles(nodes, edges);

    // Convert cycle ID groups back into labeled nodes for a readable report.
    const nodesById = new Map(nodes.map((n) => [n.id, n]));
    const cycles = cycleGroups.map((group) =>
      group.map((id) => nodesById.get(id)).filter(Boolean),
    );

    res.json({
      totalNodes: nodes.length,
      totalEdges: edges.length,
      orphanedNodes,
      deadEndNodes,
      cycles,
      isValid: orphanedNodes.length === 0 && cycles.length === 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to run validation" });
  }
}
