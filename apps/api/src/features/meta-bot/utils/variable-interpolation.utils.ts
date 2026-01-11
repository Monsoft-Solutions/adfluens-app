/**
 * Variable Interpolation Utility
 *
 * Handles {{variableName}} pattern replacement in strings and objects.
 * Used by flow action handlers to resolve variable references.
 */

export type InterpolationContext = {
  variables: Record<string, unknown>;
  collectedInputs: Record<string, string>;
};

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
      // Handle objects/arrays by stringifying
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
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
 * @returns Object with all string values interpolated
 */
export function interpolateObjectVariables<T>(
  obj: T,
  context: InterpolationContext
): T {
  if (typeof obj === "string") {
    return interpolateVariables(obj, context) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      interpolateObjectVariables(item, context)
    ) as unknown as T;
  }

  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateObjectVariables(value, context);
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
