import { useState, useEffect } from "react";

interface NodePropertyPanelProps {
  nodeId: string;
  initialLabel: string;
  initialType: string;
  initialProperties: Record<string, unknown>;
  onSave: (updates: {
    label: string;
    node_type: string;
    properties: Record<string, unknown>;
  }) => void;
  onDelete: () => void;
  onClose: () => void;
}

const NODE_TYPES = [
  "required",
  "optional",
  "mutually_exclusive",
  "time_sensitive",
];

export function NodePropertyPanel({
  initialLabel,
  initialType,
  initialProperties,
  onSave,
  onDelete,
  onClose,
}: NodePropertyPanelProps) {
  const [label, setLabel] = useState(initialLabel);
  const [nodeType, setNodeType] = useState(initialType);
  const [propertiesText, setPropertiesText] = useState(
    JSON.stringify(initialProperties, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setLabel(initialLabel);
    setNodeType(initialType);
    setPropertiesText(JSON.stringify(initialProperties, null, 2));
  }, [initialLabel, initialType, initialProperties]);

  function handleSave() {
    let parsedProperties: Record<string, unknown>;
    try {
      parsedProperties = JSON.parse(propertiesText);
    } catch {
      setJsonError("Properties must be valid JSON");
      return;
    }
    setJsonError(null);
    onSave({ label, node_type: nodeType, properties: parsedProperties });
  }

  return (
    <div
      className="ledger-panel"
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 10,
        background: "var(--parchment)",
        color: "var(--charcoal)",
        padding: 20,
        borderRadius: 2,
        borderLeft: "4px solid var(--ember)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
        width: 280,
        fontFamily: "var(--font-ui)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <strong style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
          Edit Quest Node
        </strong>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", fontSize: 16 }}
        >
          ✕
        </button>
      </div>

      <label style={{ display: "block", marginTop: 14, fontSize: 13 }}>
        Label
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginTop: 4,
            border: "1px solid #C9BFA6",
            borderRadius: 2,
            background: "#FFFDF8",
          }}
        />
      </label>

      <label style={{ display: "block", marginTop: 14, fontSize: 13 }}>
        Type
        <select
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginTop: 4,
            border: "1px solid #C9BFA6",
            borderRadius: 2,
            background: "#FFFDF8",
          }}
        >
          {NODE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "block", marginTop: 14, fontSize: 13 }}>
        Properties (JSON)
        <textarea
          value={propertiesText}
          onChange={(e) => setPropertiesText(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            padding: 8,
            marginTop: 4,
            fontFamily: "monospace",
            border: "1px solid #C9BFA6",
            borderRadius: 2,
            background: "#FFFDF8",
          }}
        />
      </label>
      {jsonError && (
        <p style={{ color: "var(--danger)", fontSize: 12 }}>{jsonError}</p>
      )}

      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 14px",
            background: "var(--ember)",
            color: "var(--parchment)",
            border: "none",
            borderRadius: 2,
          }}
        >
          Save
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: "8px 14px",
            background: "none",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
            borderRadius: 2,
          }}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
