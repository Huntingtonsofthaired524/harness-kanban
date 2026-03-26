import { format } from 'date-fns'
import { nanoid } from 'nanoid'

import { BUCKET_NAME, getPublicUrl, s3Client } from '@/lib/minio-client'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const env = process.env.NODE_ENV === 'development' ? 'dev' : 'prod'

const createUploadImagePath = (env: string, extension: string) => {
  const uploadTimestamp = format(new Date(), 'yyyyMMddHHmmss')
  return `${env}/${uploadTimestamp}/${nanoid(6)}-image.${extension}`
}

const getContentType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    gif: 'image/gif',
  }
  return mimeTypes[extension] || 'image/png'
}

export const POST = async (request: Request) => {
  try {
    const { base64 } = await request.json()

    if (!base64 || typeof base64 !== 'string') {
      return Response.json({ message: 'Missing base64 string in body' }, { status: 400 })
    }

    const matches = base64.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/)

    if (!matches || matches.length !== 3) {
      return Response.json({ message: 'Invalid base64 image format' }, { status: 400 })
    }

    const extension = matches[1]!
    const data = matches[2]!
    const buffer = Buffer.from(data, 'base64')

    const uploadImagePath = createUploadImagePath(env, extension)

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: uploadImagePath,
        Body: buffer,
        ContentType: getContentType(extension),
      }),
    )

    const url = getPublicUrl(uploadImagePath)
    return Response.json({ url, pathname: uploadImagePath })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ message: `Failed to upload image: ${message}` }, { status: 500 })
  }
}
