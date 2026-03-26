import { AppModule } from '@/app.module'
import { ApiExceptionFilter } from '@/common/filters/api-exception.filter'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { InboxNotificationListItem, NotificationType } from '@repo/shared'
import { CommonPropertyOperationType, SystemPropertyId } from '@repo/shared/property/constants'
import { loginUser, SupertestAgent } from './utils/auth-helper'

import request = require('supertest')

type InboxResponse = {
  items: InboxNotificationListItem[]
  nextCursor: string | null
}

const assertNotificationType = <TType extends NotificationType>(
  item: InboxNotificationListItem | undefined,
  type: TType,
): Extract<InboxNotificationListItem, { type: TType }> => {
  if (!item || item.type !== type) {
    throw new Error(`Expected notification type ${type}`)
  }

  return item as Extract<InboxNotificationListItem, { type: TType }>
}

const richTextDoc = (text: string) =>
  JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text,
          },
        ],
      },
    ],
  })

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('Notification inbox (e2e)', () => {
  let app: INestApplication
  let actorAgent: SupertestAgent
  let subscriberAgent: SupertestAgent
  let subscriberId: string

  const createIssue = async (agent: SupertestAgent, title: string) => {
    const response = await agent
      .post('/api/v1/issues')
      .send({
        issue: {
          propertyValues: [
            {
              propertyId: SystemPropertyId.TITLE,
              value: title,
            },
          ],
        },
      })
      .expect(201)

    return response.body.data.issueId as number
  }

  const subscribeUserToIssue = async (issueId: number, userId: string) => {
    await actorAgent
      .post(`/api/v1/issues/${issueId}/activities/subscribers`)
      .send({
        userIds: [userId],
      })
      .expect(201)
  }

  const getUnreadCount = async (agent: SupertestAgent) => {
    const response = await agent.get('/api/v1/notifications/inbox/unread-count').expect(200)
    return response.body.data.unreadCount as number
  }

  const listInbox = async (agent: SupertestAgent) => {
    const response = await agent.get('/api/v1/notifications/inbox?limit=10').expect(200)
    return response.body.data as InboxResponse
  }

  const markAllRead = async (agent: SupertestAgent) => {
    await agent.patch('/api/v1/notifications/inbox/read-all').expect(200)
  }

  const waitForUnreadCount = async (agent: SupertestAgent, expectedCount: number, timeoutMs = 3000) => {
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeoutMs) {
      const unreadCount = await getUnreadCount(agent)
      if (unreadCount === expectedCount) {
        return unreadCount
      }

      await sleep(100)
    }

    return getUnreadCount(agent)
  }

  const drainInbox = async (agent: SupertestAgent) => {
    await markAllRead(agent)
    await sleep(150)
    await markAllRead(agent)
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalFilters(new ApiExceptionFilter())
    await app.init()

    actorAgent = await loginUser(app, 'e2e-user@example.com', 'temppassword')

    const subscriberEmail = `notifications-${Date.now()}@example.com`
    const subscriberName = 'Notifications Subscriber'

    await request(app.getHttpServer()).post('/api/auth/sign-up/email').send({
      email: subscriberEmail,
      password: 'temppassword',
      name: subscriberName,
      callbackURL: '/',
    })

    subscriberAgent = await loginUser(app, subscriberEmail, 'temppassword')

    const usersResponse = await subscriberAgent.get('/api/v1/users').expect(200)
    const subscriber = (usersResponse.body.data.users as Array<{ id: string; username: string }>).find(
      user => user.username === subscriberName,
    )

    if (!subscriber) {
      throw new Error('Failed to locate notification subscriber test user')
    }

    subscriberId = subscriber.id
  })

  beforeEach(async () => {
    await drainInbox(actorAgent)
    await drainInbox(subscriberAgent)
  })

  afterAll(async () => {
    await app.close()
  })

  it('delivers issue update notifications to subscribers and supports mark-read APIs', async () => {
    const issueId = await createIssue(actorAgent, `notification-update-${Date.now()}`)
    await subscribeUserToIssue(issueId, subscriberId)

    await actorAgent
      .put(`/api/v1/issues/${issueId}`)
      .send({
        operations: [
          {
            propertyId: SystemPropertyId.TITLE,
            operationType: CommonPropertyOperationType.SET,
            operationPayload: {
              value: `notification-update-${Date.now()}-edited`,
            },
          },
        ],
      })
      .expect(200)

    expect(await waitForUnreadCount(actorAgent, 0)).toBe(0)
    expect(await waitForUnreadCount(subscriberAgent, 1)).toBe(1)

    const inbox = await listInbox(subscriberAgent)
    const unreadItem = assertNotificationType(
      inbox.items.find(item => item.readAt === null),
      NotificationType.ISSUE_UPDATED,
    )

    expect(unreadItem.payload.issue.issueId).toBe(issueId)
    expect(unreadItem.payload.changedProperties.map(property => property.name)).toContain('Title')

    await subscriberAgent.patch(`/api/v1/notifications/inbox/${unreadItem.deliveryId}/read`).expect(200)

    expect(await getUnreadCount(subscriberAgent)).toBe(0)
    const refreshedInbox = await listInbox(subscriberAgent)
    const refreshedItem = refreshedInbox.items.find(item => item.deliveryId === unreadItem.deliveryId)
    expect(refreshedItem?.readAt).not.toBeNull()
  })

  it('delivers top-level comment notifications to issue subscribers and excludes the actor', async () => {
    const issueId = await createIssue(actorAgent, `notification-comment-${Date.now()}`)
    await subscribeUserToIssue(issueId, subscriberId)

    await actorAgent
      .post(`/api/v1/issues/${issueId}/comments`)
      .send({
        content: richTextDoc('The incident has a new diagnostic note.'),
      })
      .expect(201)

    expect(await waitForUnreadCount(actorAgent, 0)).toBe(0)
    expect(await waitForUnreadCount(subscriberAgent, 1)).toBe(1)

    const inbox = await listInbox(subscriberAgent)
    const unreadItem = assertNotificationType(
      inbox.items.find(item => item.readAt === null),
      NotificationType.COMMENT_CREATED,
    )

    expect(unreadItem.payload.issue.issueId).toBe(issueId)
    expect(unreadItem.payload.comment.excerpt).toContain('new diagnostic note')
  })

  it('delivers reply notifications to parent comment subscribers', async () => {
    const issueId = await createIssue(actorAgent, `notification-reply-${Date.now()}`)

    const topLevelCommentResponse = await subscriberAgent
      .post(`/api/v1/issues/${issueId}/comments`)
      .send({
        content: richTextDoc('I can reproduce this on the staging build.'),
      })
      .expect(201)

    const parentCommentId = topLevelCommentResponse.body.data.comment.id as string

    await markAllRead(actorAgent)
    await markAllRead(subscriberAgent)

    await actorAgent
      .post(`/api/v1/issues/${issueId}/comments`)
      .send({
        content: richTextDoc('Thanks, I am checking the deployment logs now.'),
        parentId: parentCommentId,
      })
      .expect(201)

    expect(await waitForUnreadCount(subscriberAgent, 1)).toBe(1)

    const inbox = await listInbox(subscriberAgent)
    const unreadItem = assertNotificationType(
      inbox.items.find(item => item.readAt === null),
      NotificationType.COMMENT_CREATED,
    )

    expect(unreadItem.payload.comment.parentId).toBe(parentCommentId)
    expect(unreadItem.payload.comment.excerpt).toContain('deployment logs')
  })

  it('keeps issue delete notifications readable after the issue row is removed', async () => {
    const title = `notification-delete-${Date.now()}`
    const issueId = await createIssue(actorAgent, title)
    await subscribeUserToIssue(issueId, subscriberId)

    await actorAgent.delete(`/api/v1/issues/${issueId}`).expect(200)

    expect(await waitForUnreadCount(actorAgent, 0)).toBe(0)
    expect(await waitForUnreadCount(subscriberAgent, 1)).toBe(1)

    const inbox = await listInbox(subscriberAgent)
    const unreadItem = assertNotificationType(
      inbox.items.find(item => item.readAt === null),
      NotificationType.ISSUE_DELETED,
    )

    expect(unreadItem.payload.issue.issueId).toBe(issueId)
    expect(unreadItem.payload.issue.title).toBe(title)
  })
})
