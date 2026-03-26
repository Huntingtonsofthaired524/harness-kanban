import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')

    // Initialize MinIO bucket on startup
    const { ensureBucket } = await import('@/lib/minio-client')
    await ensureBucket().catch(err => {
      console.error('Failed to initialize MinIO bucket:', err)
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
