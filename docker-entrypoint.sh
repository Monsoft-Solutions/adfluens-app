#!/bin/sh
set -e

# tsx is installed in the api package
TSX="/app/apps/api/node_modules/.bin/tsx"

echo "Starting YouTube Analyzer API..."

# Run database migrations
echo "Running database migrations..."
$TSX /app/packages/db/src/migrate.ts

# Start the API server
echo "Starting API server..."
cd /app/apps/api
exec $TSX src/index.ts
