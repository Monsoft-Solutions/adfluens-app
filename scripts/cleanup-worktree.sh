#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() { echo -e "${BLUE}ℹ ${NC}$1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

if [ -z "$1" ]; then
    print_error "Usage: ./scripts/cleanup-worktree.sh <worktree-path>"
    echo ""
    echo "Available worktrees:"
    echo ""
    git worktree list
    echo ""
    exit 1
fi

WORKTREE_PATH=$1

# Check if worktree exists
if ! git worktree list | grep -q "$WORKTREE_PATH"; then
    print_error "Worktree not found: $WORKTREE_PATH"
    echo ""
    echo "Available worktrees:"
    git worktree list
    exit 1
fi

# Get the branch name from the worktree
BRANCH_NAME=$(git -C "$WORKTREE_PATH" branch --show-current 2>/dev/null)

echo ""
print_warning "About to remove worktree: $WORKTREE_PATH"
if [ -n "$BRANCH_NAME" ]; then
    echo "Branch: $BRANCH_NAME"
fi
echo ""

# Check for uncommitted changes
if [ -d "$WORKTREE_PATH" ]; then
    cd "$WORKTREE_PATH"
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        print_error "Worktree has uncommitted changes!"
        echo ""
        git status --short
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cancelled"
            exit 1
        fi
    fi
    cd - > /dev/null
fi

# Remove the worktree
print_info "Removing worktree..."
git worktree remove "$WORKTREE_PATH"

if [ $? -eq 0 ]; then
    print_success "Worktree removed successfully"
    
    if [ -n "$BRANCH_NAME" ]; then
        echo ""
        print_info "The branch '$BRANCH_NAME' still exists"
        echo ""
        echo "To delete the branch:"
        echo "  git branch -d $BRANCH_NAME    # if merged"
        echo "  git branch -D $BRANCH_NAME    # force delete"
    fi
else
    print_error "Failed to remove worktree"
    echo ""
    print_info "You can manually remove it with:"
    echo "  git worktree remove --force $WORKTREE_PATH"
    exit 1
fi

echo ""
print_success "Cleanup complete!"

