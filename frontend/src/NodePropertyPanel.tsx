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
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 10,
        background: "white",
        padding: 16,
        borderRadius: 6,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        width: 280,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Edit Node</strong>
        <button onClick={onClose}>✕</button>
      </div>

      <label style={{ display: "block", marginTop: 12 }}>
        Label
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{ width: "100%", padding: 6, marginTop: 4 }}
        />
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Type
        <select
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value)}
          style={{ width: "100%", padding: 6, marginTop: 4 }}
        >
          {NODE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Properties (JSON)
        <textarea
          value={propertiesText}
          onChange={(e) => setPropertiesText(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            padding: 6,
            marginTop: 4,
            fontFamily: "monospace",
          }}
        />
      </label>
      {jsonError && <p style={{ color: "red", fontSize: 12 }}>{jsonError}</p>}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={handleSave}>Save</button>
        <button onClick={onDelete} style={{ color: "red" }}>
          Delete Node
        </button>
      </div>
    </div>
  );
}
