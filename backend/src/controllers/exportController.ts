import { Request, Response } from "express";
import { pool } from "../db";
import { buildExportSchema, exportSchemaToXml } from "../graph/exportSchema";

export async function exportAsJson(req: Request, res: Response) {
  const { questlineId } = req.params;
  try {
    const nodesResult = await pool.query(
      "SELECT id, label, node_type, properties FROM nodes WHERE questline_id = $1",
      [questlineId],
    );
    const edgesResult = await pool.query(
      "SELECT from_node_id, to_node_id, condition_type FROM edges WHERE questline_id = $1",
      [questlineId],
    );

    const schema = buildExportSchema(nodesResult.rows, edgesResult.rows);

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=pathweaver-export.json",
    );
    res.send(JSON.stringify(schema, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export as JSON" });
  }
}

export async function exportAsXml(req: Request, res: Response) {
  const { questlineId } = req.params;
  try {
    const nodesResult = await pool.query(
      "SELECT id, label, node_type, properties FROM nodes WHERE questline_id = $1",
      [questlineId],
    );
    const edgesResult = await pool.query(
      "SELECT from_node_id, to_node_id, condition_type FROM edges WHERE questline_id = $1",
      [questlineId],
    );

    const schema = buildExportSchema(nodesResult.rows, edgesResult.rows);
    const xml = exportSchemaToXml(schema);

    res.setHeader("Content-Type", "application/xml");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=pathweaver-export.xml",
    );
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export as XML" });
  }
}
