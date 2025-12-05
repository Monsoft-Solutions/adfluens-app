import { createAccessControl } from "better-auth/plugins/access";

/**
 * Access control statement
 * Defines resources and actions for role-based access control
 * This file is separated from auth.config.ts to allow client-side imports
 * without pulling in server-side dependencies (db, env, etc.)
 */
const statement = {
  organization: ["view", "update", "delete", "manage"],
  member: ["view", "invite", "remove", "updateRole"],
  channel: ["analyze", "view", "manage"],
  video: ["analyze", "view"],
} as const;

/**
 * Access control instance
 */
export const ac = createAccessControl(statement);

/**
 * Owner role with full permissions
 */
export const owner = ac.newRole({
  organization: ["update", "delete", "manage"],
  member: ["invite", "remove", "updateRole"],
  channel: ["analyze", "view", "manage"],
  video: ["analyze", "view"],
});

/**
 * Admin role with management permissions
 */
export const admin = ac.newRole({
  organization: ["update", "manage"],
  member: ["invite", "remove", "updateRole"],
  channel: ["analyze", "view", "manage"],
  video: ["analyze", "view"],
});

/**
 * Viewer role with read-only permissions
 */
export const viewer = ac.newRole({
  organization: ["view"],
  member: ["view"],
  channel: ["view"],
  video: ["view"],
});

/**
 * Creator role with channel management permissions
 */
export const creator = ac.newRole({
  organization: ["view"],
  member: ["view"],
  channel: ["analyze", "view", "manage"],
  video: ["analyze", "view"],
});
