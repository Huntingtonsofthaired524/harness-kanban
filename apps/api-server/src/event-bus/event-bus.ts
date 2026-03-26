import { EventEmitter2 } from '@nestjs/event-emitter'
import { Prisma } from '@repo/database'
import { IssueEventNames } from './constants/event.constants'

export const emit = (eventEmitter: EventEmitter2, eventName: IssueEventNames, event: any) => {
  eventEmitter.emit(eventName, event)
}

export const emitInTx = async (
  eventEmitter: EventEmitter2,
  tx: Prisma.TransactionClient,
  eventName: IssueEventNames,
  event: any,
) => {
  await eventEmitter.emitAsync(eventName, {
    tx,
    ...event,
  })
}
