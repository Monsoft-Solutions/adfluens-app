/**
 * Meta Flows Component
 *
 * Flow management with visual node-based editor
 *
 * Features:
 * - List existing flows with edit/delete/toggle
 * - Quick Response creator (simple single-node flows)
 * - Template gallery for common use cases
 * - Visual flow editor for custom flows
 */

import { useState, useCallback } from "react";
import { useTRPC } from "@/lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Textarea,
  Switch,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  toast,
} from "@repo/ui";
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  MessageSquare,
  GitBranch,
  ClipboardList,
  Calendar,
  HelpCircle,
  ShoppingBag,
  Sparkles,
  UserCheck,
  Edit2,
} from "lucide-react";
import { FlowEditor } from "./flow-editor/flow-editor.component";
import type {
  ApiFlowNode,
  FlowTrigger,
  FlowSaveData,
} from "./flow-editor/flow-editor.types";
import {
  FLOW_TEMPLATES_DATA,
  type FlowTemplate,
} from "../constants/flow-templates.constant";

// ============================================================================
// Types
// ============================================================================

type FlowListItem = {
  id: string;
  name: string;
  description: string | null;
  flowType: string;
  isActive: boolean;
  triggerCount: number;
  completionCount: number;
  createdAt: string;
  updatedAt: string;
  priority: number;
};

// ============================================================================
// Template Icons Mapping
// ============================================================================

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  "lead-qualification": <ClipboardList className="w-6 h-6" />,
  "faq-handler": <HelpCircle className="w-6 h-6" />,
  "appointment-booker": <Calendar className="w-6 h-6" />,
  "support-ticket": <UserCheck className="w-6 h-6" />,
  "product-inquiry": <ShoppingBag className="w-6 h-6" />,
};

/**
 * Builds flow templates with icons for rendering.
 */
const FLOW_TEMPLATES: FlowTemplate[] = FLOW_TEMPLATES_DATA.map((template) => ({
  ...template,
  icon: TEMPLATE_ICONS[template.id] || <Sparkles className="w-6 h-6" />,
}));

// ============================================================================
// Props
// ============================================================================

type MetaFlowsProps = {
  pageId: string;
};

// ============================================================================
// Component
// ============================================================================

export function MetaFlows({ pageId }: MetaFlowsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // State
  const [activeView, setActiveView] = useState<"list" | "templates">("list");
  const [quickResponseOpen, setQuickResponseOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<string | null>(null);

  // Flow Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [editorInitialData, setEditorInitialData] = useState<{
    nodes?: ApiFlowNode[];
    triggers?: FlowTrigger[];
    name?: string;
    description?: string;
    isActive?: boolean;
  } | null>(null);

  // Quick Response Form State
  const [qrKeywords, setQrKeywords] = useState("");
  const [qrMessage, setQrMessage] = useState("");
  const [qrQuickReplies, setQrQuickReplies] = useState("");
  const [qrMatchMode, setQrMatchMode] = useState<
    "contains" | "exact" | "starts_with"
  >("contains");
  const [qrAiFallback, setQrAiFallback] = useState(false);

  // Fetch flows
  const { data: flowsData, isLoading } = useQuery({
    ...trpc.metaBot.listFlows.queryOptions({ pageId }),
    enabled: !!pageId,
  });

  // Fetch single flow for editing
  const { data: flowDetail, isFetching: isFetchingFlow } = useQuery({
    ...trpc.metaBot.getFlow.queryOptions({ flowId: editingFlowId || "" }),
    enabled: !!editingFlowId,
  });

  // Completion callback for resetting editor loading state
  const [saveCompleteCallback, setSaveCompleteCallback] = useState<
    (() => void) | null
  >(null);

  // Mutations
  const createFlowMutation = useMutation(
    trpc.metaBot.createFlow.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.metaBot.listFlows.queryKey({ pageId }),
        });
        resetQuickResponseForm();
        setQuickResponseOpen(false);
        // DON'T close editor - user continues editing
        // Update editingFlowId so subsequent saves become updates
        if (data) {
          setEditingFlowId(data.id);
        }
        toast.success("Flow created");
        saveCompleteCallback?.();
        setSaveCompleteCallback(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to create flow"
        );
        saveCompleteCallback?.();
        setSaveCompleteCallback(null);
      },
    })
  );

  const updateFlowMutation = useMutation(
    trpc.metaBot.updateFlow.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.metaBot.listFlows.queryKey({ pageId }),
        });
        // Also invalidate the individual flow query so re-opening shows fresh data
        if (editingFlowId) {
          queryClient.invalidateQueries({
            queryKey: trpc.metaBot.getFlow.queryKey({ flowId: editingFlowId }),
          });
        }
        // DON'T close editor - user continues editing
        toast.success("Changes saved");
        saveCompleteCallback?.();
        setSaveCompleteCallback(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to save flow"
        );
        saveCompleteCallback?.();
        setSaveCompleteCallback(null);
      },
    })
  );

  const deleteFlowMutation = useMutation(
    trpc.metaBot.deleteFlow.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.metaBot.listFlows.queryKey({ pageId }),
        });
        setDeleteConfirmOpen(false);
        setFlowToDelete(null);
        toast.success("Flow deleted");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete flow"
        );
      },
    })
  );

  // Helpers
  const resetQuickResponseForm = () => {
    setQrKeywords("");
    setQrMessage("");
    setQrQuickReplies("");
    setQrMatchMode("contains");
    setQrAiFallback(false);
  };

  const handleCreateQuickResponse = () => {
    if (!qrKeywords.trim() || !qrMessage.trim()) return;

    const keywords = qrKeywords.split(",").map((k) => k.trim());
    const quickReplies = qrQuickReplies
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const nodes: ApiFlowNode[] = [
      {
        id: "entry",
        name: "Response",
        type: "entry",
        actions:
          quickReplies.length > 0
            ? [
                {
                  type: "send_quick_replies",
                  config: { message: qrMessage, replies: quickReplies },
                },
              ]
            : [{ type: "send_message", config: { message: qrMessage } }],
        nextNodes: qrAiFallback ? ["ai"] : [],
        position: { x: 250, y: 50 },
      },
    ];

    if (qrAiFallback) {
      nodes.push({
        id: "ai",
        name: "AI Fallback",
        type: "ai_node",
        actions: [
          { type: "ai_node", config: { operation: "generate_response" } },
        ],
        nextNodes: [],
        position: { x: 250, y: 200 },
      });
    }

    createFlowMutation.mutate({
      pageId,
      name: `Quick: ${keywords[0]}`,
      description: `Auto-reply for: ${keywords.join(", ")}`,
      flowType: "override",
      nodes,
      entryNodeId: "entry",
      globalTriggers: keywords.map((k) => ({
        type: "keyword" as const,
        value: k,
        matchMode: qrMatchMode,
      })),
      priority: 10,
    });
  };

  const handleEditFlow = useCallback(
    (flowId: string) => {
      // Invalidate the flow query to ensure fresh data when opening
      queryClient.invalidateQueries({
        queryKey: trpc.metaBot.getFlow.queryKey({ flowId }),
      });
      setEditingFlowId(flowId);
    },
    [queryClient, trpc.metaBot.getFlow]
  );

  // When flow detail is loaded, open editor
  const handleOpenEditorWithFlow = useCallback(() => {
    if (flowDetail && editingFlowId) {
      setEditorInitialData({
        nodes: flowDetail.nodes as ApiFlowNode[],
        triggers: (flowDetail.globalTriggers as FlowTrigger[]) || [],
        name: flowDetail.name,
        description: flowDetail.description || undefined,
        isActive: flowDetail.isActive,
      });
      setEditorOpen(true);
    }
  }, [flowDetail, editingFlowId]);

  // Effect to open editor when flow is fetched
  if (flowDetail && editingFlowId && !editorOpen && !editorInitialData) {
    handleOpenEditorWithFlow();
  }

  const handleUseTemplate = (template: FlowTemplate) => {
    setEditingFlowId(null);
    setEditorInitialData({
      nodes: template.nodes,
      triggers: template.globalTriggers,
      name: template.name,
      description: template.description,
      isActive: true,
    });
    setEditorOpen(true);
    setActiveView("list");
  };

  const handleCreateCustomFlow = () => {
    setEditingFlowId(null);
    setEditorInitialData(null);
    setEditorOpen(true);
  };

  const handleToggleActive = (flow: FlowListItem) => {
    updateFlowMutation.mutate({
      flowId: flow.id,
      isActive: !flow.isActive,
    });
  };

  const handleDeleteFlow = () => {
    if (!flowToDelete) return;
    deleteFlowMutation.mutate({ flowId: flowToDelete });
  };

  const handleSaveFlow = (data: FlowSaveData, onComplete?: () => void) => {
    // Store the callback to be called on success or error
    if (onComplete) {
      setSaveCompleteCallback(() => onComplete);
    }

    if (editingFlowId) {
      // Update existing flow
      updateFlowMutation.mutate({
        flowId: editingFlowId,
        name: data.name,
        description: data.description,
        nodes: data.nodes,
        entryNodeId: data.entryNodeId,
        globalTriggers: data.globalTriggers,
        isActive: data.isActive,
      });
    } else {
      // Create new flow
      createFlowMutation.mutate({
        pageId,
        name: data.name,
        description: data.description,
        flowType: "automation",
        nodes: data.nodes,
        entryNodeId: data.entryNodeId,
        globalTriggers: data.globalTriggers,
        priority: 5,
      });
    }
  };

  const handleCancelEditor = () => {
    setEditorOpen(false);
    setEditingFlowId(null);
    setEditorInitialData(null);
  };

  const flows: FlowListItem[] = flowsData ?? [];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Flow Editor (full screen)
  if (editorOpen) {
    return (
      <div className="h-[calc(100vh-200px)] min-h-[600px] border border-border rounded-lg overflow-hidden bg-card">
        <FlowEditor
          flowId={editingFlowId || undefined}
          pageId={pageId}
          initialNodes={editorInitialData?.nodes}
          initialTriggers={editorInitialData?.triggers}
          initialName={editorInitialData?.name}
          initialDescription={editorInitialData?.description}
          isActive={editorInitialData?.isActive}
          onSave={handleSaveFlow}
          onCancel={handleCancelEditor}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Conversation Flows
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automate responses with keyword triggers and conversation flows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveView("templates")}>
            <Sparkles className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button variant="outline" onClick={() => setQuickResponseOpen(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Quick Response
          </Button>
          <Button onClick={handleCreateCustomFlow}>
            <Plus className="w-4 h-4 mr-2" />
            Custom Flow
          </Button>
        </div>
      </div>

      {/* Flow List */}
      {flows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No flows yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Create automated responses for common questions. Start with a
              quick response, use a template, or build a custom flow.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setActiveView("templates")}
              >
                Browse Templates
              </Button>
              <Button onClick={handleCreateCustomFlow}>
                Create Custom Flow
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flows.map((flow) => (
            <Card key={flow.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        flow.isActive
                          ? "bg-green-500/10 text-green-500"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{flow.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {flow.flowType}
                        </Badge>
                        {!flow.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {flow.description && (
                        <p className="text-sm text-muted-foreground">
                          {flow.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Stats */}
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">
                        {flow.triggerCount} triggers
                      </div>
                      <div className="text-muted-foreground">
                        {flow.completionCount} completions
                      </div>
                    </div>

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFlow(flow.id)}
                      disabled={isFetchingFlow && editingFlowId === flow.id}
                    >
                      {isFetchingFlow && editingFlowId === flow.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Edit2 className="w-4 h-4" />
                      )}
                      <span className="ml-1">Edit</span>
                    </Button>

                    {/* Toggle */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={flow.isActive}
                        onCheckedChange={() => handleToggleActive(flow)}
                      />
                    </div>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFlowToDelete(flow.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Response Dialog */}
      <Dialog open={quickResponseOpen} onOpenChange={setQuickResponseOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Add Quick Response
            </DialogTitle>
            <DialogDescription>
              Create a simple auto-reply for specific keywords
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>When message contains:</Label>
              <Input
                placeholder="pricing, price, cost, how much"
                value={qrKeywords}
                onChange={(e) => setQrKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple keywords with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label>Match Mode:</Label>
              <Select
                value={qrMatchMode}
                onValueChange={(v) => setQrMatchMode(v as typeof qrMatchMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains keyword</SelectItem>
                  <SelectItem value="exact">Exact match</SelectItem>
                  <SelectItem value="starts_with">Starts with</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Send this reply:</Label>
              <Textarea
                placeholder="Our pricing starts at $99/mo. Would you like more details?"
                value={qrMessage}
                onChange={(e) => setQrMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Quick reply buttons (optional):</Label>
              <Input
                placeholder="See plans, Talk to sales, No thanks"
                value={qrQuickReplies}
                onChange={(e) => setQrQuickReplies(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separate button labels with commas (max 3)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={qrAiFallback}
                onCheckedChange={setQrAiFallback}
              />
              <Label className="text-sm">
                Enable AI fallback if user asks follow-up question
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuickResponseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateQuickResponse}
              disabled={
                !qrKeywords.trim() ||
                !qrMessage.trim() ||
                createFlowMutation.isPending
              }
            >
              {createFlowMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog
        open={activeView === "templates"}
        onOpenChange={(open) => !open && setActiveView("list")}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Flow Templates
            </DialogTitle>
            <DialogDescription>
              Choose a template to customize in the visual editor
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {FLOW_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleUseTemplate(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      {template.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{template.description}</CardDescription>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {template.nodes.length} nodes
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <Badge variant="outline" className="text-xs">
                      {template.defaultKeywords.split(",")[0]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Custom Flow Card */}
            <Card
              className="cursor-pointer hover:border-primary transition-colors border-dashed"
              onClick={handleCreateCustomFlow}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted text-muted-foreground rounded-lg">
                    <GitBranch className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Custom Flow</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Build your own flow from scratch with the visual editor
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveView("list")}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flow?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The flow will stop responding to
              messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFlow}
              disabled={deleteFlowMutation.isPending}
            >
              {deleteFlowMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
