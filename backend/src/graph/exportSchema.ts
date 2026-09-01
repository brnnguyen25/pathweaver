export interface ExportNode {
  id: string;
  label: string;
  type: string;
  prerequisites: { nodeId: string; condition: string }[];
  properties: Record<string, unknown>;
}

export interface ExportSchema {
  questlineName: string;
  exportedAt: string;
  nodes: ExportNode[];
}

interface DbNode {
  id: string;
  label: string;
  node_type: string;
  properties: Record<string, unknown>;
}

interface DbEdge {
  from_node_id: string;
  to_node_id: string;
  condition_type: string;
}

export function buildExportSchema(
  nodes: DbNode[],
  edges: DbEdge[],
  questlineName = "Pathweaver Export",
): ExportSchema {
  const exportNodes: ExportNode[] = nodes.map((node) => {
    const prerequisites = edges
      .filter((edge) => edge.to_node_id === node.id)
      .map((edge) => ({
        nodeId: edge.from_node_id,
        condition: edge.condition_type,
      }));

    return {
      id: node.id,
      label: node.label,
      type: node.node_type,
      prerequisites,
      properties: node.properties,
    };
  });

  return {
    questlineName,
    exportedAt: new Date().toISOString(),
    nodes: exportNodes,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportSchemaToXml(schema: ExportSchema): string {
  const nodesXml = schema.nodes
    .map((node) => {
      const prerequisitesXml = node.prerequisites
        .map(
          (prereq) =>
            `      <Prerequisite nodeId="${escapeXml(prereq.nodeId)}" condition="${escapeXml(prereq.condition)}" />`,
        )
        .join("\n");

      return `    <Node id="${escapeXml(node.id)}" type="${escapeXml(node.type)}">
      <Label>${escapeXml(node.label)}</Label>
      <Prerequisites>
${prerequisitesXml}
      </Prerequisites>
    </Node>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Questline name="${escapeXml(schema.questlineName)}" exportedAt="${escapeXml(schema.exportedAt)}">
  <Nodes>
${nodesXml}
  </Nodes>
</Questline>`;
}
