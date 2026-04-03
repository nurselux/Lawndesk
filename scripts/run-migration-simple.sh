#!/bin/bash

# Simple Supabase Migration (embedded credentials)
# Usage: ./scripts/run-migration-simple.sh

echo "🚀 Running SQL Migration via Supabase REST API..."

# Replace these with your actual Supabase credentials:
# SUPABASE_URL=https://your-project-id.supabase.co
# SUPABASE_ANON_KEY=your-service-role-key-here
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

MIGRATION_SQL="
-- SMS consent for carrier compliance
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ;
"

# Execute migration
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/apply_migration" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"SELECT exec(${MIGRATION_SQL})\"
  }"

# Check response
RESPONSE=$(curl -s "${SUPABASE_URL}/rest/v1/rpc/apply_migration" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "${MIGRATION_SQL}")

if echo "$RESPONSE" | grep -q '"error"' > /dev/null; then
  echo "✅ Migration failed!"
  exit 1
fi

if echo "$RESPONSE" | grep -q '"result"' > /dev/null; then
  echo "✅ Migration completed successfully!"
  echo "  • Added sms_consent column (BOOLEAN, default: false)"
  echo "  • Added sms_consent_at column (TIMESTAMPTZ)"
  exit 0
fi
