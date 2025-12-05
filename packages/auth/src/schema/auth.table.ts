import {
  boolean,
  pgTable,
  text,
  timestamp,
  varchar,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Users table
 * Core user information for Better Auth
 */
export const user = pgTable("user", {
  /** Unique user identifier */
  id: varchar("id", { length: 36 }).primaryKey(),

  /** User's display name */
  name: text("name").notNull(),

  /** User's email address */
  email: varchar("email", { length: 255 }).notNull().unique(),

  /** Whether the email has been verified */
  emailVerified: boolean("email_verified").notNull().default(false),

  /** URL to user's profile image */
  image: text("image"),

  /** Timestamp when user was created */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** Timestamp when user was last updated */
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Sessions table
 * Stores active user sessions
 */
export const session = pgTable("session", {
  /** Unique session identifier */
  id: varchar("id", { length: 36 }).primaryKey(),

  /** Session token */
  token: text("token").notNull().unique(),

  /** Session expiration timestamp */
  expiresAt: timestamp("expires_at").notNull(),

  /** IP address of the client */
  ipAddress: text("ip_address"),

  /** User agent string */
  userAgent: text("user_agent"),

  /** Reference to user */
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  /** Timestamp when session was created */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** Timestamp when session was last updated */
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Accounts table
 * OAuth and credential accounts linked to users
 */
export const account = pgTable("account", {
  /** Unique account identifier */
  id: varchar("id", { length: 36 }).primaryKey(),

  /** Account ID from the provider */
  accountId: text("account_id").notNull(),

  /** Provider identifier (e.g., 'google', 'facebook', 'credential') */
  providerId: text("provider_id").notNull(),

  /** Reference to user */
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  /** OAuth access token */
  accessToken: text("access_token"),

  /** OAuth refresh token */
  refreshToken: text("refresh_token"),

  /** OAuth ID token */
  idToken: text("id_token"),

  /** Access token expiration timestamp */
  accessTokenExpiresAt: timestamp("access_token_expires_at"),

  /** Refresh token expiration timestamp */
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),

  /** OAuth scope */
  scope: text("scope"),

  /** Hashed password (for credential provider) */
  password: text("password"),

  /** Timestamp when account was created */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** Timestamp when account was last updated */
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Verification table
 * Stores verification tokens for email verification, password reset, etc.
 */
export const verification = pgTable("verification", {
  /** Unique verification identifier */
  id: varchar("id", { length: 36 }).primaryKey(),

  /** Identifier for the verification request (e.g., email) */
  identifier: text("identifier").notNull(),

  /** The value to be verified (token) */
  value: text("value").notNull(),

  /** Verification expiration timestamp */
  expiresAt: timestamp("expires_at").notNull(),

  /** Timestamp when verification was created */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** Timestamp when verification was last updated */
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Organizations table
 * Stores organization data for multi-tenant functionality
 */
export const organization = pgTable("organization", {
  /** Unique organization identifier */
  id: varchar("id", { length: 36 }).primaryKey(),

  /** Organization name */
  name: varchar("name", { length: 255 }).notNull(),

  /** Organization slug (unique identifier for URLs) */
  slug: varchar("slug", { length: 255 }).notNull().unique(),

  /** Organization logo URL */
  logo: text("logo"),

  /** Organization metadata (JSON) */
  metadata: text("metadata"),

  /** User ID who created the organization */
  createdBy: varchar("created_by", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  /** Timestamp when organization was created */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** Timestamp when organization was last updated */
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Organization members table
 * Stores membership information linking users to organizations with roles
 */
export const member = pgTable(
  "member",
  {
    /** Unique member identifier */
    id: varchar("id", { length: 36 }).primaryKey(),

    /** Reference to organization */
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    /** Reference to user */
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    /** Member role in the organization */
    role: varchar("role", { length: 50 }).notNull(),

    /** Timestamp when member was added */
    createdAt: timestamp("created_at").notNull().defaultNow(),

    /** Timestamp when member was last updated */
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    /** Ensure a user can only have one membership per organization */
    uniqueUserOrg: unique().on(table.organizationId, table.userId),
  })
);

/**
 * Organization invitations table
 * Stores pending invitations to join organizations
 */
export const invitation = pgTable("invitation", {
  /** Unique invitation identifier */
  id: varchar("id", { length: 36 }).primaryKey(),

  /** Reference to organization */
  organizationId: varchar("organization_id", { length: 36 })
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  /** Email address of the invited user */
  email: varchar("email", { length: 255 }).notNull(),

  /** Role to assign when invitation is accepted */
  role: varchar("role", { length: 50 }).notNull(),

  /** Invitation token for verification */
  token: varchar("token", { length: 255 }).notNull().unique(),

  /** Invitation status */
  status: varchar("status", { length: 50 }).notNull().default("pending"),

  /** Timestamp when invitation expires */
  expiresAt: timestamp("expires_at").notNull(),

  /** Timestamp when invitation was created */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** Timestamp when invitation was last updated */
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Teams table
 * Stores teams within organizations
 */
export const team = pgTable("team", {
  /** Unique team identifier */
  id: varchar("id", { length: 36 }).primaryKey(),

  /** Team name */
  name: varchar("name", { length: 255 }).notNull(),

  /** Team slug (unique within organization) */
  slug: varchar("slug", { length: 255 }).notNull(),

  /** Reference to organization */
  organizationId: varchar("organization_id", { length: 36 })
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  /** Team metadata (JSON) */
  metadata: text("metadata"),

  /** Timestamp when team was created */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /** Timestamp when team was last updated */
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Team members table
 * Stores membership information linking users to teams
 */
export const teamMember = pgTable(
  "team_member",
  {
    /** Unique team member identifier */
    id: varchar("id", { length: 36 }).primaryKey(),

    /** Reference to team */
    teamId: varchar("team_id", { length: 36 })
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),

    /** Reference to user */
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    /** Team member role */
    role: varchar("role", { length: 50 }).notNull(),

    /** Timestamp when team member was added */
    createdAt: timestamp("created_at").notNull().defaultNow(),

    /** Timestamp when team member was last updated */
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    /** Ensure a user can only have one membership per team */
    uniqueUserTeam: unique().on(table.teamId, table.userId),
  })
);
