/**
 * Node Palette Component
 *
 * Sidebar with draggable node types for the flow editor
 */

import {
  MessageSquare,
  MousePointer2,
  TextCursorInput,
  GitBranch,
  Sparkles,
  UserCheck,
  Clock,
  Globe,
  Variable,
  CornerDownRight,
} from "lucide-react";
import { Card, cn } from "@repo/ui";
import type { FlowNodeType, NodePaletteItem } from "./flow-editor.types";

// ============================================================================
// Palette Items
// ============================================================================

const PALETTE_ITEMS: NodePaletteItem[] = [
  // Messages
  {
    type: "message",
    label: "Message",
    description: "Send a text message",
    icon: <MessageSquare className="w-4 h-4" />,
    category: "messages",
    defaultData: {
      name: "Send Message",
      nodeType: "message",
      actions: [{ type: "send_message", config: { message: "" } }],
    },
  },
  {
    type: "quick-replies",
    label: "Quick Replies",
    description: "Message with buttons",
    icon: <MousePointer2 className="w-4 h-4" />,
    category: "messages",
    defaultData: {
      name: "Quick Replies",
      nodeType: "quick-replies",
      actions: [
        { type: "send_quick_replies", config: { message: "", replies: [] } },
      ],
    },
  },
  {
    type: "collect-input",
    label: "Collect Input",
    description: "Ask and save response",
    icon: <TextCursorInput className="w-4 h-4" />,
    category: "messages",
    defaultData: {
      name: "Collect Input",
      nodeType: "collect-input",
      actions: [
        { type: "collect_input", config: { inputName: "", prompt: "" } },
      ],
    },
  },
  // Logic
  {
    type: "condition",
    label: "Condition",
    description: "Branch the flow",
    icon: <GitBranch className="w-4 h-4" />,
    category: "logic",
    defaultData: {
      name: "Condition",
      nodeType: "condition",
      actions: [],
      conditions: [{ expression: "contains:", targetNodeId: "" }],
    },
  },
  {
    type: "ai-node",
    label: "AI Node",
    description: "AI-powered operations",
    icon: <Sparkles className="w-4 h-4" />,
    category: "logic",
    defaultData: {
      name: "AI Node",
      nodeType: "ai-node",
      actions: [
        { type: "ai_node", config: { operation: "generate_response" } },
      ],
    },
  },
  {
    type: "delay",
    label: "Wait/Delay",
    description: "Pause before next step",
    icon: <Clock className="w-4 h-4" />,
    category: "logic",
    defaultData: {
      name: "Wait",
      nodeType: "delay",
      actions: [
        { type: "delay", config: { delayAmount: 1, delayUnit: "days" } },
      ],
    },
  },
  {
    type: "set-variable",
    label: "Set Variable",
    description: "Store data for later",
    icon: <Variable className="w-4 h-4" />,
    category: "logic",
    defaultData: {
      name: "Set Variable",
      nodeType: "set-variable",
      actions: [
        { type: "set_variable", config: { variableName: "", value: "" } },
      ],
    },
  },
  {
    type: "goto",
    label: "Go To",
    description: "Jump to another node",
    icon: <CornerDownRight className="w-4 h-4" />,
    category: "logic",
    defaultData: {
      name: "Go To",
      nodeType: "goto",
      actions: [{ type: "goto_node", config: { targetNodeId: "" } }],
    },
  },
  // Actions
  {
    type: "handoff",
    label: "Handoff",
    description: "Transfer to human",
    icon: <UserCheck className="w-4 h-4" />,
    category: "actions",
    defaultData: {
      name: "Handoff",
      nodeType: "handoff",
      actions: [{ type: "handoff", config: { reason: "" } }],
    },
  },
  {
    type: "http-request",
    label: "HTTP Request",
    description: "Call external API",
    icon: <Globe className="w-4 h-4" />,
    category: "actions",
    defaultData: {
      name: "HTTP Request",
      nodeType: "http-request",
      actions: [{ type: "http_request", config: { method: "GET", url: "" } }],
    },
  },
];

// ============================================================================
// Category Colors
// ============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  messages: "bg-blue-500/10 text-blue-500",
  logic: "bg-orange-500/10 text-orange-500",
  actions: "bg-red-500/10 text-red-500",
};

// ============================================================================
// Props
// ============================================================================

type NodePaletteProps = {
  onDragStart: (event: React.DragEvent, nodeType: FlowNodeType) => void;
};

// ============================================================================
// Component
// ============================================================================

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const messageNodes = PALETTE_ITEMS.filter(
    (item) => item.category === "messages"
  );
  const logicNodes = PALETTE_ITEMS.filter((item) => item.category === "logic");
  const actionNodes = PALETTE_ITEMS.filter(
    (item) => item.category === "actions"
  );

  return (
    <div className="w-56 bg-muted/30 border-r border-border p-3 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Node Palette</h3>
        <p className="text-xs text-muted-foreground">
          Drag nodes onto the canvas
        </p>
      </div>

      {/* Messages */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Messages
        </h4>
        <div className="space-y-2">
          {messageNodes.map((item) => (
            <PaletteItem
              key={item.type}
              item={item}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </div>

      {/* Logic */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Logic
        </h4>
        <div className="space-y-2">
          {logicNodes.map((item) => (
            <PaletteItem
              key={item.type}
              item={item}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Actions
        </h4>
        <div className="space-y-2">
          {actionNodes.map((item) => (
            <PaletteItem
              key={item.type}
              item={item}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Palette Item
// ============================================================================

function PaletteItem({
  item,
  onDragStart,
}: {
  item: NodePaletteItem;
  onDragStart: (event: React.DragEvent, nodeType: FlowNodeType) => void;
}) {
  return (
    <Card
      className={cn(
        "p-2 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
      )}
      draggable
      onDragStart={(e) => onDragStart(e, item.type)}
    >
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded", CATEGORY_COLORS[item.category])}>
          {item.icon}
        </div>
        <div>
          <div className="text-sm font-medium">{item.label}</div>
          <div className="text-xs text-muted-foreground">
            {item.description}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Export palette items for use in flow editor
export { PALETTE_ITEMS };
