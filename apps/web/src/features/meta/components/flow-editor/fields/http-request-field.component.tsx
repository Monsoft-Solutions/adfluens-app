/**
 * HTTP Request Node Fields
 *
 * Properties panel fields for editing HTTP request nodes.
 */

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import type { NodeFieldProps } from "./field.types";
import { getHttpRequestConfig } from "../nodes/node.utils";
import { VariableInput, VariableTextarea } from "./variable-input.component";

export function HttpRequestNodeFields({
  data,
  onUpdate,
  nodes,
}: NodeFieldProps) {
  const { method, url, headers, body, responseVariable } =
    getHttpRequestConfig(data);

  const updateConfig = (
    updates: Partial<ReturnType<typeof getHttpRequestConfig>>
  ) => {
    onUpdate({
      actions: [
        {
          type: "http_request",
          config: {
            method,
            url,
            headers,
            body,
            responseVariable,
            ...updates,
          },
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Method */}
      <div className="space-y-2">
        <Label>Method</Label>
        <Select
          value={method}
          onValueChange={(value) =>
            updateConfig({
              method: value as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* URL */}
      <div className="space-y-2">
        <Label>URL</Label>
        <VariableInput
          nodes={nodes}
          placeholder="https://api.example.com/endpoint"
          value={url}
          onValueChange={(value) => updateConfig({ url: value })}
        />
        <p className="text-xs text-muted-foreground">
          Click the {"{}"} button to insert variables
        </p>
      </div>

      {/* Body (for POST/PUT/PATCH) */}
      {["POST", "PUT", "PATCH"].includes(method) && (
        <div className="space-y-2">
          <Label>Request Body (JSON)</Label>
          <VariableTextarea
            nodes={nodes}
            placeholder='{"key": "{{variableName}}"}'
            value={body || ""}
            onValueChange={(value) => updateConfig({ body: value })}
            rows={4}
            className="font-mono text-xs"
          />
        </div>
      )}

      {/* Response Variable */}
      <div className="space-y-2">
        <Label>Save Response To (optional)</Label>
        <Input
          placeholder="responseData"
          value={responseVariable || ""}
          onChange={(e) => updateConfig({ responseVariable: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Variable name to store the API response
        </p>
      </div>

      <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium">Use Cases:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Send data to CRM systems</li>
          <li>Trigger Zapier/Make webhooks</li>
          <li>Fetch external data</li>
        </ul>
      </div>
    </div>
  );
}
