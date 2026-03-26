import { AppModule } from '@/app.module'
import { CHROMA_COLLECTIONS } from '@/chroma/chroma.constants'
import { ChromaCollectionService } from '@/chroma/chroma.service'
import { ApiExceptionFilter } from '@/common/filters/api-exception.filter'
import { PrismaService } from '@/database/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { CommonPropertyOperationType, SystemPropertyId } from '@repo/shared/property/constants'
import { loginUser, SupertestAgent } from './utils/auth-helper'

describe.skip('Issue RAG Sync (e2e)', () => {
  let app: INestApplication
  let agent: SupertestAgent
  let prismaService: PrismaService
  let chromaCollectionService: ChromaCollectionService

  const waitFor = async (assertion: () => Promise<void>, timeoutMs = 3000, intervalMs = 50) => {
    const deadline = Date.now() + timeoutMs
    let lastError: unknown

    while (Date.now() < deadline) {
      try {
        await assertion()
        return
      } catch (error) {
        lastError = error
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
    }

    throw lastError
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalFilters(new ApiExceptionFilter())
    await app.init()

    prismaService = app.get(PrismaService)
    chromaCollectionService = app.get(ChromaCollectionService)
    agent = await loginUser(app, 'e2e-user@example.com', 'temppassword')
  })

  afterAll(async () => {
    await app.close()
  })

  it('should keep chroma issue document in sync on create, update and delete', async () => {
    const initialTitle = `rag-initial-${Date.now()}`
    const updatedTitle = `rag-updated-${Date.now()}`

    const createResponse = await agent
      .post('/api/v1/issues')
      .send({
        issue: {
          propertyValues: [
            {
              propertyId: SystemPropertyId.TITLE,
              value: initialTitle,
            },
            {
              propertyId: SystemPropertyId.DESCRIPTION,
              value: 'description for rag sync test',
            },
          ],
        },
      })
      .expect(201)

    const issueId = createResponse.body.data.issueId as number
    const issueRecord = await prismaService.client.issue.findUnique({
      where: { id: issueId },
      select: { workspace_id: true },
    })

    expect(issueRecord?.workspace_id).toBeTruthy()

    const collection = await chromaCollectionService.getCollection(CHROMA_COLLECTIONS.ISSUES)
    const getIssueDocument = async () => {
      const queryResult = await collection.get({
        ids: [issueId.toString()],
        include: ['documents', 'metadatas'],
      })
      if (queryResult.ids.length === 0) {
        return undefined
      }

      return {
        document: queryResult.documents[0] ?? null,
        metadata: (queryResult.metadatas[0] as Record<string, unknown> | null) ?? null,
      }
    }

    await waitFor(async () => {
      const issueDocument = await getIssueDocument()
      expect(issueDocument?.document).toContain(initialTitle)
      expect(issueDocument?.metadata?.workspaceId).toBe(issueRecord?.workspace_id)
      expect(issueDocument?.metadata?.issueId).toBe(issueId)
    })

    await agent
      .put(`/api/v1/issues/${issueId}`)
      .send({
        operations: [
          {
            propertyId: SystemPropertyId.TITLE,
            operationType: CommonPropertyOperationType.SET,
            operationPayload: { value: updatedTitle },
          },
        ],
      })
      .expect(200)

    await waitFor(async () => {
      const issueDocument = await getIssueDocument()
      expect(issueDocument?.document).toContain(updatedTitle)
      expect(issueDocument?.document).not.toContain(initialTitle)
    })

    await agent.delete(`/api/v1/issues/${issueId}`).expect(200)

    await waitFor(async () => {
      expect(await getIssueDocument()).toBeUndefined()
    })
  })
})
