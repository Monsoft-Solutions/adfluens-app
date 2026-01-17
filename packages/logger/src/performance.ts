import { logger } from "./logger";

export async function timeAsync<T>(
  operationName: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.debug(`${operationName} completed`, { duration, ...meta });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${operationName} failed`, error, { duration, ...meta });
    throw error;
  }
}

export class PerformanceMarker {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  private operationName: string;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = Date.now();
  }

  mark(name: string): void {
    this.marks.set(name, Date.now() - this.startTime);
  }

  finish(meta?: Record<string, unknown>): void {
    const totalDuration = Date.now() - this.startTime;
    const steps: Record<string, number> = {};

    for (const [name, time] of this.marks) {
      steps[name] = time;
    }

    logger.debug(`${this.operationName} completed`, {
      duration: totalDuration,
      steps,
      ...meta,
    });
  }
}
