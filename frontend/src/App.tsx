import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "reactflow";
import { fetchNodes, fetchEdges } from "./api";

function App() {
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchNodes(), fetchEdges()])
      .then(([apiNodes, apiEdges]) => {
        // React Flow needs an x/y position per node.
        // We don't have real layout logic yet (that's a later module) —
        // for now, space them out in a simple horizontal row so you can see them.
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
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div>Error loading graph: {error}</div>;
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default App;
