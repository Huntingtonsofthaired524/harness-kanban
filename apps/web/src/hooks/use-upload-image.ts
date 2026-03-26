import { toast } from 'sonner'

import { useMutation } from '@tanstack/react-query'

export const useUploadFileImage = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to upload image')
      }

      const data = await res.json()
      return { url: data.url }
    },

    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Image upload failed: ${message}`)
    },

    onSuccess: _data => {
      toast.success('Image Uploaded successfully')
    },
  })
}

export const useUploadBase64Image = () => {
  return useMutation({
    mutationFn: async (base64: string): Promise<{ url: string }> => {
      const res = await fetch('/api/upload-image-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64 }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to upload image')
      }

      const data = await res.json()
      return { url: data.url }
    },

    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Image upload failed: ${message}`)
    },

    onSuccess: _data => {
      toast.success('Image uploaded successfully')
    },
  })
}
