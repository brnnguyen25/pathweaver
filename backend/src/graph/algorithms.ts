export interface GraphNode {
  id: string;
  label: string;
}

export interface GraphEdge {
  from_node_id: string;
  to_node_id: string;
}

/**
 * Builds an adjacency list: for each node ID, the list of node IDs it points to.
 */
function buildAdjacencyList(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.from_node_id)?.push(edge.to_node_id);
  }
  return adjacency;
}

/**
 * Finds every node with zero incoming edges — the natural "starting points"
 * of the graph, since nothing must happen before them.
 */
function findRootNodes(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const nodesWithIncoming = new Set(edges.map((e) => e.to_node_id));
  return nodes.filter((n) => !nodesWithIncoming.has(n.id)).map((n) => n.id);
}

/**
 * Standard iterative DFS, marking every node reachable from a given start node.
 */
function dfsReachable(
  startId: string,
  adjacency: Map<string, string[]>,
  visited: Set<string>,
): void {
  const stack = [startId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }
}

/**
 * Finds all nodes that are NOT reachable from any root (no-incoming-edge) node.
 * These are "orphaned" — content a player can never legitimately reach.
 */
export function findOrphanedNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
): GraphNode[] {
  const adjacency = buildAdjacencyList(nodes, edges);
  const roots = findRootNodes(nodes, edges);

  const reachable = new Set<string>();
  for (const root of roots) {
    dfsReachable(root, adjacency, reachable);
  }

  return nodes.filter((n) => !reachable.has(n.id));
}

/**
 * Finds all nodes with zero outgoing edges — dead ends.
 */
export function findDeadEndNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
): GraphNode[] {
  const nodesWithOutgoing = new Set(edges.map((e) => e.from_node_id));
  return nodes.filter((n) => !nodesWithOutgoing.has(n.id));
}

/**
 * Tarjan's Strongly Connected Components algorithm.
 * Returns groups of node IDs that form cycles (SCCs with more than one node).
 */
export function findCycles(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
  const adjacency = buildAdjacencyList(nodes, edges);

  let indexCounter = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indices = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const sccs: string[][] = [];

  function strongConnect(nodeId: string) {
    indices.set(nodeId, indexCounter);
    lowLink.set(nodeId, indexCounter);
    indexCounter++;
    stack.push(nodeId);
    onStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!indices.has(neighbor)) {
        strongConnect(neighbor);
        lowLink.set(
          nodeId,
          Math.min(lowLink.get(nodeId)!, lowLink.get(neighbor)!),
        );
      } else if (onStack.has(neighbor)) {
        lowLink.set(
          nodeId,
          Math.min(lowLink.get(nodeId)!, indices.get(neighbor)!),
        );
      }
    }

    // If nodeId is a root node of an SCC, pop the stack and generate the SCC.
    if (lowLink.get(nodeId) === indices.get(nodeId)) {
      const component: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        component.push(member);
      } while (member !== nodeId);
      sccs.push(component);
    }
  }

  for (const node of nodes) {
    if (!indices.has(node.id)) {
      strongConnect(node.id);
    }
  }

  // Only SCCs with more than one node represent actual cycles.
  return sccs.filter((component) => component.length > 1);
}
