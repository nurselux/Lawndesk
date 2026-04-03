#!/bin/bash

# SQL Migration for SMS Compliance
# Run with: ./scripts/run-migration.sh YOUR_SUPABASE_URL YOUR_SERVICE_ROLE_KEY

MIGRATION_SQL="-- SMS consent for carrier compliance
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ;"

echo "🚀 Running SQL Migration..."
echo ""

# Your credentials
SUPABASE_URL="$1"
SUPABASE_ANON_KEY="$2"

# Execute via Supabase REST API
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/apply_migration" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"SELECT exec(${MIGRATION_SQL})\"
  }"

# Check result
if curl -s "${SUPABASE_URL}/rest/v1/rpc/apply_migration" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "${MIGRATION_SQL}"; then

  echo "✅ Migration completed!"
  echo "  • Added sms_consent column"
  echo ""
  exit 0
else
  echo "✗ Migration failed!"
  echo ""
  exit 1
fi
