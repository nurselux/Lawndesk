/**
 * Apply SMS consent migration to Supabase database
 *
 * Usage:
 *   node scripts/apply-migration.js
 *   npm run apply-migration
 */

const { execSync } = require('child_process').execSync

// Migration SQL content
const migrationSQL = `
-- SMS consent for carrier compliance
-- Users must explicitly opt-in to receive SMS messages
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT false;
-- Track when consent was given
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ;
`

console.log('🚀 Starting SMS consent migration...')
console.log('SQL to execute:')
console.log(migrationSQL)

// Check for environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file')
  console.error('\nOr manually run:')
  console.log('1. Go to https://supabase.com/dashboard/project/YOUR-PROJECT-ID/settings/api')
  console.log('2. Click "SQL Editor" in the left sidebar')
  console.log('3. Paste the SQL from supabase/migrations/20260402000001_sms_consent_column.sql')
  console.log('4. Click "Run" to execute the migration')
  process.exit(1)
}

console.log('\n✅ Environment variables found:')
console.log(`Supabase URL: ${supabaseUrl}`)
console.log(`Supabase Anon Key: ${supabaseAnonKey ? '✓ Set' : '❌ Missing'}`)

// Execute via curl (fallback if @supabase/node not available)
const { spawn } = require('child_process').spawn

console.log('\n📝 Executing migration via Supabase REST API...')

const curl = spawn('curl', [
  '-X', 'POST',
  `${supabaseUrl}/rest/v1/rpc/apply_migration`,
  '-H', `apikey: ${supabaseAnonKey}`,
  '-H', 'Content-Type: application/json',
  '-H', 'Authorization: Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  '-d', `{
    "query": "SELECT exec(${migrationSQL})"
  }`
])

curl.stdout.on('data', (data) => {
  console.log(data.toString())
})

curl.stderr.on('data', (data) => {
  console.error('Error:', data.toString())
})

curl.on('close', (code) => {
  console.log(`\n✅ Migration process completed with code: ${code}`)

  if (code === 0) {
    console.log('\n✅ SUCCESS: Migration applied successfully!')
    console.log('\n📋 What was done:')
    console.log('  • Added sms_consent column (BOOLEAN, default: false)')
    console.log('  • Added sms_consent_at column (TIMESTAMPTZ)')
    console.log('\n🎉 Next steps:')
    console.log(' 1. Your signup page (/signup) is now live with SMS consent checkbox')
    console.log(' 2. Terms and Privacy pages have been updated with SMS compliance info')
    console.log(' 3. You can now register your SMS campaigns with carriers')
  } else {
    console.log(`\n❌ FAILED: Migration failed with code: ${code}`)
    console.log('\n💡 Common issues:')
    console.log('  • Check if you have the correct project ID in Supabase URL')
    console.log('  • Verify SUPABASE_SERVICE_ROLE_KEY is set in environment variables')
    console.log('  • Ensure your account has admin/database permissions')
  process.exit(1)
  }
})
