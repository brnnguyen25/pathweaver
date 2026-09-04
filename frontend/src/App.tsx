import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { AuthForm } from "./AuthForm";
import { QuestlineList } from "./QuestlineList";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeChange,
} from "reactflow";
import { NodePropertyPanel } from "./NodePropertyPanel";
import {
  fetchNodes,
  fetchEdges,
  runValidation,
  saveNodePositions,
  createNode,
  updateNode,
  deleteNode,
  createEdge,
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
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<{
    label: string;
  }>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<
    Record<string, unknown>
  >([]);
  const [playtestMode, setPlaytestMode] = useState(false);
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(
    new Set(),
  );
  const [validationReport, setValidationReport] =
    useState<ValidationReport | null>(null);
  const [rawEdges, setRawEdges] = useState<ApiEdge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestlineId, setSelectedQuestlineId] = useState<string | null>(
    null,
  );
  const { user, token, logout } = useAuth();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !selectedQuestlineId) return;

    Promise.all([
      fetchNodes(token, selectedQuestlineId),
      fetchEdges(token, selectedQuestlineId),
    ])
      .then(([apiNodes, apiEdges]) => {
        const positionedNodes: Node[] = apiNodes.map((n) => ({
          id: n.id,
          data: { label: n.label },
          position: { x: n.position_x, y: n.position_y },
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
  }, [token, selectedQuestlineId]);

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
    if (playtestMode) {
      setCompletedNodeIds((current) => {
        const updated = new Set(current);
        if (updated.has(node.id)) {
          updated.delete(node.id);
        } else {
          updated.add(node.id);
        }
        return updated;
      });
    } else {
      setEditingNodeId(node.id);
    }
  }

  function handleNodesChange(changes: NodeChange[]) {
    onNodesChange(changes);
    const hasPositionChange = changes.some((c) => c.type === "position");
    if (hasPositionChange) {
      setHasUnsavedChanges(true);
    }
  }

  async function handleSaveLayout() {
    if (!token || !selectedQuestlineId) return;

    const positions = flowNodes.map((node) => ({
      id: node.id,
      position_x: node.position.x,
      position_y: node.position.y,
    }));

    try {
      await saveNodePositions(token, selectedQuestlineId, positions);
      setHasUnsavedChanges(false);
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus("Failed to save");
    }
  }

  async function handleAddNode() {
    if (!token || !selectedQuestlineId) return;
    try {
      const newNode = await createNode(
        token,
        selectedQuestlineId,
        "New Node",
        300,
        300,
      );
      setFlowNodes((current) => [
        ...current,
        {
          id: newNode.id,
          data: { label: newNode.label },
          position: { x: newNode.position_x, y: newNode.position_y },
        },
      ]);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleConnect(connection: {
    source: string | null;
    target: string | null;
  }) {
    if (
      !token ||
      !selectedQuestlineId ||
      !connection.source ||
      !connection.target
    )
      return;

    try {
      const newEdge = await createEdge(
        token,
        selectedQuestlineId,
        connection.source,
        connection.target,
        "hard_requirement",
      );
      setFlowEdges((current) => [
        ...current,
        {
          id: newEdge.id,
          source: newEdge.from_node_id,
          target: newEdge.to_node_id,
        },
      ]);
      setRawEdges((current) => [...current, newEdge]);
    } catch (err) {
      console.error(err);
    }
  }
  async function handleSaveNode(updates: {
    label: string;
    node_type: string;
    properties: Record<string, unknown>;
  }) {
    if (!token || !selectedQuestlineId || !editingNodeId) return;
    try {
      await updateNode(token, selectedQuestlineId, editingNodeId, updates);
      setFlowNodes((current) =>
        current.map((n) =>
          n.id === editingNodeId ? { ...n, data: { label: updates.label } } : n,
        ),
      );
      setEditingNodeId(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteNode() {
    if (!token || !selectedQuestlineId || !editingNodeId) return;
    if (!confirm("Delete this node? Connected edges will also be removed."))
      return;
    try {
      await deleteNode(token, selectedQuestlineId, editingNodeId);
      setFlowNodes((current) => current.filter((n) => n.id !== editingNodeId));
      setFlowEdges((current) =>
        current.filter(
          (e) => e.source !== editingNodeId && e.target !== editingNodeId,
        ),
      );
      setEditingNodeId(null);
    } catch (err) {
      console.error(err);
    }
  }
  async function handleRunValidation() {
    if (!token || !selectedQuestlineId) return;
    try {
      const report = await runValidation(token, selectedQuestlineId);
      setValidationReport(report);
    } catch (err) {
      console.error(err);
    }
  }

  if (!user) {
    return <AuthForm />;
  }

  if (!selectedQuestlineId) {
    return <QuestlineList onSelect={setSelectedQuestlineId} />;
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
        <button style={{ marginLeft: 12 }} onClick={handleAddNode}>
          + Add Node
        </button>
        <button style={{ marginLeft: 12 }} onClick={handleRunValidation}>
          Run Validation
        </button>
        <button
          style={{
            marginLeft: 12,
            fontWeight: hasUnsavedChanges ? "bold" : "normal",
            background: hasUnsavedChanges ? "#fde047" : undefined,
          }}
          onClick={handleSaveLayout}
        >
          {hasUnsavedChanges ? "Save*" : "Save"}
        </button>
        {saveStatus && <span style={{ marginLeft: 8 }}>{saveStatus}</span>}
        <button
          style={{ marginLeft: 12 }}
          onClick={() =>
            window.open(
              `http://localhost:3001/api/questlines/${selectedQuestlineId}/export/json`,
              "_blank",
            )
          }
        >
          Export JSON
        </button>
        <button
          style={{ marginLeft: 12 }}
          onClick={() =>
            window.open(
              `http://localhost:3001/api/questlines/${selectedQuestlineId}/export/xml`,
              "_blank",
            )
          }
        >
          Export XML
        </button>
        <button
          style={{ marginLeft: 12 }}
          onClick={() => setSelectedQuestlineId(null)}
        >
          Back to Questlines
        </button>
        <button style={{ marginLeft: 12 }} onClick={logout}>
          Log Out ({user.email})
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
      {editingNodeId && (
        <NodePropertyPanel
          nodeId={editingNodeId}
          initialLabel={
            flowNodes.find((n) => n.id === editingNodeId)?.data.label ?? ""
          }
          initialType="required"
          initialProperties={{}}
          onSave={handleSaveNode}
          onDelete={handleDeleteNode}
          onClose={() => setEditingNodeId(null)}
        />
      )}
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onConnect={handleConnect}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default App;
