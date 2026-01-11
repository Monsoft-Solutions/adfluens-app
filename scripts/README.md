# Worktree Automation Scripts

This directory contains scripts to automate the creation and management of git worktrees for parallel feature development.

## Overview

These scripts enable you to work on multiple features in parallel by creating isolated git worktrees, each with unique port configurations to avoid conflicts.

## Scripts

### `new-worktree.sh`

Creates a new git worktree with automatic port allocation and environment setup.

**Usage:**

```bash
./scripts/new-worktree.sh <branch-name> [base-branch]
```

**Examples:**

```bash
# Create new feature branch from main
./scripts/new-worktree.sh feature/new-ui

# Create from specific base branch
./scripts/new-worktree.sh feature/experiment develop

# Create hotfix branch
./scripts/new-worktree.sh hotfix/critical-bug
```

**What it does:**

1. Creates a git worktree in `../<repo-name>-<branch-name>/`
2. Finds available port pairs (API + Web) automatically
3. Duplicates the entire `.env` file to the worktree's `.env`
4. Replaces port-specific variables (PORT, VITE_PORT, etc.) with unique values
5. Runs `pnpm install`
6. Creates a `dev.sh` helper script
7. Generates a `WORKTREE.md` readme with instructions

**Port allocation:**

- Main repo: 3000/3001
- First worktree: 4000/4001
- Second worktree: 5000/5001
- Third worktree: 6000/6001
- And so on...

### `list-worktrees.sh`

Lists all active worktrees with their branches and assigned ports.

**Usage:**

```bash
./scripts/list-worktrees.sh
```

**Example output:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Active Worktrees
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌿 Branch: main
📁 Path:   /path/to/youtube-channel-analyzer-v1

🌿 Branch: feature/new-ui
📁 Path:   /path/to/youtube-channel-analyzer-v1-feature-new-ui
🔌 Ports:  API=4001, WEB=4000
🌐 URLs:   http://localhost:4000 (app), http://localhost:4001/trpc (api)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### `cleanup-worktree.sh`

Safely removes a worktree with uncommitted change detection.

**Usage:**

```bash
./scripts/cleanup-worktree.sh <worktree-path>
```

**Example:**

```bash
./scripts/cleanup-worktree.sh ../youtube-channel-analyzer-v1-feature-new-ui
```

**What it does:**

1. Checks if worktree exists
2. Detects uncommitted changes and prompts for confirmation
3. Removes the worktree directory
4. Provides instructions for deleting the branch if desired

## Workflow with Claude Code

### 1. Create a New Worktree

```bash
cd /path/to/youtube-channel-analyzer-v1
./scripts/new-worktree.sh feature/awesome-feature
```

### 2. Open in New Claude Code Window

- Open Claude Code / Cursor
- File → Open Folder
- Navigate to the worktree directory (shown in script output)
- Claude Code treats it as a completely separate project!

### 3. Start Development

```bash
cd ../youtube-channel-analyzer-v1-feature-awesome-feature
./dev.sh
```

Your app runs on the auto-assigned ports (e.g., `localhost:4000`)

### 4. Work Normally

- Make changes
- Commit as usual: `git commit -m "feat: new feature"`
- Push: `git push origin feature/awesome-feature`
- Commits automatically update the Pull Request

### 5. Clean Up When Done

```bash
cd /path/to/youtube-channel-analyzer-v1
./scripts/cleanup-worktree.sh ../youtube-channel-analyzer-v1-feature-awesome-feature
```

Optionally delete the branch:

```bash
git branch -d feature/awesome-feature  # if merged
git branch -D feature/awesome-feature  # force delete
```

## Benefits

- **No port conflicts**: Each worktree has unique ports
- **Parallel development**: Work on multiple features simultaneously
- **Isolated environments**: Changes in one worktree don't affect others
- **Claude Code friendly**: Each worktree is a separate project
- **Shared database**: All worktrees use the same database (configurable)
- **Shared dependencies**: Changes to packages affect all worktrees

## Environment Variables

**Prerequisites:** The main repository must have a `.env` file before creating worktrees.

Each worktree gets its own `.env` file that:

1. **Duplicates** the entire main `.env` file
2. **Overrides** only the port-specific variables:
   - `PORT` - API server port (e.g., 4001)
   - `VITE_PORT` - Web app port (e.g., 4000)
   - `VITE_API_URL` - API URL for proxying (e.g., http://localhost:4001)
   - `BETTER_AUTH_URL` - Auth server URL
   - `APP_URL` - Frontend URL for CORS

All other env vars (database, API keys, etc.) are duplicated in each worktree. Since worktrees are in separate directories, each can have its own `.env` file without conflicts.

## Tips

- Keep the main repo clean for production hotfixes
- Use worktrees for experimental features
- You can have 5+ worktrees running simultaneously
- Each worktree has its own `node_modules` (storage overhead)
- Database changes affect all worktrees instantly

## Troubleshooting

**Missing .env file:**

If you get "`.env` file not found in main repository", create a `.env` file in the root of your main repository first:

```bash
cp .env.example .env  # if you have an example
# or create it manually with all required variables
```

**Missing environment variables:**

If you get "Invalid environment variables" errors when starting the dev server, your worktree's `.env` is missing required variables. This usually means:

1. The main `.env` file was incomplete when you created the worktree
2. New env vars were added after worktree creation

**Solution:** Recreate the worktree or manually copy missing vars from main `.env` to worktree `.env`

**Port already in use:**

The script auto-detects and assigns available ports. If you get a conflict, check what's running:

```bash
lsof -i :4000
lsof -i :4001
```

**Dependency issues:**

Run in the worktree directory:

```bash
pnpm install
```

**Git conflicts:**

Worktrees share the git repository. Don't check out the same branch in multiple worktrees.

**Remove stale worktrees:**

If you manually deleted a worktree directory:

```bash
git worktree prune
```
