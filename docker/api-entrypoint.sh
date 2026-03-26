#!/bin/sh
set -eu

max_attempts="${DATABASE_MIGRATION_MAX_ATTEMPTS:-30}"
retry_delay="${DATABASE_MIGRATION_RETRY_DELAY_SECONDS:-2}"
attempt=1

until (
  cd /workspace &&
    node ./node_modules/.pnpm/node_modules/prisma/build/index.js migrate deploy --schema node_modules/@repo/database/prisma/schema.prisma
); do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Database migrations failed after ${attempt} attempts." >&2
    exit 1
  fi

  echo "Database is not ready for migrations yet (attempt ${attempt}/${max_attempts}). Retrying in ${retry_delay}s..." >&2
  attempt=$((attempt + 1))
  sleep "$retry_delay"
done

exec node /workspace/dist/main.js
