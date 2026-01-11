# Claude Code Guide

This guide documents Claude Code configuration and best practices for the YouTube Channel Analyzer project.

## Quick Start

```bash
# Start Claude Code in the project
cd youtube-channel-analyzer-v1
claude

# Use slash commands
/new-feature video-analytics    # Create a new feature
/fix-types                      # Fix TypeScript errors
/review                         # Review recent changes
```

## Directory Structure

```
.claude/
├── settings.json              # Team permissions (shared)
├── settings.local.json        # Personal settings (gitignored)
├── agents/                    # Custom agents
│   ├── feature-builder.md
│   ├── code-reviewer.md
│   ├── db-migrator.md
│   └── ui-builder.md
├── commands/                  # Slash commands
│   ├── new-feature.md
│   ├── add-component.md
│   ├── db-change.md
│   ├── review.md
│   ├── fix-types.md
│   └── add-endpoint.md
├── rules/                     # Path-specific rules
│   ├── frontend.md
│   ├── backend.md
│   ├── database.md
│   └── types.md
└── skills/                    # Domain knowledge
    ├── trpc-patterns/
    ├── drizzle-orm/
    ├── ai-integration/
    └── monorepo-patterns/
```

## Custom Agents

Agents are specialized AI assistants for specific tasks.

### Available Agents

| Agent             | Purpose                   | When to Use                      |
| ----------------- | ------------------------- | -------------------------------- |
| `feature-builder` | Build full-stack features | Creating new features, endpoints |
| `code-reviewer`   | Review code quality       | After implementing features      |
| `db-migrator`     | Database schema changes   | Modifying tables, migrations     |
| `ui-builder`      | React/UI development      | Building frontend components     |

### Using Agents

Agents are invoked automatically based on task description, or explicitly:

```
"Use the feature-builder agent to create a video analytics feature"
"Use the code-reviewer agent to review my recent changes"
```

## Slash Commands

Quick shortcuts for common workflows.

### Available Commands

| Command          | Purpose                   | Example                                      |
| ---------------- | ------------------------- | -------------------------------------------- |
| `/new-feature`   | Create full-stack feature | `/new-feature video-analytics`               |
| `/add-component` | Add shadcn component      | `/add-component dialog`                      |
| `/db-change`     | Database schema change    | `/db-change add views column to video table` |
| `/review`        | Code review               | `/review` or `/review apps/web`              |
| `/fix-types`     | Fix TypeScript errors     | `/fix-types`                                 |
| `/add-endpoint`  | Create tRPC endpoint      | `/add-endpoint channel.analyze`              |

## Modular Rules

Rules are automatically applied based on file paths.

| Rule          | Applies To          | Key Points                                 |
| ------------- | ------------------- | ------------------------------------------ |
| `frontend.md` | `apps/web/**`       | React patterns, styling tokens, tRPC hooks |
| `backend.md`  | `apps/api/**`       | tRPC routers, services, error handling     |
| `database.md` | `packages/db/**`    | Drizzle conventions, naming, migrations    |
| `types.md`    | `packages/types/**` | Zod schemas, no barrel imports             |

## Skills

Skills provide domain-specific knowledge that Claude uses automatically.

### Available Skills

| Skill               | Topic               | Triggered By                 |
| ------------------- | ------------------- | ---------------------------- |
| `trpc-patterns`     | tRPC development    | API endpoints, data fetching |
| `drizzle-orm`       | Database operations | Tables, queries, migrations  |
| `ai-integration`    | AI features         | @monsoft/ai usage            |
| `monorepo-patterns` | Workspace patterns  | Cross-package work           |

## Playwright MCP

Browser automation is available via Playwright MCP for UI testing.

```
"Take a screenshot of the home page"
"Click the login button and fill in the form"
"Run the channel analyzer flow end-to-end"
```

## Permissions

### Team Permissions (settings.json)

Pre-approved commands that run without prompts:

- `pnpm dev/build/lint/type-check/format`
- `pnpm db:*` commands
- `pnpm dlx shadcn@latest add`
- `git status/diff/log/branch`
- Read access to `packages/**` and `apps/**`

### Denied Actions

- Reading `.env` files
- Destructive git commands (`rm -rf`, `push --force`, `reset --hard`)
- Reading secrets directories

### Personal Settings

Add personal overrides to `.claude/settings.local.json` (gitignored):

```json
{
  "permissions": {
    "allow": ["Bash(your-custom-command:*)"]
  }
}
```

## Best Practices

### 1. Use Slash Commands for Common Tasks

Instead of describing the task, use the appropriate command:

```
/new-feature user-dashboard    # Better than "create a dashboard feature"
/fix-types                     # Better than "fix all type errors"
```

### 2. Let Agents Handle Complex Tasks

For multi-step work, let agents coordinate:

```
"Use the feature-builder agent to create a video analytics feature with:
- Backend endpoint for fetching analytics
- Frontend dashboard component
- Database table for storing data"
```

### 3. Reference Project Patterns

The rules and skills encode project conventions. When making changes, Claude will follow:

- File naming conventions
- Import patterns (no barrel imports)
- Styling tokens (semantic only)
- TypeScript rules

### 4. Use Plan Mode for Big Changes

For architectural changes, use plan mode:

```
claude --permission-mode plan
```

### 5. Run Type Check Often

After changes, verify with:

```
pnpm type-check
```

## Adding New Configuration

### New Agent

Create `.claude/agents/[name].md`:

```yaml
---
name: agent-name
description: What it does. When to use it.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---
Instructions for the agent...
```

### New Command

Create `.claude/commands/[name].md`:

```markdown
Description of what this command does.

Target: $ARGUMENTS

## Instructions

1. Step one
2. Step two
   ...
```

### New Rule

Create `.claude/rules/[name].md`:

```yaml
---
paths: path/pattern/**/*.ts
---
# Rule Title

Rules that apply to these files...
```

### New Skill

Create `.claude/skills/[name]/SKILL.md`:

```yaml
---
name: skill-name
description: What this skill provides. When to use it.
allowed-tools: Read, Glob, Grep
---
# Skill Title

Domain knowledge and patterns...
```

## Troubleshooting

### Agent Not Triggering

- Check the `description` field includes relevant keywords
- Try explicit invocation: "Use the [agent-name] agent to..."

### Command Not Found

- Verify file exists in `.claude/commands/`
- Check filename matches command name
- Restart Claude Code session

### Rule Not Applied

- Verify `paths` pattern matches file being edited
- Check rule file is in `.claude/rules/`

### Skill Not Loaded

- Verify directory structure: `.claude/skills/[name]/SKILL.md`
- Check `description` includes trigger keywords

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Project CLAUDE.md](../CLAUDE.md) - Project-specific instructions
- [Plan File](../.claude/plans/) - Active implementation plans
