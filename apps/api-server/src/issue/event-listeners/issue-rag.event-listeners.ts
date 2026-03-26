import { ISSUE_EVENTS } from '@/event-bus/constants/event.constants'
import { IssueCreatedEvent, IssueDeletedEvent, IssueUpdatedEvent } from '@/event-bus/types/event.types'
import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { IssueRagService } from '../services/issue-rag.service'

@Injectable()
export class IssueRagEventListeners {
  private readonly logger = new Logger(IssueRagEventListeners.name)

  constructor(private readonly issueRagService: IssueRagService) {}

  @OnEvent(ISSUE_EVENTS.ISSUE_CREATED)
  async syncOnIssueCreated(event: IssueCreatedEvent): Promise<void> {
    try {
      await Promise.all(event.issues.map(issue => this.issueRagService.upsertIssueDocument(issue.issueId)))
    } catch (error) {
      this.logger.error(`Failed to sync issue documents on create event: ${(error as Error).message}`)
    }
  }

  @OnEvent(ISSUE_EVENTS.ISSUE_UPDATED)
  async syncOnIssueUpdated(event: IssueUpdatedEvent): Promise<void> {
    try {
      const changedPropertyIds = event.updatedPropertyIds ?? []
      const shouldSync = await this.issueRagService.hasSearchablePropertyChanges(changedPropertyIds)
      if (!shouldSync) {
        return
      }

      await this.issueRagService.upsertIssueDocument(event.issueId)
    } catch (error) {
      this.logger.error(`Failed to sync issue documents on update event: ${(error as Error).message}`)
    }
  }

  @OnEvent(ISSUE_EVENTS.ISSUE_DELETED)
  async syncOnIssueDeleted(event: IssueDeletedEvent): Promise<void> {
    try {
      await this.issueRagService.deleteIssueDocument(event.issueId)
    } catch (error) {
      this.logger.error(`Failed to sync issue documents on delete event: ${(error as Error).message}`)
    }
  }
}
