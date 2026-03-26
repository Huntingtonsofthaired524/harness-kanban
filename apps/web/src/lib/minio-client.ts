import { CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3'

const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
const endpoint = `${protocol}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
const publicBaseUrl = process.env.MINIO_PUBLIC_BASE_URL?.trim() || endpoint

export const s3Client = new S3Client({
  endpoint,
  region: 'us-east-1', // MinIO doesn't use regions, but required by SDK
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
})

export const BUCKET_NAME = process.env.MINIO_BUCKET!

export function getPublicUrl(key: string): string {
  return `${publicBaseUrl}/${BUCKET_NAME}/${key}`
}

// Cache bucket existence check to avoid repeated API calls
let bucketExists: boolean | undefined

// Ensure bucket exists and is public
export async function ensureBucket(): Promise<void> {
  // Return early if already confirmed to exist in this process
  if (bucketExists) {
    return
  }

  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }))
    bucketExists = true
  } catch {
    // Bucket doesn't exist, create it
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }))

    // Set bucket policy to allow public read access
    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    }

    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(publicReadPolicy),
      }),
    )

    bucketExists = true
  }
}
