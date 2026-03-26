import { OnEvent } from '@nestjs/event-emitter'
import type { IssueEventNames } from '../constants/event.constants'

export const OnTxEvent = (event: IssueEventNames): MethodDecorator =>
  OnEvent(event, { async: false, suppressErrors: false })
