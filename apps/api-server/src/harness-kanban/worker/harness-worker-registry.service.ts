import { PrismaService } from '@/database/prisma.service'
import { SystemBotId } from '@/user/constants/user.constants'
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common'
import { Prisma } from '@repo/database'
import { SystemPropertyId } from '@repo/shared/property/constants'
import { HarnessWorkerDevpodService } from './harness-worker-devpod.service'
import {
  DEFAULT_HARNESS_WORKER_HEARTBEAT_INTERVAL_MS,
  HARNESS_WORKER_BUSY_STATUS,
  HARNESS_WORKER_IDLE_STATUS,
  HARNESS_WORKER_QUEUED_ISSUE_STATUS,
} from './harness-worker.constants'

export type HarnessWorkerClaim = {
  issueId: number
  workspaceId: string
}

@Injectable()
export class HarnessWorkerRegistryService implements OnApplicationShutdown {
  private readonly logger = new Logger(HarnessWorkerRegistryService.name)
  private workerId: string | null = null
  private claimedIssueId: number | null = null
  private workerStatus = HARNESS_WORKER_IDLE_STATUS
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isShuttingDown = false

  constructor(
    private readonly prisma: PrismaService,
    private readonly devpodService: HarnessWorkerDevpodService,
  ) {}

  get currentWorkerId(): string | null {
    return this.workerId
  }

  get currentIssueId(): number | null {
    return this.claimedIssueId
  }

  get currentStatus(): string {
    return this.workerStatus
  }

  async register(): Promise<string> {
    if (this.workerId) {
      return this.workerId
    }

    const worker = await this.prisma.client.harness_worker.create({
      data: {
        devpod_metadata: Prisma.DbNull,
        issue_id: null,
        status: HARNESS_WORKER_IDLE_STATUS,
        last_updated_at: new Date(),
      },
    })

    this.workerId = worker.id
    this.startHeartbeat()
    this.logger.log(`Registered worker ${worker.id}`)

    return worker.id
  }

  async claimNextQueuedIssue(): Promise<HarnessWorkerClaim | null> {
    if (!this.workerId) {
      throw new Error('Cannot claim queued issues before worker registration')
    }

    const workerId = this.workerId
    const claim = await this.prisma.client.$transaction(async tx => {
      const now = new Date()

      // TODO shouldn't hard code the priority values here, and also the long sql is a minor problem as well.
      const [candidate] = await tx.$queryRaw<Array<{ id: number; workspace_id: string }>>(Prisma.sql`
        SELECT issue.id, issue.workspace_id
        FROM issue
        INNER JOIN property_single_value status_value
          ON status_value.issue_id = issue.id
          AND status_value.property_id = ${SystemPropertyId.STATUS}
          AND status_value.value = ${HARNESS_WORKER_QUEUED_ISSUE_STATUS}
          AND status_value.deleted_at IS NULL
        INNER JOIN property_single_value assignee_value
          ON assignee_value.issue_id = issue.id
          AND assignee_value.property_id = ${SystemPropertyId.ASSIGNEE}
          AND assignee_value.value = ${SystemBotId.CODE_BOT}
          AND assignee_value.deleted_at IS NULL
        INNER JOIN property_single_value project_value
          ON project_value.issue_id = issue.id
          AND project_value.property_id = ${SystemPropertyId.PROJECT}
          AND project_value.value IS NOT NULL
          AND project_value.value <> ''
          AND project_value.deleted_at IS NULL
        LEFT JOIN property_single_value priority_value
          ON priority_value.issue_id = issue.id
          AND priority_value.property_id = ${SystemPropertyId.PRIORITY}
          AND priority_value.deleted_at IS NULL
        LEFT JOIN harness_workers worker
          ON worker.issue_id = issue.id
        WHERE issue.deleted_at IS NULL
          AND issue.workspace_id IS NOT NULL
          AND worker.issue_id IS NULL
        ORDER BY
          CASE priority_value.value
            WHEN 'urgent' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
            WHEN 'no-priority' THEN 4
            ELSE 5
          END ASC,
          issue.created_at ASC,
          issue.id ASC
        LIMIT 1
        FOR UPDATE OF issue SKIP LOCKED
      `)

      if (!candidate) {
        return null
      }

      const updateResult = await tx.harness_worker.updateMany({
        where: {
          id: workerId,
          issue_id: null,
        },
        data: {
          devpod_metadata: Prisma.DbNull,
          issue_id: candidate.id,
          status: HARNESS_WORKER_BUSY_STATUS,
          last_updated_at: now,
        },
      })

      if (updateResult.count !== 1) {
        return null
      }

      return {
        issueId: candidate.id,
        workspaceId: candidate.workspace_id,
      }
    })

    if (!claim) {
      return null
    }

    this.setClaimedIssueId(claim.issueId)
    return claim
  }

  async releaseClaim(): Promise<void> {
    if (!this.workerId) {
      throw new Error('Cannot release claim before worker registration')
    }

    await this.prisma.client.harness_worker.update({
      where: { id: this.workerId },
      data: {
        devpod_metadata: Prisma.DbNull,
        issue_id: null,
        status: HARNESS_WORKER_IDLE_STATUS,
        last_updated_at: new Date(),
      },
    })

    this.clearClaimedIssueId()
  }

  async heartbeat(): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    if (!this.workerId) {
      throw new Error('Cannot update heartbeat before worker registration')
    }

    try {
      await this.prisma.client.harness_worker.update({
        where: { id: this.workerId },
        data: {
          issue_id: this.claimedIssueId,
          status: this.workerStatus,
          last_updated_at: new Date(),
        },
      })
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : null
      if (code === 'P2025') {
        return
      }

      throw error
    }
  }

  stopHeartbeat(): void {
    if (!this.heartbeatTimer) {
      return
    }

    clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  async onApplicationShutdown(): Promise<void> {
    this.isShuttingDown = true
    this.stopHeartbeat()

    const workerId = this.workerId
    const claimedIssueId = this.claimedIssueId
    this.workerId = null
    this.claimedIssueId = null
    this.workerStatus = HARNESS_WORKER_IDLE_STATUS

    if (claimedIssueId !== null) {
      const workspaceName = this.devpodService.getWorkspaceNameForIssue(claimedIssueId)

      try {
        await this.devpodService.deleteWorkspace(workspaceName)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.error(`Failed to delete DevPod workspace ${workspaceName} on shutdown: ${message}`)
      }
    }

    if (!workerId) {
      return
    }

    try {
      await this.prisma.client.harness_worker.delete({
        where: { id: workerId },
      })
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : null
      if (code === 'P2025') {
        return
      }

      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to delete worker row on shutdown: ${message}`)
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isShuttingDown) {
        return
      }

      void this.heartbeat().catch(error => {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.error(`Failed to update worker heartbeat: ${message}`)
      })
    }, DEFAULT_HARNESS_WORKER_HEARTBEAT_INTERVAL_MS)
  }

  private setClaimedIssueId(issueId: number): void {
    this.claimedIssueId = issueId
    this.workerStatus = HARNESS_WORKER_BUSY_STATUS
  }

  private clearClaimedIssueId(): void {
    this.claimedIssueId = null
    this.workerStatus = HARNESS_WORKER_IDLE_STATUS
  }
}
