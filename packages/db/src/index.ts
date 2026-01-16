// Re-export database client
export { db } from "./client";

// Re-export schema tables
export {
  channelsTable,
  organizationProfileTable,
  organizationProfileTableRelations,
  scrapedPageTable,
  scrapedPageTableRelations,
  socialMediaAccountTable,
  socialMediaAccountTableRelations,
  socialMediaPostTable,
  socialMediaPostTableRelations,
  gmbConnectionTable,
  gmbConnectionTableRelations,
  // Meta tables
  metaConnectionTable,
  metaConnectionTableRelations,
  metaPageTable,
  metaPageTableRelations,
  metaLeadTable,
  metaLeadTableRelations,
  metaConversationTable,
  metaConversationTableRelations,
  metaConversationConfigTable,
  metaConversationConfigTableRelations,
  // Meta bot tables
  metaBotFlowTable,
  metaBotFlowTableRelations,
  metaConversationStateTable,
  metaConversationStateTableRelations,
  metaTeamInboxTable,
  metaTeamInboxTableRelations,
  metaAppointmentConfigTable,
  metaAppointmentConfigTableRelations,
  metaAppointmentTable,
  metaAppointmentTableRelations,
  metaFlowScheduledExecutionTable,
  metaFlowScheduledExecutionTableRelations,
  // Notification table
  notificationTable,
} from "./schema";

// Re-export drizzle-orm utilities for convenience
export {
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  inArray,
  count,
  lte,
  gte,
  ne,
  not,
} from "drizzle-orm";

// Inferred types from schema
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { channelsTable } from "./schema";

/** Type for selecting a channel from the database */
export type ChannelRow = InferSelectModel<typeof channelsTable>;

/** Type for inserting a new channel into the database */
export type ChannelInsert = InferInsertModel<typeof channelsTable>;

// Re-export organization profile types
export type {
  OrganizationProfileInsert,
  OrganizationProfileRow,
} from "./schema/organization-profile.table";

// Re-export scraped page types
export type {
  ScrapedPageInsert,
  ScrapedPageRow,
} from "./schema/scraped-page.table";

// Re-export social media account types
export type {
  SocialMediaAccountInsert,
  SocialMediaAccountRow,
} from "./schema/social-media-account.table";

// Re-export social media post types
export type {
  SocialMediaPostInsert,
  SocialMediaPostRow,
} from "./schema/social-media-post.table";

// Re-export GMB connection types
export type {
  GmbConnectionInsert,
  GmbConnectionRow,
} from "./schema/gmb-connection.table";

// Re-export Meta connection types
export type {
  MetaConnectionInsert,
  MetaConnectionRow,
} from "./schema/meta-connection.table";

// Re-export Meta page types
export type {
  MetaPageInsert,
  MetaPageRow,
  MetaPageData,
} from "./schema/meta-page.table";

// Re-export Meta lead types
export type {
  MetaLeadInsert,
  MetaLeadRow,
  MetaLeadFieldData,
} from "./schema/meta-lead.table";

// Re-export Meta conversation types
export type {
  MetaConversationInsert,
  MetaConversationRow,
  MetaMessage,
} from "./schema/meta-conversation.table";

// Re-export Meta conversation config types
export type {
  MetaConversationConfigInsert,
  MetaConversationConfigRow,
  MetaResponseRule,
  MetaAiPersonality,
  MetaBusinessHours,
  MetaSalesConfig,
  MetaSupportConfig,
} from "./schema/meta-conversation-config.table";

// Re-export Meta bot flow types
export type {
  MetaBotFlowInsert,
  MetaBotFlowRow,
  MetaBotFlowTrigger,
  MetaBotFlowAction,
  MetaBotFlowNode,
  MetaAiNodeOperation,
  MetaAiNodeModel,
  MetaExtractedField,
  MetaAiNodeActionConfig,
} from "./schema/meta-bot-flow.table";

// Re-export Meta conversation state types
export type {
  MetaConversationStateInsert,
  MetaConversationStateRow,
  MetaConversationContext,
  MetaSalesContext,
  MetaAppointmentContext,
  MetaUserMemory,
  MetaDetectedLanguage,
} from "./schema/meta-conversation-state.table";

// Re-export Meta team inbox types
export type {
  MetaTeamInboxInsert,
  MetaTeamInboxRow,
} from "./schema/meta-team-inbox.table";

// Re-export Meta appointment config types
export type {
  MetaAppointmentConfigInsert,
  MetaAppointmentConfigRow,
  MetaAppointmentSlot,
  MetaAppointmentService,
} from "./schema/meta-appointment-config.table";

// Re-export Meta appointment types
export type {
  MetaAppointmentInsert,
  MetaAppointmentRow,
} from "./schema/meta-appointment.table";

// Re-export Meta flow scheduled execution types
export type {
  MetaFlowScheduledExecutionInsert,
  MetaFlowScheduledExecutionRow,
} from "./schema/meta-flow-scheduled-execution.table";

// Re-export Meta enum types
export type {
  LeadStatus,
  AppointmentStatus,
  InboxPriority,
  InboxStatus,
  BotMode,
  QualificationStatus,
  ConnectionStatus,
  PageStatus,
  ScheduledExecutionStatus,
} from "./schema/meta-enums";

// Re-export Notification types
export type {
  NotificationInsert,
  NotificationRow,
  NotificationPayload,
} from "./schema/notification.table";

// Re-export Content creation tables
export {
  contentPostTable,
  contentPostTableRelations,
} from "./schema/content-post.table";
export {
  contentPlatformEnum,
  contentPostStatusEnum,
  contentMediaSourceEnum,
} from "./schema/content-enums";
export {
  contentPostAccountTable,
  contentPostAccountTableRelations,
} from "./schema/content-post-account.table";
export {
  contentPublishResultTable,
  contentPublishResultTableRelations,
} from "./schema/content-publish-result.table";

// Re-export Platform connection tables
export {
  platformConnectionTable,
  platformConnectionTableRelations,
  platformConnectionStatusEnum,
  platformSourceTypeEnum,
} from "./schema/platform-connection.table";

// Re-export Content creation types
export type {
  ContentPostRow,
  ContentPostInsert,
  ContentPostMediaJson,
} from "./schema/content-post.table";

// Re-export Content post account types
export type {
  ContentPostAccountRow,
  ContentPostAccountInsert,
} from "./schema/content-post-account.table";

// Re-export Content publish result types
export type {
  ContentPublishResultRow,
  ContentPublishResultInsert,
} from "./schema/content-publish-result.table";

// Re-export Platform connection types
export type {
  PlatformConnectionRow,
  PlatformConnectionInsert,
  PlatformConnectionStatusDb,
  PlatformSourceTypeDb,
} from "./schema/platform-connection.table";

// Re-export Content enum types
export type {
  ContentPlatformDb,
  ContentPostStatusDb,
  ContentMediaSourceDb,
} from "./schema/content-enums";
