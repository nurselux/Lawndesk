# Job Photos Setup Guide

This document explains how to set up the photo documentation feature for jobs.

## Quick Setup (Automated) ⚡

If you have your Supabase credentials in a `.env` file:

1. **Copy your `.env` to the Codespace:**
   ```bash
   # On your local machine, copy your .env to the Codespace
   # Or use GitHub Codespaces secrets
   ```

2. **Run the setup script:**
   ```bash
   npm install  # Install dependencies including tsx
   npm run setup-photos
   ```

That's it! ✅ The script will:
- ✅ Create the `job_photos` table
- ✅ Create the `job-photos` storage bucket  
- ✅ Configure storage policies
- ✅ Enable Row Level Security

---

## Manual Setup (Supabase Dashboard)

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create job_photos table
CREATE TABLE IF NOT EXISTS job_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES "Jobs"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  
  -- Ensure one before and one after photo per job
  UNIQUE(job_id, photo_type)
);

-- Create index for faster queries
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_job_photos_user_id ON job_photos(user_id);
```

## 2. Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name it: `job-photos`
4. Make it **Private** (for security)
5. Click "Create bucket"

## 3. Set Storage Bucket Policies

In Supabase Dashboard → Storage → job-photos → Policies:

**Allow authenticated users to upload photos:**

```sql
-- Create a policy that allows users to upload photos
-- Name: Users can upload their own photos
CREATE POLICY "Users can upload photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'job-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Allow authenticated users to read their own photos:**

```sql
-- Name: Users can read their own photos
CREATE POLICY "Users can read their photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'job-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Allow authenticated users to delete their own photos:**

```sql
-- Name: Users can delete their photos
CREATE POLICY "Users can delete their photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'job-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 4. Verify Setup

- [ ] `job_photos` table created in your database
- [ ] `job-photos` storage bucket exists and is private
- [ ] Storage policies are configured (3 policies)
- [ ] Your app successfully runs `npm run dev` without errors

## 5. Test the Feature

1. Navigate to the Jobs page (`/jobs`)
2. Click on any job or create a new one
3. Click "✏️ Edit Job" button
4. Scroll down to find "📸 Job Photos" section
5. Upload before and after photos
6. View photos in the gallery

## Troubleshooting

**Photos not uploading?**
- Check storage bucket permissions
- Verify storage policies are in place
- Check browser console for errors

**Table creation failed?**
- Ensure your Supabase user has permissions to create tables
- Check that table names match exactly

**Permission denied errors?**
- Verify that RLS (Row Level Security) is enabled on the `job_photos` table
- Confirm storage policies are correctly formatted
