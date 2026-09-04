export interface ImportNode {
  id: string;
  label: string;
  type?: string;
  prerequisites: { nodeId: string; condition: string }[];
  properties?: Record<string, unknown>;
}

export interface ResolvedNodeInsert {
  originalId: string;
  label: string;
  node_type: string;
  properties: Record<string, unknown>;
}

export interface ResolvedEdgeInsert {
  fromOriginalId: string;
  toOriginalId: string;
  condition_type: string;
}

const VALID_TYPES = [
  "required",
  "optional",
  "mutually_exclusive",
  "time_sensitive",
];

export function validateImportNodes(nodes: unknown): nodes is ImportNode[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return false;

  return nodes.every(
    (n) =>
      typeof n === "object" &&
      n !== null &&
      typeof (n as ImportNode).id === "string" &&
      typeof (n as ImportNode).label === "string" &&
      Array.isArray((n as ImportNode).prerequisites),
  );
}

export function resolveNodesForInsert(
  nodes: ImportNode[],
): ResolvedNodeInsert[] {
  return nodes.map((n) => ({
    originalId: n.id,
    label: n.label,
    node_type: VALID_TYPES.includes(n.type ?? "") ? n.type! : "required",
    properties: n.properties ?? {},
  }));
}

export function resolveEdgesForInsert(
  nodes: ImportNode[],
): ResolvedEdgeInsert[] {
  const edges: ResolvedEdgeInsert[] = [];
  const knownIds = new Set(nodes.map((n) => n.id));

  for (const node of nodes) {
    for (const prereq of node.prerequisites) {
      if (!knownIds.has(prereq.nodeId)) {
        // Skip a prerequisite pointing at a node ID not present anywhere
        // in this import file, rather than failing the whole import —
        // this can legitimately happen with a hand-edited or partial file.
        continue;
      }
      edges.push({
        fromOriginalId: prereq.nodeId,
        toOriginalId: node.id,
        condition_type:
          prereq.condition === "one_of_many"
            ? "one_of_many"
            : "hard_requirement",
      });
    }
  }

  return edges;
}
