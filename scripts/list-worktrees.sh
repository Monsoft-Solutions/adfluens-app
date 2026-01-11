#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 Active Worktrees${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

git worktree list --porcelain | awk -v green="$GREEN" -v blue="$BLUE" -v yellow="$YELLOW" -v nc="$NC" '
/^worktree/ { path=$2 }
/^branch/ { branch=$2; sub(/^refs\/heads\//, "", branch) }
/^$/ { 
    if (path && branch) {
        # Try to read port from .env (quoted path for safety)
        cmd = "grep \"^PORT=\" \"" path "/.env\" 2>/dev/null | cut -d= -f2"
        cmd | getline api_port
        close(cmd)
        
        cmd = "grep \"^VITE_PORT=\" \"" path "/.env\" 2>/dev/null | cut -d= -f2"
        cmd | getline web_port
        close(cmd)
        
        printf "%s🌿 Branch:%s %-30s\n", green, nc, branch
        printf "%s📁 Path:%s   %s\n", blue, nc, path
        if (api_port && web_port) {
            printf "%s🔌 Ports:%s  API=%s, WEB=%s\n", yellow, nc, api_port, web_port
            printf "%s🌐 URLs:%s   http://localhost:%s (app), http://localhost:%s/trpc (api)\n", blue, nc, web_port, api_port
        }
        printf "\n"
        path=""; branch=""; api_port=""; web_port=""
    }
}
'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

