import type { SerializedError } from "./types";

const MAX_DEPTH = 5;
const CIRCULAR_MARKER = "[Circular]";

export function serializeError(
  error: unknown,
  seen = new WeakSet<object>(),
  depth = 0
): SerializedError | undefined {
  if (error === null || error === undefined) {
    return undefined;
  }

  if (depth > MAX_DEPTH) {
    return {
      name: "Error",
      message: "[Max depth exceeded]",
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
    };
  }

  if (typeof error !== "object") {
    return {
      name: "Error",
      message: String(error),
    };
  }

  if (seen.has(error)) {
    return {
      name: "Error",
      message: CIRCULAR_MARKER,
    };
  }

  seen.add(error);

  const errorObj = error as Record<string, unknown>;
  const result: SerializedError = {
    name: getErrorName(errorObj),
    message: getErrorMessage(errorObj),
  };

  if (errorObj["stack"] && typeof errorObj["stack"] === "string") {
    result.stack = errorObj["stack"];
  }

  if (errorObj["code"] !== undefined) {
    result.code = errorObj["code"] as string | number;
  }

  if (errorObj["cause"]) {
    result.cause = serializeError(errorObj["cause"], seen, depth + 1);
  }

  for (const key of Object.keys(errorObj)) {
    if (["name", "message", "stack", "code", "cause"].includes(key)) {
      continue;
    }

    const value = errorObj[key];
    if (value !== undefined && value !== null) {
      if (typeof value === "object") {
        if (!seen.has(value)) {
          result[key] = safeSerialize(value, seen, depth + 1);
        } else {
          result[key] = CIRCULAR_MARKER;
        }
      } else if (typeof value === "function") {
        continue;
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

function getErrorName(error: Record<string, unknown>): string {
  if (typeof error["name"] === "string" && error["name"]) {
    return error["name"];
  }
  if (error.constructor?.name && error.constructor.name !== "Object") {
    return error.constructor.name;
  }
  return "Error";
}

function getErrorMessage(error: Record<string, unknown>): string {
  if (typeof error["message"] === "string") {
    return error["message"];
  }
  return String(error);
}

function safeSerialize(
  value: unknown,
  seen: WeakSet<object>,
  depth: number
): unknown {
  if (depth > MAX_DEPTH) {
    return "[Max depth exceeded]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return CIRCULAR_MARKER;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => safeSerialize(item, seen, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const prop = (value as Record<string, unknown>)[key];
    if (typeof prop !== "function") {
      result[key] = safeSerialize(prop, seen, depth + 1);
    }
  }

  return result;
}
