import { Handle, Position, type NodeProps } from "reactflow";

const TYPE_MARKS: Record<string, string> = {
  required: "●",
  optional: "○",
  mutually_exclusive: "◆",
  time_sensitive: "▲",
};

export function QuestNode({
  data,
  selected,
}: NodeProps<{ label: string; nodeType?: string }>) {
  return (
    <div
      style={{
        background: "var(--node-bg, var(--parchment))",
        color: "var(--charcoal)",
        border: selected ? "2px solid var(--ember)" : "1px solid #C9BFA6",
        borderRadius: 3,
        padding: "10px 16px",
        fontFamily: "var(--font-ui)",
        fontSize: 14,
        minWidth: 140,
        textAlign: "center",
        boxShadow: selected ? "0 0 0 3px rgba(198, 98, 42, 0.2)" : "none",
        transition:
          "box-shadow var(--transition-fast), border-color var(--transition-fast)",
      }}
    >
      <span style={{ color: "var(--verdigris)", marginRight: 6, fontSize: 11 }}>
        {TYPE_MARKS[data.nodeType ?? "required"] ?? "●"}
      </span>
      {data.label}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "var(--ember)", width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "var(--ember)", width: 8, height: 8 }}
      />
    </div>
  );
}
