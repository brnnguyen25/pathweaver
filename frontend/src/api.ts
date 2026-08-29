const API_BASE_URL = "http://localhost:3001/api";

export interface ApiNode {
  id: string;
  label: string;
  node_type: string;
  properties: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ApiEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  condition_type: string;
}

export async function fetchNodes(): Promise<ApiNode[]> {
  const response = await fetch(`${API_BASE_URL}/nodes`);
  if (!response.ok) {
    throw new Error(`Failed to fetch nodes: ${response.status}`);
  }
  return response.json();
}

export async function fetchEdges(): Promise<ApiEdge[]> {
  const response = await fetch(`${API_BASE_URL}/edges`);
  if (!response.ok) {
    throw new Error(`Failed to fetch edges: ${response.status}`);
  }
  return response.json();
}
