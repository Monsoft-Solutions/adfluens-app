/**
 * Flow Editor Component
 *
 * Visual node-based flow editor using @xyflow/react
 */

import { useState, useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button, Input, Label, Switch } from "@repo/ui";
import { Save, ArrowLeft, Zap, Loader2, CircleCheck, X } from "lucide-react";
import { nodeTypes } from "./nodes";
import { NodePalette, PALETTE_ITEMS } from "./node-palette.component";
import {
  MessageNodeFields,
  QuickRepliesNodeFields,
  CollectInputNodeFields,
  ConditionNodeFields,
  HandoffNodeFields,
  DelayNodeFields,
  EntryNodeFields,
  HttpRequestNodeFields,
  SetVariableNodeFields,
  GotoNodeFields,
} from "./fields";
import type {
  FlowEditorProps,
  FlowEditorNode,
  FlowEditorEdge,
  FlowNodeData,
  FlowNodeType,
  ApiFlowNode,
  FlowTrigger,
} from "./flow-editor.types";

// ============================================================================
// Helpers
// ============================================================================

let nodeIdCounter = 0;

function generateNodeId(): string {
  return `node-${++nodeIdCounter}-${Date.now()}`;
}

function convertApiToEditorNodes(
  apiNodes: ApiFlowNode[],
  onDelete: (nodeId: string) => void
): { nodes: FlowEditorNode[]; edges: FlowEditorEdge[] } {
  const nodes: FlowEditorNode[] = apiNodes.map((apiNode, index) => {
    // Determine visual node type from API node
    let nodeType: FlowNodeType = "message";
    if (apiNode.type === "entry") nodeType = "entry";
    else if (apiNode.type === "condition") nodeType = "condition";
    else if (apiNode.type === "ai_node") nodeType = "ai-response";
    else if (apiNode.actions[0]?.type === "send_quick_replies")
      nodeType = "quick-replies";
    else if (apiNode.actions[0]?.type === "collect_input")
      nodeType = "collect-input";
    else if (apiNode.actions[0]?.type === "handoff") nodeType = "handoff";
    else if (apiNode.actions[0]?.type === "delay") nodeType = "delay";

    return {
      id: apiNode.id,
      type: nodeType,
      position: apiNode.position || { x: 250, y: index * 150 },
      data: {
        name: apiNode.name,
        nodeType,
        actions: apiNode.actions,
        triggers: apiNode.triggers,
        conditions: apiNode.conditions,
        onDelete,
      },
    };
  });

  const edges: FlowEditorEdge[] = apiNodes.flatMap((apiNode) =>
    (apiNode.nextNodes || []).map((targetId, i) => ({
      id: `${apiNode.id}-${targetId}`,
      source: apiNode.id,
      target: targetId,
      sourceHandle:
        apiNode.type === "condition" ? (i === 0 ? "true" : "false") : undefined,
      animated: true,
      style: { strokeWidth: 2 },
    }))
  );

  return { nodes, edges };
}

function convertEditorToApiNodes(
  nodes: FlowEditorNode[],
  edges: FlowEditorEdge[]
): ApiFlowNode[] {
  return nodes.map((node) => {
    const outgoingEdges = edges.filter((e) => e.source === node.id);
    const nextNodes = outgoingEdges.map((e) => e.target);

    // Map visual node type to API type
    let apiType: ApiFlowNode["type"] = "message";
    if (node.type === "entry") apiType = "entry";
    else if (node.type === "condition") apiType = "condition";
    else if (node.type === "ai-response") apiType = "ai_node";
    else if (node.type === "handoff") apiType = "action";
    else if (node.type === "delay") apiType = "action";

    return {
      id: node.id,
      name: node.data.name,
      type: apiType,
      actions: node.data.actions,
      triggers: node.data.triggers,
      conditions: node.data.conditions,
      nextNodes,
      position: node.position,
    };
  });
}

// ============================================================================
// Component
// ============================================================================

function FlowEditorInner({
  initialNodes,
  initialTriggers,
  initialName,
  initialDescription,
  isActive: initialIsActive,
  onSave,
  onCancel,
}: FlowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Flow metadata
  const [flowName, setFlowName] = useState(initialName || "");
  const [flowDescription] = useState(initialDescription || "");
  const [triggerKeywords, setTriggerKeywords] = useState(
    initialTriggers?.map((t) => t.value).join(", ") || ""
  );
  const [isActive, setIsActive] = useState(initialIsActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  // Selected node for editing
  const [selectedNode, setSelectedNode] = useState<FlowEditorNode | null>(null);

  // Handle node deletion
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
    setSelectedNode(null);
  }, []);

  // Initialize nodes and edges
  const initialData = useMemo(() => {
    if (initialNodes && initialNodes.length > 0) {
      return convertApiToEditorNodes(initialNodes, handleDeleteNode);
    }
    // Default: single entry node
    const entryNode: FlowEditorNode = {
      id: "entry",
      type: "entry",
      position: { x: 250, y: 50 },
      data: {
        name: "Start",
        nodeType: "entry",
        actions: [],
        triggers: [],
        onDelete: handleDeleteNode,
      },
    };
    return { nodes: [entryNode], edges: [] };
  }, [initialNodes, handleDeleteNode]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowEditorNode>(
    initialData.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEditorEdge>(
    initialData.edges
  );

  // Handle connections
  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { strokeWidth: 2 } }, eds)
      );
    },
    [setEdges]
  );

  // Handle drag over for palette items
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop for palette items
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData(
        "application/reactflow"
      ) as FlowNodeType;

      if (!nodeType) return;

      // Get the palette item for default data
      const paletteItem = PALETTE_ITEMS.find((item) => item.type === nodeType);
      if (!paletteItem) return;

      // Get position from drop location
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 128, // Center the node
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newNode: FlowEditorNode = {
        id: generateNodeId(),
        type: nodeType,
        position,
        data: {
          ...paletteItem.defaultData,
          onDelete: handleDeleteNode,
        } as FlowNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, handleDeleteNode]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowEditorNode) => {
      setSelectedNode(node);
    },
    []
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update node data
  const updateNodeData = useCallback(
    (nodeId: string, updates: Partial<FlowNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
        )
      );
      // Update selected node too
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, ...updates } } : null
        );
      }
    },
    [setNodes, selectedNode]
  );

  // Handle save
  const handleSave = useCallback(() => {
    if (!flowName.trim()) return;

    setIsSaving(true);

    const apiNodes = convertEditorToApiNodes(nodes, edges);
    const entryNode = apiNodes.find((n) => n.type === "entry");

    // Parse trigger keywords
    const keywords = triggerKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const globalTriggers: FlowTrigger[] = keywords.map((k) => ({
      type: "keyword" as const,
      value: k,
      matchMode: "contains" as const,
    }));

    // Pass completion callback to reset loading state and show saved indicator
    onSave(
      {
        name: flowName,
        description: flowDescription || undefined,
        nodes: apiNodes,
        entryNodeId: entryNode?.id || "entry",
        globalTriggers,
        isActive,
      },
      () => {
        setIsSaving(false);
        setShowSavedIndicator(true);
        setTimeout(() => setShowSavedIndicator(false), 2000);
      }
    );
  }, [
    flowName,
    flowDescription,
    nodes,
    edges,
    triggerKeywords,
    isActive,
    onSave,
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        {/* Left: Back button + Flow name */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Flows
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <Input
              placeholder="Flow name..."
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="w-48 h-8 font-medium"
            />
          </div>
        </div>

        {/* Center: Triggers */}
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Triggers:</Label>
          <Input
            placeholder="hello, start, help"
            value={triggerKeywords}
            onChange={(e) => setTriggerKeywords(e.target.value)}
            className="w-64 h-8"
          />
        </div>

        {/* Right: Status + Active toggle + Save */}
        <div className="flex items-center gap-3">
          {/* Saved indicator */}
          {showSavedIndicator && (
            <span className="text-sm text-muted-foreground flex items-center gap-1 animate-in fade-in duration-200">
              <CircleCheck className="w-4 h-4 text-green-500" />
              Saved
            </span>
          )}

          <div className="flex items-center gap-2">
            <Label className="text-sm">Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!flowName.trim() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <NodePalette
          onDragStart={(event, nodeType) => {
            event.dataTransfer.setData("application/reactflow", nodeType);
            event.dataTransfer.effectAllowed = "move";
          }}
        />

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            snapToGrid
            snapGrid={[15, 15]}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            attributionPosition="bottom-left"
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="!bg-muted/50"
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={15}
              size={1}
              className="!bg-background"
            />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <NodePropertiesPanel
            node={selectedNode}
            nodes={nodes}
            onUpdate={(updates) => updateNodeData(selectedNode.id, updates)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Properties Panel
// ============================================================================

type NodePropertiesPanelProps = {
  node: FlowEditorNode;
  nodes: FlowEditorNode[];
  onUpdate: (updates: Partial<FlowNodeData>) => void;
  onClose: () => void;
};

function NodePropertiesPanel({
  node,
  nodes,
  onUpdate,
  onClose,
}: NodePropertiesPanelProps) {
  const { data, type } = node;

  return (
    <div className="w-72 overflow-y-auto border-l border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Node Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>

        {/* Type-specific fields */}
        {type === "message" && (
          <MessageNodeFields data={data} onUpdate={onUpdate} nodes={nodes} />
        )}
        {type === "quick-replies" && (
          <QuickRepliesNodeFields
            data={data}
            onUpdate={onUpdate}
            nodes={nodes}
          />
        )}
        {type === "collect-input" && (
          <CollectInputNodeFields
            data={data}
            onUpdate={onUpdate}
            nodes={nodes}
          />
        )}
        {type === "condition" && (
          <ConditionNodeFields data={data} onUpdate={onUpdate} nodes={nodes} />
        )}
        {type === "handoff" && (
          <HandoffNodeFields data={data} onUpdate={onUpdate} nodes={nodes} />
        )}
        {type === "delay" && (
          <DelayNodeFields data={data} onUpdate={onUpdate} nodes={nodes} />
        )}
        {type === "http-request" && (
          <HttpRequestNodeFields
            data={data}
            onUpdate={onUpdate}
            nodes={nodes}
          />
        )}
        {type === "set-variable" && (
          <SetVariableNodeFields
            data={data}
            onUpdate={onUpdate}
            nodes={nodes}
          />
        )}
        {type === "goto" && (
          <GotoNodeFields data={data} onUpdate={onUpdate} nodes={nodes} />
        )}
        {type === "entry" && <EntryNodeFields />}
      </div>
    </div>
  );
}

// ============================================================================
// Export with Provider
// ============================================================================

export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
