import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "reactflow";
import {
  fetchNodes,
  fetchEdges,
  runValidation,
  type ApiEdge,
  type ValidationReport,
} from "./api";

type NodeStatus =
  | "completed"
  | "available"
  | "locked"
  | "missing-prerequisites";

function computeNodeStatus(
  nodeId: string,
  completedNodeIds: Set<string>,
  apiEdges: {
    from_node_id: string;
    to_node_id: string;
    condition_type: string;
  }[],
): NodeStatus {
  if (completedNodeIds.has(nodeId)) {
    return "completed";
  }

  const incomingEdges = apiEdges.filter((e) => e.to_node_id === nodeId);

  if (incomingEdges.length === 0) {
    return "available";
  }

  const hardRequirements = incomingEdges.filter(
    (e) => e.condition_type === "hard_requirement",
  );
  const oneOfManyOptions = incomingEdges.filter(
    (e) => e.condition_type === "one_of_many",
  );

  const allHardRequirementsMet = hardRequirements.every((e) =>
    completedNodeIds.has(e.from_node_id),
  );

  const oneOfManyMet =
    oneOfManyOptions.length === 0 ||
    oneOfManyOptions.some((e) => completedNodeIds.has(e.from_node_id));

  if (allHardRequirementsMet && oneOfManyMet) {
    return "available";
  }

  return "missing-prerequisites";
}

function App() {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [playtestMode, setPlaytestMode] = useState(false);
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(
    new Set(),
  );
  const [validationReport, setValidationReport] =
    useState<ValidationReport | null>(null);
  const [rawEdges, setRawEdges] = useState<ApiEdge[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchNodes(), fetchEdges()])
      .then(([apiNodes, apiEdges]) => {
        const positionedNodes: Node[] = apiNodes.map((n, index) => ({
          id: n.id,
          data: { label: n.label },
          position: { x: index * 220, y: 100 },
        }));

        const transformedEdges: Edge[] = apiEdges.map((e) => ({
          id: e.id,
          source: e.from_node_id,
          target: e.to_node_id,
          animated: e.condition_type === "one_of_many",
        }));

        setFlowNodes(positionedNodes);
        setFlowEdges(transformedEdges);
        setRawEdges(apiEdges);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!playtestMode || rawEdges.length === 0) return;

    setFlowNodes((currentNodes) =>
      currentNodes.map((node) => {
        const status = computeNodeStatus(node.id, completedNodeIds, rawEdges);

        const statusColors: Record<NodeStatus, string> = {
          completed: "#888888",
          available: "#4ade80",
          locked: "#f87171",
          "missing-prerequisites": "#fde047",
        };

        return {
          ...node,
          style: {
            ...node.style,
            background: statusColors[status],
            border: "1px solid #333",
          },
        };
      }),
    );
  }, [playtestMode, completedNodeIds, rawEdges, setFlowNodes]);

  function handleNodeClick(_event: React.MouseEvent, node: Node) {
    if (!playtestMode) return;

    setCompletedNodeIds((current) => {
      const updated = new Set(current);
      if (updated.has(node.id)) {
        updated.delete(node.id);
      } else {
        updated.add(node.id);
      }
      return updated;
    });
  }

  async function handleRunValidation() {
    try {
      const report = await runValidation();
      setValidationReport(report);
    } catch (err) {
      console.error(err);
    }
  }

  if (error) {
    return <div>Error loading graph: {error}</div>;
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          background: "white",
          padding: "8px 12px",
          borderRadius: 6,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={playtestMode}
            onChange={(e) => setPlaytestMode(e.target.checked)}
          />{" "}
          Playtest Mode
        </label>
        {playtestMode && (
          <button
            style={{ marginLeft: 12 }}
            onClick={() => setCompletedNodeIds(new Set())}
          >
            Reset Playtest
          </button>
        )}
        <button style={{ marginLeft: 12 }} onClick={handleRunValidation}>
          Run Validation
        </button>

        {validationReport && (
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <strong>
              {validationReport.isValid ? "✅ Valid" : "❌ Issues found"}
            </strong>
            <div>Orphaned: {validationReport.orphanedNodes.length}</div>
            <div>Dead ends: {validationReport.deadEndNodes.length}</div>
            <div>Cycles: {validationReport.cycles.length}</div>
          </div>
        )}
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default App;
