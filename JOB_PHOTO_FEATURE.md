# Job Photo Documentation Feature

A new before-and-after photo documentation system for tracking job progress and results.

## Features

✅ **Before & After Photos** - Capture professional before-and-after shots for each job
✅ **Secure Storage** - Photos stored securely in Supabase Storage with user isolation
✅ **Easy Upload** - Simple drag-and-drop or click-to-upload interface
✅ **Photo Gallery** - Side-by-side before/after view for quick comparison
✅ **Delete Management** - Remove photos when needed
✅ **Integrated UI** - Seamlessly integrated into the Jobs management page

## How to Use

### 1. Initial Setup (Admin Task)
First, set up the database and storage:
- Follow the instructions in [JOB_PHOTOS_SETUP.md](./JOB_PHOTOS_SETUP.md)
- This creates the `job_photos` table and `job-photos` storage bucket

### 2. Uploading Photos
1. Go to the **Jobs** page (`/jobs`)
2. Click **"✏️ Add/View Photos"** on any job card
3. This opens the job editor with a photo upload section
4. Upload before and after photos:
   - Click "📸 Before Photo" to upload a before image
   - Click "✨ After Photo" to upload an after image
5. View the photos in the gallery below
6. Click **"💾 Save Changes"** to save any job updates

### 3. Viewing Photos
- Photos display as a side-by-side gallery
- Each photo is labeled (Before/After)
- Full-size images are shown inline

### 4. Deleting Photos
- In the photo gallery, click **"Delete"** under any photo to remove it
- Photos are removed from both storage and database

## File Structure

```
├── lib/
│   └── jobPhotos.ts              # Helper functions for photo management
├── components/
│   ├── JobPhotoUpload.tsx         # Upload component for before/after photos
│   └── JobPhotoGallery.tsx        # Display component for photo gallery
├── app/
│   └── jobs/
│       └── page.tsx              # Updated to include photo UI
└── JOB_PHOTOS_SETUP.md           # Database & storage setup instructions
JOB_PHOTO_FEATURE.md              # This file
```

## Technical Details

### Database Schema
```sql
-- job_photos table
- id: UUID (primary key)
- job_id: UUID (references Jobs table)
- user_id: UUID (references auth.users)
- photo_type: 'before' | 'after'
- storage_path: string (path to photo in storage)
- created_at: timestamp
```

### Storage Structure
Photos are organized by user and job:
```
job-photos/
└── {user_id}/
    └── {job_id}/
        ├── before-{timestamp}.jpg
        └── after-{timestamp}.jpg
```

### Functions

**`uploadJobPhoto(jobId, userId, file, photoType)`**
- Uploads a photo to storage and records metadata in database
- Validates file is an image (max 5MB)
- Returns JobPhoto object on success

**`getJobPhotos(jobId)`**
- Fetches all photos for a specific job
- Returns array of JobPhoto objects

**`getJobPhotoPair(jobId)`**
- Convenience function to get before and after photos separately
- Returns `{ before: JobPhoto | null, after: JobPhoto | null }`

**`getPhotoUrl(storagePath)`**
- Generates a public URL for displaying a photo
- Used for image tags

**`deleteJobPhoto(photoId, storagePath)`**
- Deletes photo from both storage and database
- Returns boolean success status

## Security

✅ **User Isolation** - Users can only access their own photos
✅ **File Validation** - Only images are accepted, max 5MB per file
✅ **Storage Policies** - RLS (Row Level Security) enforces access control
✅ **Public URLs** - Photos are readable but only users can upload/delete

## Limitations & Future Enhancements

- **Single before/after pair per job** - Currently stores only one before and one after photo
  - Future: Support multiple photos per job (progress tracking)
- **No image editing** - Photos uploaded as-is
  - Future: Add basic crop/rotate editing
- **Browser storage only** - No mobile app optimization yet
  - Future: Optimize for mobile photo capture

## API Integration Points

### Supabase Tables
- `Jobs` - Existing jobs table (no changes)
- `job_photos` - New table for photo metadata

### Supabase Storage
- Bucket: `job-photos` (private)
- Accessible only to authenticated users who own the photos

## Troubleshooting

**Q: Photos won't upload**
A: Check that the `job-photos` storage bucket exists and policies are configured. See [JOB_PHOTOS_SETUP.md](./JOB_PHOTOS_SETUP.md)

**Q: Can't see uploaded photos**
A: Verify the `job_photos` table exists and permissions are correct

**Q: Upload is very slow**
A: Check your internet speed. Large files (>5MB) are rejected. Compress images before uploading.

**Q: Delete not working**
A: Ensure you have the `job_photos` delete policy configured in Supabase

## Next Steps

1. Follow setup instructions in [JOB_PHOTOS_SETUP.md](./JOB_PHOTOS_SETUP.md)
2. Test uploading a photo to a job
3. Verify photos appear correctly
4. Share with team and gather feedback
5. Consider enhancements (multiple photos, comments, sharing, etc.)
