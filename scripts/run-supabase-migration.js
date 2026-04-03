#!/usr/bin/env node

/**
 * Run SQL migration using Supabase CLI
 *
 * Usage:
 *   node scripts/run-supabase-migration.js
 */

console.log('🚀 Running migration via Supabase CLI...\n')

const { spawn } = require('child_process').spawn

// Step 1: Check if Supabase CLI is installed
console.log('Checking for Supabase CLI...')
const checkCli = spawn('npm', ['list', '-g', '@supabase/supabase'])
checkCli.on('close', (code) => {
  if (code !== 0) {
    console.log('✓ Supabase CLI is installed')
    runMigration()
  } else {
    console.error('❌ Supabase CLI is not installed')
    console.error('\nPlease install it first:')
    console.log('  npm install -g @supabase/supabase')
    console.log('  Then run this script again.')
    process.exit(1)
  }
})

function runMigration() {
  console.log('\nStep 2: Running migration...')

  const migration = spawn('supabase', ['db', 'push', '--file', 'supabase/migrations/20260402000001_sms_consent_column.sql'])

  migration.stdout.on('data', (data) => {
    console.log(data.toString())
  })

  migration.stderr.on('data', (data) => {
    console.error('Error:', data.toString())
  })

  migration.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ SUCCESS: Migration completed!\n')
      console.log('\n📋 What was done:')
      console.log('  • Added sms_consent column (BOOLEAN, default: false)')
      console.log('  • Added sms_consent_at column (TIMESTAMPTZ)')
      console.log('\n✨ Your signup page at /signup now has SMS consent checkbox!')
      console.log('\n\n📝 Documentation available in docs/SUPABASE_MIGRATION_GUIDE_EN.md')
    } else {
      console.log(`\n❌ FAILED: Migration failed with code: ${code}`)
      console.log('\n💡 Try manual method:')
      console.log('  1. Go to https://supabase.com/dashboard')
      console.log(' 2. Find your lawndesk project')
      console.log(' 3. Click "SQL Editor"')
      console.log(' 4. Paste and run the migration SQL')
    }
  })
}

checkCli.on('error', (err) => {
  console.error('Setup error:', err.message)
  console.log('\nOr manually run:')
  console.log('  supabase db push --file supabase/migrations/20260402000001_sms_consent_column.sql')
  process.exit(1)
})
