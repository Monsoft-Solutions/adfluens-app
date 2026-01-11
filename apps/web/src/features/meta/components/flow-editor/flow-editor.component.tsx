/**
 * Flow Editor Component
 *
 *  TODO: Decompose this component, it's too big and complex.
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
import {
  Button,
  Input,
  Label,
  Textarea,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@repo/ui";
import { Save, ArrowLeft, Zap, Loader2, CircleCheck, X } from "lucide-react";
import { nodeTypes } from "./nodes";
import { NodePalette, PALETTE_ITEMS } from "./node-palette.component";
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
  onUpdate: (updates: Partial<FlowNodeData>) => void;
  onClose: () => void;
};

function NodePropertiesPanel({
  node,
  onUpdate,
  onClose,
}: NodePropertiesPanelProps) {
  const { data, type } = node;

  return (
    <div className="w-72 bg-card border-l border-border p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Node Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
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
          <MessageNodeFields data={data} onUpdate={onUpdate} />
        )}
        {type === "quick-replies" && (
          <QuickRepliesNodeFields data={data} onUpdate={onUpdate} />
        )}
        {type === "collect-input" && (
          <CollectInputNodeFields data={data} onUpdate={onUpdate} />
        )}
        {type === "condition" && (
          <ConditionNodeFields data={data} onUpdate={onUpdate} />
        )}
        {type === "handoff" && (
          <HandoffNodeFields data={data} onUpdate={onUpdate} />
        )}
        {type === "delay" && (
          <DelayNodeFields data={data} onUpdate={onUpdate} />
        )}
        {type === "entry" && (
          <EntryNodeFields _data={data} _onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Node-specific Field Components
// ============================================================================

function MessageNodeFields({
  data,
  onUpdate,
}: {
  data: FlowNodeData;
  onUpdate: (updates: Partial<FlowNodeData>) => void;
}) {
  const message = (data.actions[0]?.config?.message as string) || "";

  return (
    <div className="space-y-2">
      <Label>Message</Label>
      <Textarea
        rows={4}
        value={message}
        onChange={(e) =>
          onUpdate({
            actions: [
              { type: "send_message", config: { message: e.target.value } },
            ],
          })
        }
        placeholder="Enter your message..."
      />
    </div>
  );
}

function QuickRepliesNodeFields({
  data,
  onUpdate,
}: {
  data: FlowNodeData;
  onUpdate: (updates: Partial<FlowNodeData>) => void;
}) {
  const action = data.actions[0];
  const message = (action?.config?.message as string) || "";
  const replies = (action?.config?.replies as string[]) || [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          rows={3}
          value={message}
          onChange={(e) =>
            onUpdate({
              actions: [
                {
                  type: "send_quick_replies",
                  config: { message: e.target.value, replies },
                },
              ],
            })
          }
          placeholder="Enter your message..."
        />
      </div>
      <div className="space-y-2">
        <Label>Button Options (comma-separated)</Label>
        <Input
          value={replies.join(", ")}
          onChange={(e) =>
            onUpdate({
              actions: [
                {
                  type: "send_quick_replies",
                  config: {
                    message,
                    replies: e.target.value.split(",").map((r) => r.trim()),
                  },
                },
              ],
            })
          }
          placeholder="Option 1, Option 2, Option 3"
        />
      </div>
    </div>
  );
}

function CollectInputNodeFields({
  data,
  onUpdate,
}: {
  data: FlowNodeData;
  onUpdate: (updates: Partial<FlowNodeData>) => void;
}) {
  const action = data.actions[0];
  const prompt = (action?.config?.prompt as string) || "";
  const inputName = (action?.config?.inputName as string) || "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Question</Label>
        <Textarea
          rows={3}
          value={prompt}
          onChange={(e) =>
            onUpdate({
              actions: [
                {
                  type: "collect_input",
                  config: { prompt: e.target.value, inputName },
                },
              ],
            })
          }
          placeholder="What question do you want to ask?"
        />
      </div>
      <div className="space-y-2">
        <Label>Save response as</Label>
        <Input
          value={inputName}
          onChange={(e) =>
            onUpdate({
              actions: [
                {
                  type: "collect_input",
                  config: { prompt, inputName: e.target.value },
                },
              ],
            })
          }
          placeholder="variable_name"
          className="font-mono"
        />
      </div>
    </div>
  );
}

function ConditionNodeFields({
  data,
  onUpdate,
}: {
  data: FlowNodeData;
  onUpdate: (updates: Partial<FlowNodeData>) => void;
}) {
  const condition = data.conditions?.[0];
  const expression = condition?.expression || "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Condition</Label>
        <Input
          value={expression}
          onChange={(e) =>
            onUpdate({
              conditions: [
                {
                  expression: e.target.value,
                  targetNodeId: condition?.targetNodeId || "",
                },
              ],
            })
          }
          placeholder="contains:keyword"
        />
        <p className="text-xs text-muted-foreground">
          Formats: contains:word, equals:value, regex:pattern
        </p>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>
          <span className="text-green-500">Green output</span> = condition true
        </p>
        <p>
          <span className="text-red-500">Red output</span> = condition false
        </p>
      </div>
    </div>
  );
}

function HandoffNodeFields({
  data,
  onUpdate,
}: {
  data: FlowNodeData;
  onUpdate: (updates: Partial<FlowNodeData>) => void;
}) {
  const reason = (data.actions[0]?.config?.reason as string) || "";

  return (
    <div className="space-y-2">
      <Label>Handoff Reason</Label>
      <Input
        value={reason}
        onChange={(e) =>
          onUpdate({
            actions: [{ type: "handoff", config: { reason: e.target.value } }],
          })
        }
        placeholder="Why are you handing off?"
      />
    </div>
  );
}

function DelayNodeFields({
  data,
  onUpdate,
}: {
  data: FlowNodeData;
  onUpdate: (updates: Partial<FlowNodeData>) => void;
}) {
  const action = data.actions[0];
  const amount = (action?.config?.delayAmount as number) || 1;
  const unit = (action?.config?.delayUnit as string) || "days";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wait for</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) =>
              onUpdate({
                actions: [
                  {
                    type: "delay",
                    config: {
                      delayAmount: parseInt(e.target.value) || 1,
                      delayUnit: unit,
                    },
                  },
                ],
              })
            }
            className="w-20"
          />
          <Select
            value={unit}
            onValueChange={(value) =>
              onUpdate({
                actions: [
                  {
                    type: "delay",
                    config: { delayAmount: amount, delayUnit: value },
                  },
                ],
              })
            }
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>The flow will pause and continue after this time.</p>
        <p className="mt-1">
          If the user sends a message during the wait, the delay is cancelled.
        </p>
      </div>
    </div>
  );
}

function EntryNodeFields({
  _data,
  _onUpdate,
}: {
  _data: FlowNodeData;
  _onUpdate: (updates: Partial<FlowNodeData>) => void;
}) {
  return (
    <div className="text-sm text-muted-foreground">
      <p>This is the starting point of your flow.</p>
      <p className="mt-2">Trigger keywords are set in the toolbar above.</p>
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
