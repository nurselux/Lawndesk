'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import { getJobPhotoPair, getPhotoUrl, deleteJobPhoto, JobPhoto } from '../lib/jobPhotos'

interface JobPhotoGalleryProps {
  jobId: string
  onPhotoDeleted?: () => void
}

export default function JobPhotoGallery({ jobId, onPhotoDeleted }: JobPhotoGalleryProps) {
  const [before, setBefore] = useState<JobPhoto | null>(null)
  const [after, setAfter] = useState<JobPhoto | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [jobId])

  const loadPhotos = async () => {
    setLoading(true)
    const photos = await getJobPhotoPair(jobId)
    setBefore(photos.before)
    setAfter(photos.after)
    setLoading(false)
  }

  const handleDelete = async (photo: JobPhoto) => {
    setDeleting(photo.id)
    const success = await deleteJobPhoto(photo.id, photo.storage_path)
    if (success) {
      if (photo.photo_type === 'before') {
        setBefore(null)
      } else {
        setAfter(null)
      }
      onPhotoDeleted?.()
    }
    setDeleting(null)
  }

  if (loading) {
    return <div className="text-center text-gray-400">Loading photos...</div>
  }

  if (!before && !after) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-400">📷 No photos yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📸 Job Photos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Photo */}
        <div className="space-y-2">
          {before ? (
            <>
              <div className="relative">
                <NextImage
                  src={getPhotoUrl(before.storage_path)}
                  alt="Before"
                  width={600}
                  height={192}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  📸 Before
                </span>
              </div>
              <button
                onClick={() => handleDelete(before)}
                disabled={deleting === before.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {deleting === before.id ? 'Deleting...' : 'Delete'}
              </button>
            </>
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No before photo</span>
            </div>
          )}
        </div>

        {/* After Photo */}
        <div className="space-y-2">
          {after ? (
            <>
              <div className="relative">
                <NextImage
                  src={getPhotoUrl(after.storage_path)}
                  alt="After"
                  width={600}
                  height={192}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  ✨ After
                </span>
              </div>
              <button
                onClick={() => handleDelete(after)}
                disabled={deleting === after.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {deleting === after.id ? 'Deleting...' : 'Delete'}
              </button>
            </>
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No after photo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
