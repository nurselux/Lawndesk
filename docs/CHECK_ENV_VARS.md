# How to Check Your Environment Variables

## Quick Check

### Check if variables are set:

**Option 1: Check system environment variables**
- On Windows: Command Prompt → `set` → Search for "SUPABASE_URL" and "SUPABASE_ANON_KEY"

**Option 2: Check .env file**
- If `.env` file exists in project root, open and check

**Option 3: Check Vercel deployment**
- If deployed to Vercel: Project Settings → Environment Variables

---

## What the Scripts Expect

Your migration scripts expect these variables to be available:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

If you're running locally (`npm run dev`), Next.js uses:
- `.env.local` file (highest priority)
- `.env` file
- System environment variables (Vercel/production)

---

## How to Fix

### If variables are not found:

**Option A: Create .env file manually**
```bash
# On Windows
# Using PowerShell
Copy-ItemProperty .env.example .env

# Then edit and save
```

**Option B: Use system environment variables (if deployed)**
Go to your Supabase Dashboard → Settings → Environment Variables
Copy the values and set them in Vercel

---

## After Configuring

Once your environment variables are set, run:

```bash
npm run apply-migration-direct
```

This should succeed! ✅
