import type { Request, Response, NextFunction, RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { runWithContext, updateContext, getContext } from "./context";
import { Logger } from "./logger";

const httpLogger = new Logger({ context: "http" });

export function loggingMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId =
      (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
    const startTime = Date.now();

    res.setHeader("x-request-id", requestId);

    runWithContext(
      {
        requestId,
        method: req.method,
        path: req.path,
        startTime,
      },
      () => {
        // Capture context before registering async finish handler
        // to preserve userId/organizationId across async boundary
        const capturedContext = getContext();

        res.on("finish", () => {
          const duration = Date.now() - startTime;

          httpLogger.http(`${req.method} ${req.path}`, {
            statusCode: res.statusCode,
            duration,
            userAgent: req.headers["user-agent"],
            ip: req.ip,
            userId: capturedContext?.userId,
            organizationId: capturedContext?.organizationId,
          });
        });

        next();
      }
    );
  };
}

export function userContextMiddleware(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: { id: string } }).user;
    const session = (
      req as Request & { session?: { activeOrganizationId?: string } }
    ).session;

    if (user?.id) {
      updateContext({
        userId: user.id,
        organizationId: session?.activeOrganizationId,
      });
    }

    next();
  };
}
