import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchQuestlines,
  createQuestline,
  deleteQuestline,
  importQuestline,
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
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed.nodes)) {
        throw new Error(
          "This file doesn't look like a valid Pathweaver export",
        );
      }

      const importName = parsed.questlineName
        ? `${parsed.questlineName} (Imported)`
        : "Imported Questline";

      const result = await importQuestline(token, importName, parsed.nodes);
      setQuestlines((current) => [
        {
          id: result.questlineId,
          name: importName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...current,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file");
    } finally {
      e.target.value = ""; // reset so the same file can be re-selected later if needed
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
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        padding: "60px 24px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 32,
          }}
        >
          <h1 style={{ color: "var(--parchment)", fontSize: 32 }}>
            Your Campaigns
          </h1>
          <button
            onClick={logout}
            style={{
              background: "none",
              border: "none",
              color: "var(--threadgold)",
              textDecoration: "underline",
            }}
          >
            Log out
          </button>
        </div>

        <form
          onSubmit={handleCreate}
          style={{ display: "flex", gap: 8, marginBottom: 12 }}
        >
          <input
            type="text"
            placeholder="Name a new campaign"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              flex: 1,
              padding: 10,
              border: "1px solid var(--ink-raised)",
              borderRadius: 2,
              background: "var(--ink-raised)",
              color: "var(--parchment)",
              fontFamily: "var(--font-ui)",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 18px",
              background: "var(--ember)",
              color: "var(--parchment)",
              border: "none",
              borderRadius: 2,
            }}
          >
            Start
          </button>
        </form>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: "var(--parchment-dim)", fontSize: 14 }}>
            Import from file:{" "}
            <input type="file" accept=".json" onChange={handleImportFile} />
          </label>
        </div>

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

        {questlines.length === 0 ? (
          <p style={{ color: "var(--parchment-dim)", fontStyle: "italic" }}>
            No campaigns yet. Start one above, or import a saved questline.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {questlines.map((q) => (
              <li
                key={q.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 18px",
                  background: "var(--parchment)",
                  borderLeft: "4px solid var(--verdigris)",
                  marginBottom: 10,
                  borderRadius: 2,
                }}
              >
                <span
                  onClick={() => onSelect(q.id)}
                  style={{
                    cursor: "pointer",
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                  }}
                >
                  {q.name}
                </span>
                <button
                  onClick={() => handleDelete(q.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--danger)",
                    fontSize: 13,
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
