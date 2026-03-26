#!/bin/sh
set -eu

for server in /app/server.js /app/apps/web/server.js; do
  if [ -f "$server" ]; then
    exec node "$server"
  fi
done

echo "Unable to find Next standalone server.js in /app" >&2
exit 1
