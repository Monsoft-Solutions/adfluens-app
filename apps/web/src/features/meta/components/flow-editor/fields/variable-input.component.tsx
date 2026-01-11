/**
 * Variable Input Components
 *
 * Enhanced Input and Textarea with variable picker button.
 * Inserts variables at cursor position.
 */

import { useRef, useCallback } from "react";
import { Input, Textarea, cn } from "@repo/ui";
import { VariablePicker } from "./variable-picker.component";
import type { FlowEditorNode } from "../flow-editor.types";

type VariableInputBaseProps = {
  nodes: FlowEditorNode[];
  value: string;
  onValueChange: (value: string) => void;
  showPickerButton?: boolean;
};

type VariableInputProps = VariableInputBaseProps &
  Omit<React.ComponentProps<typeof Input>, "value" | "onChange">;

type VariableTextareaProps = VariableInputBaseProps &
  Omit<React.ComponentProps<typeof Textarea>, "value" | "onChange">;

export function VariableInput({
  nodes,
  value,
  onValueChange,
  showPickerButton = true,
  className,
  ...props
}: VariableInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInsertVariable = useCallback(
    (variable: string) => {
      const input = inputRef.current;
      if (!input) {
        onValueChange((value || "") + variable);
        return;
      }

      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = value || "";
      const newValue =
        currentValue.substring(0, start) +
        variable +
        currentValue.substring(end);
      onValueChange(newValue);

      // Set cursor position after inserted variable
      setTimeout(() => {
        input.setSelectionRange(
          start + variable.length,
          start + variable.length
        );
        input.focus();
      }, 0);
    },
    [value, onValueChange]
  );

  return (
    <div className="relative flex items-center">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(showPickerButton && "pr-10", className)}
        {...props}
      />
      {showPickerButton && (
        <div className="absolute right-1">
          <VariablePicker nodes={nodes} onSelect={handleInsertVariable} />
        </div>
      )}
    </div>
  );
}

export function VariableTextarea({
  nodes,
  value,
  onValueChange,
  showPickerButton = true,
  className,
  ...props
}: VariableTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = useCallback(
    (variable: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        onValueChange((value || "") + variable);
        return;
      }

      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const currentValue = value || "";
      const newValue =
        currentValue.substring(0, start) +
        variable +
        currentValue.substring(end);
      onValueChange(newValue);

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.setSelectionRange(
          start + variable.length,
          start + variable.length
        );
        textarea.focus();
      }, 0);
    },
    [value, onValueChange]
  );

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={className}
        {...props}
      />
      {showPickerButton && (
        <div className="absolute right-2 top-2">
          <VariablePicker nodes={nodes} onSelect={handleInsertVariable} />
        </div>
      )}
    </div>
  );
}
