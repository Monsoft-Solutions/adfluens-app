/**
 * Variable Interpolation Utility
 *
 * Handles {{variableName}} pattern replacement in strings and objects.
 * Used by flow action handlers to resolve variable references.
 */

// Maximum recursion depth for object interpolation
const MAX_INTERPOLATION_DEPTH = 100;

export type InterpolationContext = {
  variables: Record<string, unknown>;
  collectedInputs: Record<string, string>;
};

/**
 * Safely stringify a value, handling circular references.
 */
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    // Handle circular references or other stringify errors
    return "[Object]";
  }
}

/**
 * Interpolates variable placeholders in a string.
 * Pattern: {{variableName}}
 *
 * Priority:
 * 1. collectedInputs (from collect_input actions)
 * 2. variables (from set_variable actions)
 *
 * @param template - String containing {{variableName}} patterns
 * @param context - Context containing variables and collectedInputs
 * @returns String with variables replaced, or original pattern if not found
 */
export function interpolateVariables(
  template: string,
  context: InterpolationContext
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName: string) => {
    // Check collectedInputs first (higher priority)
    if (varName in context.collectedInputs) {
      return String(context.collectedInputs[varName]);
    }
    // Then check variables
    if (varName in context.variables) {
      const value = context.variables[varName];
      // Handle objects/arrays by stringifying (with circular reference protection)
      if (typeof value === "object" && value !== null) {
        return safeStringify(value);
      }
      return String(value);
    }
    // Return original if not found (graceful fallback)
    return match;
  });
}

/**
 * Interpolates variables in an object recursively.
 * Useful for JSON bodies in HTTP requests.
 *
 * @param obj - Object, array, or primitive to interpolate
 * @param context - Context containing variables and collectedInputs
 * @param depth - Current recursion depth (for protection against deep/circular structures)
 * @returns Object with all string values interpolated
 */
export function interpolateObjectVariables<T>(
  obj: T,
  context: InterpolationContext,
  depth: number = 0
): T {
  // Protection against infinite recursion from deep/circular structures
  if (depth > MAX_INTERPOLATION_DEPTH) {
    return obj;
  }

  if (typeof obj === "string") {
    return interpolateVariables(obj, context) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      interpolateObjectVariables(item, context, depth + 1)
    ) as unknown as T;
  }

  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateObjectVariables(value, context, depth + 1);
    }
    return result as T;
  }

  return obj;
}

/**
 * Creates an interpolation context from conversation state.
 * Helper function to build context from MetaConversationContext.
 */
export function createInterpolationContext(
  variables: Record<string, unknown> = {},
  collectedInputs: Record<string, string> = {}
): InterpolationContext {
  return { variables, collectedInputs };
}
