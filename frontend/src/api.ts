const API_BASE_URL = "http://localhost:3001/api";

export interface ApiNode {
  id: string;
  label: string;
  node_type: string;
  properties: Record<string, unknown>;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface ApiEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  condition_type: string;
}
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
export interface Questline {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchQuestlines(token: string): Promise<Questline[]> {
  const response = await fetch(`${API_BASE_URL}/questlines`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch questlines");
  return response.json();
}

export async function createQuestline(
  token: string,
  name: string,
): Promise<Questline> {
  const response = await fetch(`${API_BASE_URL}/questlines`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error("Failed to create questline");
  return response.json();
}

export async function deleteQuestline(
  token: string,
  questlineId: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/questlines/${questlineId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete questline");
}

export async function registerUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Registration failed");
  return data;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function fetchNodes(
  token: string,
  questlineId: string,
): Promise<ApiNode[]> {
  const response = await fetch(
    `${API_BASE_URL}/questlines/${questlineId}/nodes`,
    { headers: authHeaders(token) },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch nodes: ${response.status}`);
  }
  return response.json();
}

export async function fetchEdges(
  token: string,
  questlineId: string,
): Promise<ApiEdge[]> {
  const response = await fetch(
    `${API_BASE_URL}/questlines/${questlineId}/edges`,
    { headers: authHeaders(token) },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch edges: ${response.status}`);
  }
  return response.json();
}

export interface ValidationReport {
  totalNodes: number;
  totalEdges: number;
  orphanedNodes: { id: string; label: string }[];
  deadEndNodes: { id: string; label: string }[];
  cycles: { id: string; label: string }[][];
  isValid: boolean;
}

export async function runValidation(
  token: string,
  questlineId: string,
): Promise<ValidationReport> {
  const response = await fetch(
    `${API_BASE_URL}/questlines/${questlineId}/validate`,
    { headers: authHeaders(token) },
  );
  if (!response.ok) {
    throw new Error(`Failed to run validation: ${response.status}`);
  }
  return response.json();
}

export async function saveNodePositions(
  token: string,
  questlineId: string,
  positions: { id: string; position_x: number; position_y: number }[],
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/questlines/${questlineId}/nodes/positions`,
    {
      method: "PUT",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ positions }),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to save layout");
  }
}
