import { createLogger, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "@repo/env";
import { jsonFormat, prettyFormat } from "./formatters";
import { getContext } from "./context";
import { serializeError } from "./error-serializer";
import type { LoggerOptions, LogLevel } from "./types";

const isDev = env.NODE_ENV !== "production";

const combinedFileTransport = new DailyRotateFile({
  filename: "logs/%DATE%-app.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  format: jsonFormat,
});

const errorFileTransport = new DailyRotateFile({
  filename: "logs/%DATE%-error.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  level: "error",
  format: jsonFormat,
});

const winstonLogger = createLogger({
  level: isDev ? "debug" : "info",
  format: isDev ? prettyFormat : jsonFormat,
  transports: [
    new transports.Console(),
    combinedFileTransport,
    errorFileTransport,
  ],
});

function logMessage(
  level: LogLevel,
  contextName: string | undefined,
  message: string,
  errorOrMeta?: unknown,
  meta?: Record<string, unknown>
): void {
  const context = getContext();
  const logMeta: Record<string, unknown> = {
    context: contextName,
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
    if (meta) {
      Object.assign(logMeta, meta);
    }
  }

  winstonLogger.log(level, message, logMeta);
}

export class Logger {
  private contextName?: string;

  constructor(options?: LoggerOptions) {
    this.contextName = options?.context;
  }

  error(
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void {
    logMessage("error", this.contextName, message, errorOrMeta, meta);
  }

  warn(
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void {
    logMessage("warn", this.contextName, message, errorOrMeta, meta);
  }

  info(
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void {
    logMessage("info", this.contextName, message, errorOrMeta, meta);
  }

  http(
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void {
    logMessage("http", this.contextName, message, errorOrMeta, meta);
  }

  debug(
    message: string,
    errorOrMeta?: unknown,
    meta?: Record<string, unknown>
  ): void {
    logMessage("debug", this.contextName, message, errorOrMeta, meta);
  }

  child(context: string): Logger {
    const parentContext = this.contextName;
    const childContext = parentContext
      ? `${parentContext}:${context}`
      : context;
    return new Logger({ context: childContext });
  }
}

export const logger = new Logger();
