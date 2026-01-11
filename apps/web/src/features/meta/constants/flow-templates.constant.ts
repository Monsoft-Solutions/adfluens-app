/**
 * Flow Templates Constant
 *
 * Pre-built flow templates for common automation use cases.
 */

import type { ReactNode } from "react";
import type {
  ApiFlowNode,
  FlowTrigger,
} from "../components/flow-editor/flow-editor.types";

// ============================================================================
// Types
// ============================================================================

export type FlowTemplate = {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  nodes: ApiFlowNode[];
  entryNodeId: string;
  globalTriggers: FlowTrigger[];
  defaultKeywords: string;
};

// ============================================================================
// Templates Data (without icons - icons added in component)
// ============================================================================

type FlowTemplateData = Omit<FlowTemplate, "icon">;

export const FLOW_TEMPLATES_DATA: FlowTemplateData[] = [
  {
    id: "lead-qualification",
    name: "Lead Qualification",
    description: "Ask qualifying questions and hand off to your team",
    defaultKeywords: "interested, learn more, info",
    globalTriggers: [
      { type: "keyword", value: "interested", matchMode: "contains" },
    ],
    entryNodeId: "entry",
    nodes: [
      {
        id: "entry",
        name: "Welcome",
        type: "entry",
        actions: [
          {
            type: "send_message",
            config: {
              message:
                "Thanks for reaching out! I'd love to learn more about what you're looking for.",
            },
          },
        ],
        nextNodes: ["q1"],
        position: { x: 250, y: 50 },
      },
      {
        id: "q1",
        name: "Ask Need",
        type: "message",
        actions: [
          {
            type: "collect_input",
            config: {
              inputName: "need",
              prompt: "What are you hoping to achieve?",
            },
          },
        ],
        nextNodes: ["q2"],
        position: { x: 250, y: 200 },
      },
      {
        id: "q2",
        name: "Ask Timeline",
        type: "message",
        actions: [
          {
            type: "send_quick_replies",
            config: {
              message: "What's your timeline?",
              replies: ["ASAP", "This month", "This quarter", "Just exploring"],
            },
          },
        ],
        nextNodes: ["handoff"],
        position: { x: 250, y: 350 },
      },
      {
        id: "handoff",
        name: "Handoff",
        type: "action",
        actions: [{ type: "handoff", config: { reason: "Qualified lead" } }],
        nextNodes: [],
        position: { x: 250, y: 500 },
      },
    ],
  },
  {
    id: "faq-handler",
    name: "FAQ Handler",
    description: "Answer common questions automatically",
    defaultKeywords: "question, help, faq",
    globalTriggers: [
      { type: "keyword", value: "question", matchMode: "contains" },
    ],
    entryNodeId: "entry",
    nodes: [
      {
        id: "entry",
        name: "Menu",
        type: "entry",
        actions: [
          {
            type: "send_quick_replies",
            config: {
              message:
                "I can help with common questions! What would you like to know?",
              replies: ["Pricing", "Hours", "Location", "Contact"],
            },
          },
        ],
        nextNodes: ["ai"],
        position: { x: 250, y: 50 },
      },
      {
        id: "ai",
        name: "AI Response",
        type: "ai_node",
        actions: [{ type: "ai_response", config: {} }],
        nextNodes: [],
        position: { x: 250, y: 200 },
      },
    ],
  },
  {
    id: "appointment-booker",
    name: "Appointment Booker",
    description: "Collect appointment preferences and contact info",
    defaultKeywords: "appointment, book, schedule, meeting",
    globalTriggers: [
      { type: "keyword", value: "appointment", matchMode: "contains" },
      { type: "keyword", value: "book", matchMode: "contains" },
    ],
    entryNodeId: "entry",
    nodes: [
      {
        id: "entry",
        name: "Welcome",
        type: "entry",
        actions: [
          {
            type: "send_message",
            config: {
              message:
                "I'd be happy to help you book an appointment! Let me gather some details.",
            },
          },
        ],
        nextNodes: ["service"],
        position: { x: 250, y: 50 },
      },
      {
        id: "service",
        name: "Ask Service",
        type: "message",
        actions: [
          {
            type: "collect_input",
            config: {
              inputName: "service",
              prompt: "What service are you interested in?",
            },
          },
        ],
        nextNodes: ["time"],
        position: { x: 250, y: 200 },
      },
      {
        id: "time",
        name: "Ask Time",
        type: "message",
        actions: [
          {
            type: "collect_input",
            config: {
              inputName: "preferredTime",
              prompt: "When would you like to come in? (Day and time)",
            },
          },
        ],
        nextNodes: ["contact"],
        position: { x: 250, y: 350 },
      },
      {
        id: "contact",
        name: "Get Contact",
        type: "message",
        actions: [
          {
            type: "collect_input",
            config: {
              inputName: "contact",
              prompt:
                "Great! Can I get your phone number or email to confirm the appointment?",
            },
          },
        ],
        nextNodes: ["handoff"],
        position: { x: 250, y: 500 },
      },
      {
        id: "handoff",
        name: "Handoff",
        type: "action",
        actions: [
          { type: "handoff", config: { reason: "Appointment request" } },
        ],
        nextNodes: [],
        position: { x: 250, y: 650 },
      },
    ],
  },
  {
    id: "support-ticket",
    name: "Support Ticket",
    description: "Collect issue details and escalate to support",
    defaultKeywords: "help, support, problem, issue",
    globalTriggers: [
      { type: "keyword", value: "problem", matchMode: "contains" },
      { type: "keyword", value: "issue", matchMode: "contains" },
    ],
    entryNodeId: "entry",
    nodes: [
      {
        id: "entry",
        name: "Acknowledge",
        type: "entry",
        actions: [
          {
            type: "send_message",
            config: {
              message:
                "I'm sorry to hear you're having an issue. Let me help you get this resolved.",
            },
          },
        ],
        nextNodes: ["describe"],
        position: { x: 250, y: 50 },
      },
      {
        id: "describe",
        name: "Get Details",
        type: "message",
        actions: [
          {
            type: "collect_input",
            config: {
              inputName: "issueDescription",
              prompt: "Can you describe what's happening?",
            },
          },
        ],
        nextNodes: ["priority"],
        position: { x: 250, y: 200 },
      },
      {
        id: "priority",
        name: "Priority",
        type: "message",
        actions: [
          {
            type: "send_quick_replies",
            config: {
              message: "How urgent is this for you?",
              replies: ["Critical - Can't work", "High - Need soon", "Normal"],
            },
          },
        ],
        nextNodes: ["handoff"],
        position: { x: 250, y: 350 },
      },
      {
        id: "handoff",
        name: "Escalate",
        type: "action",
        actions: [{ type: "handoff", config: { reason: "Support ticket" } }],
        nextNodes: [],
        position: { x: 250, y: 500 },
      },
    ],
  },
  {
    id: "product-inquiry",
    name: "Product Inquiry",
    description: "Learn what they're interested in and provide info",
    defaultKeywords: "product, buy, purchase, pricing",
    globalTriggers: [
      { type: "keyword", value: "product", matchMode: "contains" },
      { type: "keyword", value: "pricing", matchMode: "contains" },
    ],
    entryNodeId: "entry",
    nodes: [
      {
        id: "entry",
        name: "Welcome",
        type: "entry",
        actions: [
          {
            type: "send_message",
            config: {
              message:
                "Thanks for your interest! I'd love to help you find the right solution.",
            },
          },
        ],
        nextNodes: ["interest"],
        position: { x: 250, y: 50 },
      },
      {
        id: "interest",
        name: "Ask Interest",
        type: "message",
        actions: [
          {
            type: "collect_input",
            config: {
              inputName: "productInterest",
              prompt: "What product or service are you most interested in?",
            },
          },
        ],
        nextNodes: ["ai"],
        position: { x: 250, y: 200 },
      },
      {
        id: "ai",
        name: "AI Info",
        type: "ai_node",
        actions: [{ type: "ai_response", config: {} }],
        nextNodes: [],
        position: { x: 250, y: 350 },
      },
    ],
  },
];

// ============================================================================
// Icon Mapping
// ============================================================================

/**
 * Maps template IDs to icon names for use in components.
 * Icons are added at the component level to avoid React node serialization issues.
 */
export const TEMPLATE_ICON_MAP: Record<string, string> = {
  "lead-qualification": "ClipboardList",
  "faq-handler": "HelpCircle",
  "appointment-booker": "Calendar",
  "support-ticket": "UserCheck",
  "product-inquiry": "ShoppingBag",
};
