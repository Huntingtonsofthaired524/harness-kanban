import {
  PreCreateIssueHook,
  PreCreateIssueHookContext,
  PreUpdateIssueHook,
  PreUpdateIssueHookContext,
} from '@/issue/types/hook.types'
import { SystemBotId } from '@/user/constants/user.constants'
import { Injectable } from '@nestjs/common'
import { SystemPropertyId } from '@repo/shared/property/constants'
import {
  CANCELED_STATUS_ID,
  CODE_BOT_ASSIGNMENT_ERROR,
  CODE_BOT_REASSIGNMENT_ERROR,
  CODE_BOT_STATUS_ERROR,
  TODO_STATUS_ID,
} from '../constants/code-bot.constants'

// TODO planning, in_progres shouldn't be allowed
const CODE_BOT_ASSIGNABLE_STATUS_IDS = new Set([TODO_STATUS_ID, 'planning', 'in_progress'])

@Injectable()
export class CodeBotCreateHook implements PreCreateIssueHook {
  // Enforces that newly created Code Bot issues start in Todo.
  async execute(context: PreCreateIssueHookContext) {
    const requestedAssigneeValue = context.getRequestedValue(SystemPropertyId.ASSIGNEE)
    const assigneeId =
      typeof requestedAssigneeValue === 'string' && requestedAssigneeValue.length > 0 ? requestedAssigneeValue : null
    if (assigneeId !== SystemBotId.CODE_BOT) {
      return { valid: true }
    }

    const requestedStatusValue = context.getRequestedValue(SystemPropertyId.STATUS)
    const statusId =
      typeof requestedStatusValue === 'string' && requestedStatusValue.length > 0 ? requestedStatusValue : null
    if (statusId === TODO_STATUS_ID) {
      return { valid: true }
    }

    return {
      valid: false,
      errors: [CODE_BOT_ASSIGNMENT_ERROR],
    }
  }
}

@Injectable()
export class CodeBotAssigneeHook implements PreUpdateIssueHook {
  // Limits Code Bot assignment to the statuses where automation can take over.
  async execute(context: PreUpdateIssueHookContext) {
    const nextAssigneeValue = context.getNextSetValue(SystemPropertyId.ASSIGNEE)
    const assigneeId = typeof nextAssigneeValue === 'string' && nextAssigneeValue.length > 0 ? nextAssigneeValue : null
    if (assigneeId !== SystemBotId.CODE_BOT) {
      return { valid: true }
    }

    const currentStatusValue = context.getCurrentValue(SystemPropertyId.STATUS)
    const currentStatusId =
      typeof currentStatusValue === 'string' && currentStatusValue.length > 0 ? currentStatusValue : null
    if (currentStatusId && CODE_BOT_ASSIGNABLE_STATUS_IDS.has(currentStatusId)) {
      return { valid: true }
    }

    return {
      valid: false,
      errors: [CODE_BOT_REASSIGNMENT_ERROR],
    }
  }
}

@Injectable()
export class CodeBotStatusHook implements PreUpdateIssueHook {
  // Prevents humans from changing a Code Bot owned issue except to cancel it.
  async execute(context: PreUpdateIssueHookContext) {
    const nextStatusValue = context.getNextSetValue(SystemPropertyId.STATUS)
    const nextStatusId = typeof nextStatusValue === 'string' && nextStatusValue.length > 0 ? nextStatusValue : null
    if (!nextStatusId) {
      return { valid: true }
    }

    const currentAssigneeValue = context.getCurrentValue(SystemPropertyId.ASSIGNEE)
    const currentAssigneeId =
      typeof currentAssigneeValue === 'string' && currentAssigneeValue.length > 0 ? currentAssigneeValue : null
    if (currentAssigneeId !== SystemBotId.CODE_BOT) {
      return { valid: true }
    }

    if (context.userId === SystemBotId.CODE_BOT) {
      return { valid: true }
    }

    if (nextStatusId === CANCELED_STATUS_ID) {
      return { valid: true }
    }

    return {
      valid: false,
      errors: [CODE_BOT_STATUS_ERROR],
    }
  }
}
