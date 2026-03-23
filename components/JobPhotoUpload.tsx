'use client'

import { useState, useRef } from 'react'
import { uploadJobPhoto } from '../lib/jobPhotos'

interface JobPhotoUploadProps {
  jobId: string
  userId: string | undefined
  photoType: 'before' | 'after'
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function JobPhotoUpload({
  jobId,
  userId,
  photoType,
  onSuccess,
  onError,
}: JobPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Show preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    const result = await uploadJobPhoto(jobId, userId, file, photoType)

    if (result) {
      onSuccess?.()
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      onError?.('Failed to upload photo')
    }
    setUploading(false)
  }

  const label = photoType === 'before' ? '📸 Before Photo' : '✨ After Photo'
  const emoji = photoType === 'before' ? '📸' : '✨'

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading || !userId}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !userId}
          className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="text-gray-600">Uploading... ⏳</span>
          ) : preview ? (
            <span className="text-green-600 font-semibold">✓ Ready to upload</span>
          ) : (
            <span className="text-gray-600">
              Click to upload {emoji}
            </span>
          )}
        </button>
      </div>
      {preview && (
        <div className="mt-3">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-40 object-cover rounded-lg border border-gray-200"
          />
        </div>
      )}
    </div>
  )
}
