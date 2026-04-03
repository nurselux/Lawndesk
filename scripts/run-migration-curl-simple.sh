#!/bin/bash
# Simple Supabase REST API Migration
# Usage: ./scripts/run-migration-curl-simple.sh

echo "🚀 Running SQL Migration via Supabase REST API..."
echo ""

# Migration SQL content
MIGRATION_SQL="
-- SMS consent for carrier compliance
-- Users must explicitly opt-in to receive SMS messages
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT false;
-- Track when consent was given
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ;
"

# Check if credentials are provided as command line arguments
if [ $# -eq 2 ]; then
  SUPABASE_URL="$1"
  SUPABASE_ANON_KEY="$2"
  shift 2
fi

# Execute via Supabase REST API
if [ -z "$SUPABASE_URL" ] && [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "✓ Supabase credentials provided via command line"
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/apply_migration" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"query\": \"SELECT exec(${MIGRATION_SQL})\"
    }"

  # Check response
  RESPONSE=$(curl -s "$SUPABASE_URL"/rest/v1/rpc/apply_migration \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "${MIGRATION_SQL}")

  if echo "$RESPONSE" | grep -q '"error"' > /dev/null; then
    echo "✅ Migration failed!"
    echo ""
    exit 1
  fi

  # Success
  if echo "$RESPONSE" | grep -q '"result"' > /dev/null; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "  • Added sms_consent column (BOOLEAN, default: false)"
    echo "  • Added sms_consent_at column (TIMESTAMPTZ)"
    echo "  • Your /signup page now has SMS consent checkbox"
  echo ""
    exit 0
  fi
