import { format, type Logform } from "winston";
import type { LogEntry } from "./types";

const LEVEL_COLORS: Record<string, string> = {
  error: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[36m",
  http: "\x1b[35m",
  debug: "\x1b[90m",
};
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

export const jsonFormat: Logform.Format = format.combine(
  format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  format.errors({ stack: true }),
  format.printf((info) => {
    const entry: LogEntry = {
      level: info.level as LogEntry["level"],
      message: info.message as string,
      timestamp: info["timestamp"] as string,
    };

    if (info["context"]) entry.context = info["context"] as string;
    if (info["requestId"]) entry.requestId = info["requestId"] as string;
    if (info["userId"]) entry.userId = info["userId"] as string;
    if (info["organizationId"])
      entry.organizationId = info["organizationId"] as string;
    if (info["error"]) entry.error = info["error"] as LogEntry["error"];
    if (info["duration"]) entry.duration = info["duration"] as number;

    const knownKeys = new Set([
      "level",
      "message",
      "timestamp",
      "context",
      "requestId",
      "userId",
      "organizationId",
      "error",
      "duration",
      "splat",
    ]);

    for (const key of Object.keys(info)) {
      if (!knownKeys.has(key)) {
        entry[key] = info[key];
      }
    }

    return JSON.stringify(entry);
  })
);

export const prettyFormat: Logform.Format = format.combine(
  format.timestamp({ format: "HH:mm:ss.SSS" }),
  format.errors({ stack: true }),
  format.printf((info) => {
    const level = info.level;
    const color = LEVEL_COLORS[level] ?? RESET;
    const levelPadded = level.toUpperCase().padEnd(5);

    const timestamp = `${DIM}${info["timestamp"]}${RESET}`;
    const levelStr = `${color}${BOLD}${levelPadded}${RESET}`;

    const contextStr = info["context"]
      ? `${DIM}[${info["context"]}]${RESET} `
      : "";

    const requestIdStr = info["requestId"]
      ? `${DIM}(${String(info["requestId"]).slice(0, 8)})${RESET} `
      : "";

    const message = info.message;

    let output = `${timestamp} ${levelStr} ${contextStr}${requestIdStr}${message}`;

    if (info["duration"] !== undefined) {
      output += ` ${DIM}(${info["duration"]}ms)${RESET}`;
    }

    const knownKeys = new Set([
      "level",
      "message",
      "timestamp",
      "context",
      "requestId",
      "userId",
      "organizationId",
      "error",
      "duration",
      "splat",
    ]);

    const extraKeys = Object.keys(info).filter((key) => !knownKeys.has(key));
    if (extraKeys.length > 0) {
      const extra: Record<string, unknown> = {};
      for (const key of extraKeys) {
        extra[key] = info[key];
      }
      output += ` ${DIM}${JSON.stringify(extra)}${RESET}`;
    }

    if (info["error"]) {
      const err = info["error"] as {
        name?: string;
        message?: string;
        stack?: string;
      };
      output += `\n  ${color}${err.name ?? "Error"}: ${err.message}${RESET}`;
      if (err.stack) {
        const stackLines = err.stack
          .split("\n")
          .slice(1, 6)
          .map((line: string) => `  ${DIM}${line.trim()}${RESET}`)
          .join("\n");
        output += `\n${stackLines}`;
      }
    }

    return output;
  })
);
