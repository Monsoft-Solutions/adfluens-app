import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { RequestContext } from "./types";

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(
  context: Partial<RequestContext>,
  fn: () => T
): T {
  const fullContext: RequestContext = {
    requestId: context.requestId ?? randomUUID(),
    userId: context.userId,
    organizationId: context.organizationId,
    method: context.method,
    path: context.path,
    startTime: context.startTime ?? Date.now(),
  };

  return asyncLocalStorage.run(fullContext, fn);
}

export function getContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

export function updateContext(updates: Partial<RequestContext>): void {
  const current = asyncLocalStorage.getStore();
  if (current) {
    Object.assign(current, updates);
  }
}

export function getRequestId(): string | undefined {
  return asyncLocalStorage.getStore()?.requestId;
}

export function getUserId(): string | undefined {
  return asyncLocalStorage.getStore()?.userId;
}

export function getOrganizationId(): string | undefined {
  return asyncLocalStorage.getStore()?.organizationId;
}
