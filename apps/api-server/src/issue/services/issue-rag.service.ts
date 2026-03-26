import { CHROMA_COLLECTIONS } from '@/chroma/chroma.constants'
import { ChromaCollectionService } from '@/chroma/chroma.service'
import { PrismaService } from '@/database/prisma.service'
import { Injectable } from '@nestjs/common'
import { PropertyType } from '@repo/shared/property/constants'

const SEARCHABLE_PROPERTY_TYPES = [PropertyType.TITLE, PropertyType.RICH_TEXT] as const

@Injectable()
export class IssueRagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chromaCollectionService: ChromaCollectionService,
  ) {}

  async upsertIssueDocument(issueId: number): Promise<void> {
    const issue = await this.prisma.client.issue.findUnique({
      where: { id: issueId },
      select: {
        id: true,
        workspace_id: true,
        deleted_at: true,
      },
    })

    if (!issue || issue.deleted_at || !issue.workspace_id) {
      await this.deleteIssueDocument(issueId)
      return
    }

    const searchableProperties = await this.getSearchableProperties()
    if (searchableProperties.length === 0) {
      return
    }

    const propertyValues = await this.prisma.client.property_single_value.findMany({
      where: {
        issue_id: issueId,
        property_id: { in: searchableProperties.map(property => property.id) },
        deleted_at: null,
      },
      select: {
        property_id: true,
        value: true,
      },
    })

    const valueByPropertyId = new Map(
      propertyValues
        .filter(propertyValue => propertyValue.value !== null && propertyValue.value.trim().length > 0)
        .map(propertyValue => [propertyValue.property_id, propertyValue.value!.trim()]),
    )

    const documentPayload: Record<string, string> = {}
    const usedKeys = new Set<string>()
    for (const property of searchableProperties) {
      const value = valueByPropertyId.get(property.id)
      if (!value) {
        continue
      }

      // Normalize property name to use as key (property names are unique within a workspace)
      const normalizedName = property.name.trim().replace(/\s+/g, '-')
      const preferredKey = normalizedName.length > 0 ? normalizedName : property.id
      const key = usedKeys.has(preferredKey) ? `${preferredKey}_${property.id}` : preferredKey

      usedKeys.add(key)
      documentPayload[key] = value
    }

    if (Object.keys(documentPayload).length === 0) {
      await this.deleteIssueDocument(issueId)
      return
    }

    const collection = await this.chromaCollectionService.getCollection(CHROMA_COLLECTIONS.ISSUES)
    const documentText = JSON.stringify(documentPayload)
    await collection.upsert({
      ids: [issueId.toString()],
      documents: [documentText],
      metadatas: [
        {
          workspaceId: issue.workspace_id,
          issueId: issue.id,
        },
      ],
    })
  }

  async deleteIssueDocument(issueId: number): Promise<void> {
    const collection = await this.chromaCollectionService.getCollection(CHROMA_COLLECTIONS.ISSUES)
    await collection.delete({
      ids: [issueId.toString()],
    })
  }

  async searchIssueIds(
    workspaceId: string,
    query: string,
    options?: {
      limit?: number
      offset?: number
    },
  ): Promise<{ ids: number[]; total: number }> {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return { ids: [], total: 0 }
    }

    // Normalize limit: default to 5, max 50
    const limit = options?.limit && options.limit >= 1 ? Math.min(options.limit, 50) : 5
    const offset = Math.max(options?.offset ?? 0, 0)
    const nResults = Math.min(limit + offset, 100)

    const collection = await this.chromaCollectionService.getCollection(CHROMA_COLLECTIONS.ISSUES)
    const queryResult = await collection.query({
      queryTexts: [normalizedQuery],
      nResults,
      where: {
        workspaceId,
      },
    })

    const rankedIssueIds = (queryResult.ids[0] ?? [])
      .map(id => Number.parseInt(id, 10))
      .filter(id => Number.isFinite(id))

    const uniqueIssueIds = Array.from(new Set(rankedIssueIds))
    const pageIssueIds = uniqueIssueIds.slice(offset, offset + limit)

    return {
      ids: pageIssueIds,
      total: uniqueIssueIds.length,
    }
  }

  async hasSearchablePropertyChanges(updatedPropertyIds: string[]): Promise<boolean> {
    if (updatedPropertyIds.length === 0) {
      return false
    }

    const count = await this.prisma.client.property.count({
      where: {
        id: { in: updatedPropertyIds },
        type: { in: [...SEARCHABLE_PROPERTY_TYPES] },
        deleted_at: null,
      },
    })

    return count > 0
  }

  private async getSearchableProperties(): Promise<Array<{ id: string; name: string }>> {
    return this.prisma.client.property.findMany({
      where: {
        type: { in: [...SEARCHABLE_PROPERTY_TYPES] },
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: 'asc',
      },
    })
  }
}
