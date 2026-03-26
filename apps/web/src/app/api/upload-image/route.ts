import { format } from 'date-fns'
import { nanoid } from 'nanoid'

import { BUCKET_NAME, getPublicUrl, s3Client } from '@/lib/minio-client'
import { PutObjectCommand } from '@aws-sdk/client-s3'

const env = process.env.NODE_ENV === 'development' ? 'dev' : 'prod'

const createUploadImagePath = (env: string, filename: string) => {
  const filenameSanitized = filename.replace(/\s+/g, '-')
  const uploadTimestamp = format(new Date(), 'yyyyMMddHHmmss')
  return `${env}/${uploadTimestamp}/${nanoid(6)}-${filenameSanitized}`
}

export const POST = async (request: Request) => {
  if (!request.body) {
    return Response.json({ message: 'No file data in request body' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return Response.json({ message: 'No file found in FormData' }, { status: 400 })
  }

  const uploadImagePath = createUploadImagePath(env, file.name)

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: uploadImagePath,
        Body: buffer,
        ContentType: file.type,
      }),
    )

    const url = getPublicUrl(uploadImagePath)
    return Response.json({ url, pathname: uploadImagePath })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ message: `Failed to upload file: ${message}` }, { status: 500 })
  }
}
