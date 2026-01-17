export type LogLevel = "error" | "warn" | "info" | "http" | "debug";

export type RequestContext = {
  requestId: string;
  userId?: string;
  organizationId?: string;
  method?: string;
  path?: string;
  startTime?: number;
};

export type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  userId?: string;
  organizationId?: string;
  error?: SerializedError;
  duration?: number;
  [key: string]: unknown;
};

export type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  cause?: SerializedError;
  [key: string]: unknown;
};

export type LoggerOptions = {
  context?: string;
};
