/**
 * Meta Integration Enums
 *
 * PostgreSQL native enums for Meta-related tables.
 * Using pgEnum provides database-level validation and type safety.
 */
import { pgEnum } from "drizzle-orm/pg-core";

// =============================================================================
// Connection & Page Status
// =============================================================================

/**
 * Meta connection status values
 */
export const connectionStatusEnum = pgEnum("connection_status", [
  "active",
  "pending",
  "disconnected",
  "error",
]);

/**
 * Meta page status values
 */
export const pageStatusEnum = pgEnum("page_status", [
  "active",
  "disconnected",
  "error",
]);

// =============================================================================
// Lead Management
// =============================================================================

/**
 * Lead processing status values
 */
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
]);

// =============================================================================
// Appointments
// =============================================================================

/**
 * Appointment status values
 */
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

// =============================================================================
// Team Inbox
// =============================================================================

/**
 * Inbox item priority values
 */
export const inboxPriorityEnum = pgEnum("inbox_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

/**
 * Inbox item status values
 */
export const inboxStatusEnum = pgEnum("inbox_status", [
  "open",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
]);

// =============================================================================
// Conversation State
// =============================================================================

/**
 * Bot mode for conversation handling
 */
export const botModeEnum = pgEnum("bot_mode", ["ai", "flow", "human"]);

/**
 * Lead qualification status values
 */
export const qualificationStatusEnum = pgEnum("qualification_status", [
  "unqualified",
  "qualifying",
  "qualified",
  "disqualified",
]);

// =============================================================================
// Flow Execution
// =============================================================================

/**
 * Scheduled flow execution status values
 */
export const scheduledExecutionStatusEnum = pgEnum(
  "scheduled_execution_status",
  ["pending", "processing", "completed", "failed", "cancelled"]
);

// =============================================================================
// Type Exports
// =============================================================================

/** Type for lead status enum values */
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];

/** Type for appointment status enum values */
export type AppointmentStatus =
  (typeof appointmentStatusEnum.enumValues)[number];

/** Type for inbox priority enum values */
export type InboxPriority = (typeof inboxPriorityEnum.enumValues)[number];

/** Type for inbox status enum values */
export type InboxStatus = (typeof inboxStatusEnum.enumValues)[number];

/** Type for bot mode enum values */
export type BotMode = (typeof botModeEnum.enumValues)[number];

/** Type for qualification status enum values */
export type QualificationStatus =
  (typeof qualificationStatusEnum.enumValues)[number];

/** Type for connection status enum values */
export type ConnectionStatus = (typeof connectionStatusEnum.enumValues)[number];

/** Type for page status enum values */
export type PageStatus = (typeof pageStatusEnum.enumValues)[number];

/** Type for scheduled execution status enum values */
export type ScheduledExecutionStatus =
  (typeof scheduledExecutionStatusEnum.enumValues)[number];
