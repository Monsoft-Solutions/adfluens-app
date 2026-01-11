/**
 * Renders informational fields for entry nodes in the properties panel.
 *
 * Displays a short explanatory message and a note that trigger keywords are configured in the toolbar.
 */

export function EntryNodeFields() {
  return (
    <div className="text-sm text-muted-foreground">
      <p>This is the starting point of your flow.</p>
      <p className="mt-2">Trigger keywords are set in the toolbar above.</p>
    </div>
  );
}