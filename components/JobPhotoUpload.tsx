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

async function compressImage(file: File, maxSizeMB = 2): Promise<File> {
  return new Promise((resolve) => {
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size <= maxBytes) { resolve(file); return }

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      const scale = Math.sqrt(maxBytes / file.size)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
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
  const inputId = `photo-upload-${jobId}-${photoType}`

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)

    const compressed = await compressImage(file)
    const result = await uploadJobPhoto(jobId, userId, compressed, photoType)

    if (result) {
      onSuccess?.()
      setPreview(null)
      e.target.value = ''
    } else {
      onError?.('Failed to upload photo')
    }
    setUploading(false)
  }

  const label = photoType === 'before' ? '📸 Before Photo' : '✨ After Photo'
  const emoji = photoType === 'before' ? '📸' : '✨'
  const disabled = uploading || !userId

  return (
    <div className="w-full">
      <p className="block text-sm font-bold text-gray-700 mb-2">{label}</p>

      {/* label wrapping hidden input — reliable on all mobile browsers */}
      <label
        htmlFor={inputId}
        className={`flex-1 w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer block
          ${disabled ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-300 hover:border-green-500'}`}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        {uploading ? (
          <span className="text-gray-600">Uploading... ⏳</span>
        ) : preview ? (
          <span className="text-green-600 font-semibold">✓ Ready to upload</span>
        ) : (
          <span className="text-gray-500">Tap to upload {emoji}</span>
        )}
      </label>

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
