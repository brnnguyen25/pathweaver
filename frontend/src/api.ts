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
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
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

export interface ValidationReport {
  totalNodes: number;
  totalEdges: number;
  orphanedNodes: { id: string; label: string }[];
  deadEndNodes: { id: string; label: string }[];
  cycles: { id: string; label: string }[][];
  isValid: boolean;
}

export async function runValidation(): Promise<ValidationReport> {
  const response = await fetch(`${API_BASE_URL}/validate`);
  if (!response.ok) {
    throw new Error(`Failed to run validation: ${response.status}`);
  }
  return response.json();
}
