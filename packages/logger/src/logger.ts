import { createLogger, transports } from "winston";
import { env } from "@repo/env";
import { jsonFormat, prettyFormat } from "./formatters";
import { getContext } from "./context";
import { serializeError } from "./error-serializer";
import type { LoggerOptions, LogLevel } from "./types";

const isDev = env.NODE_ENV !== "production";

const winstonLogger = createLogger({
  level: isDev ? "debug" : "info",
  format: isDev ? prettyFormat : jsonFormat,
  transports: [new transports.Console()],
});

function createLogMethod(level: LogLevel) {
  return function (
    this: Logger,
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void {
    const context = getContext();
    const logMeta: Record<string, unknown> = {
      context: this.contextName,
      requestId: context?.requestId,
      userId: context?.userId,
      organizationId: context?.organizationId,
    };

    if (errorOrMeta instanceof Error) {
      logMeta.error = serializeError(errorOrMeta);
      if (meta) {
        Object.assign(logMeta, meta);
      }
    } else if (errorOrMeta !== undefined && errorOrMeta !== null) {
      if (typeof errorOrMeta === "object") {
        Object.assign(logMeta, errorOrMeta);
      } else {
        logMeta.data = errorOrMeta;
      }
    }

    winstonLogger.log(level, message, logMeta);
  };
}

export class Logger {
  private contextName?: string;

  constructor(options?: LoggerOptions) {
    this.contextName = options?.context;
  }

  error = createLogMethod("error").bind(this);
  warn = createLogMethod("warn").bind(this);
  info = createLogMethod("info").bind(this);
  http = createLogMethod("http").bind(this);
  debug = createLogMethod("debug").bind(this);

  child(context: string): Logger {
    const parentContext = this.contextName;
    const childContext = parentContext
      ? `${parentContext}:${context}`
      : context;
    return new Logger({ context: childContext });
  }
}

export const logger = new Logger();
