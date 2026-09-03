import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchQuestlines,
  createQuestline,
  deleteQuestline,
  type Questline,
} from "./api";

interface QuestlineListProps {
  onSelect: (questlineId: string) => void;
}

export function QuestlineList({ onSelect }: QuestlineListProps) {
  const { token, logout } = useAuth();
  const [questlines, setQuestlines] = useState<Questline[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchQuestlines(token)
      .then(setQuestlines)
      .catch((err) => setError(err.message));
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || newName.trim().length === 0) return;
    try {
      const created = await createQuestline(token, newName.trim());
      setQuestlines((current) => [created, ...current]);
      setNewName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create questline",
      );
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    if (!confirm("Delete this questline? This cannot be undone.")) return;
    try {
      await deleteQuestline(token, id);
      setQuestlines((current) => current.filter((q) => q.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete questline",
      );
    }
  }

  return (
    <div
      style={{ maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>My Questlines</h2>
        <button onClick={logout}>Log Out</button>
      </div>

      <form
        onSubmit={handleCreate}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          type="text"
          placeholder="New questline name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Create</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {questlines.map((q) => (
          <li
            key={q.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            <span style={{ cursor: "pointer" }} onClick={() => onSelect(q.id)}>
              {q.name}
            </span>
            <button onClick={() => handleDelete(q.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
