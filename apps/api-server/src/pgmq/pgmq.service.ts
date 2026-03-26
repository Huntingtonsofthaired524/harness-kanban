import { PrismaService } from '@/database/prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@repo/database'
import type { PgmqMessage } from './pgmq.types'

@Injectable()
export class PgmqService {
  private readonly logger = new Logger(PgmqService.name)
  private extensionInitializationPromise: Promise<void> | null = null
  private readonly queueInitializationPromises = new Map<string, Promise<void>>()

  constructor(private readonly prisma: PrismaService) {}

  async ensureQueue(queueName: string): Promise<void> {
    let initializationPromise = this.queueInitializationPromises.get(queueName)

    if (!initializationPromise) {
      initializationPromise = this.initializeQueue(queueName).catch(error => {
        this.queueInitializationPromises.delete(queueName)
        throw error
      })
      this.queueInitializationPromises.set(queueName, initializationPromise)
    }

    await initializationPromise
  }

  async send<TPayload>(queueName: string, payload: TPayload): Promise<number> {
    await this.ensureQueue(queueName)

    const [result] = await this.prisma.client.$queryRaw<Array<{ message_id: bigint | number }>>(Prisma.sql`
      SELECT pgmq.send(
        ${queueName}::text,
        ${JSON.stringify(payload)}::jsonb
      ) AS message_id
    `)

    return Number(result.message_id)
  }

  async read<TPayload>(
    queueName: string,
    options: {
      batchSize: number
      visibilityTimeoutSeconds: number
    },
  ): Promise<Array<PgmqMessage<TPayload>>> {
    await this.ensureQueue(queueName)

    return this.prisma.client.$queryRaw<Array<PgmqMessage<TPayload>>>(Prisma.sql`
      SELECT msg_id, read_ct, enqueued_at, vt, message
      FROM pgmq.read(
        ${queueName}::text,
        ${options.visibilityTimeoutSeconds}::integer,
        ${options.batchSize}::integer
      )
    `)
  }

  async archive(queueName: string, messageId: number): Promise<boolean> {
    await this.ensureQueue(queueName)

    const [result] = await this.prisma.client.$queryRaw<Array<{ archived: boolean }>>(Prisma.sql`
      SELECT pgmq.archive(
        ${queueName}::text,
        ${messageId}::bigint
      ) AS archived
    `)

    return result.archived
  }

  private async initializeQueue(queueName: string): Promise<void> {
    try {
      await this.ensureExtension()
      await this.prisma.client.$executeRaw(Prisma.sql`SELECT pgmq.create(${queueName}::text)`)
      this.logger.log(`Queue ${queueName} is ready`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to initialize pgmq queue "${queueName}": ${message}`)
    }
  }

  private async ensureExtension(): Promise<void> {
    if (!this.extensionInitializationPromise) {
      this.extensionInitializationPromise = this.prisma.client
        .$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pgmq')
        .then(() => undefined)
        .catch(error => {
          this.extensionInitializationPromise = null
          throw error
        })
    }

    await this.extensionInitializationPromise
  }
}
