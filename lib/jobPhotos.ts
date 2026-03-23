import { supabase } from './supabase'

export interface JobPhoto {
  id: string
  job_id: string
  user_id: string
  photo_type: 'before' | 'after' // before or after photo
  storage_path: string
  created_at: string
}

/**
 * Upload a photo for a job (before or after)
 * Requires Supabase Storage bucket: "job-photos"
 */
export async function uploadJobPhoto(
  jobId: string,
  userId: string,
  file: File,
  photoType: 'before' | 'after'
): Promise<JobPhoto | null> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      throw new Error('File size must be less than 5MB')
    }

    // Create unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `${userId}/${jobId}/${photoType}-${timestamp}.${fileExtension}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    // Store photo metadata in database
    const { data: photoData, error: dbError } = await supabase
      .from('job_photos')
      .insert({
        job_id: jobId,
        user_id: userId,
        photo_type: photoType,
        storage_path: data.path,
      })
      .select()
      .single()

    if (dbError) {
      throw dbError
    }

    return photoData as JobPhoto
  } catch (error) {
    console.error('Error uploading photo:', error)
    return null
  }
}

/**
 * Get all photos for a specific job
 */
export async function getJobPhotos(jobId: string): Promise<JobPhoto[]> {
  try {
    const { data, error } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return (data || []) as JobPhoto[]
  } catch (error) {
    console.error('Error fetching photos:', error)
    return []
  }
}

/**
 * Get public URL for a photo from storage
 */
export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('job-photos')
    .getPublicUrl(storagePath)
  return data.publicUrl
}

/**
 * Delete a photo by ID
 */
export async function deleteJobPhoto(photoId: string, storagePath: string): Promise<boolean> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('job-photos')
      .remove([storagePath])

    if (storageError) {
      throw storageError
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('job_photos')
      .delete()
      .eq('id', photoId)

    if (dbError) {
      throw dbError
    }

    return true
  } catch (error) {
    console.error('Error deleting photo:', error)
    return false
  }
}

/**
 * Get before and after photos separately for easy display
 */
export async function getJobPhotoPair(jobId: string): Promise<{
  before: JobPhoto | null
  after: JobPhoto | null
}> {
  const photos = await getJobPhotos(jobId)
  return {
    before: photos.find((p) => p.photo_type === 'before') || null,
    after: photos.find((p) => p.photo_type === 'after') || null,
  }
}
