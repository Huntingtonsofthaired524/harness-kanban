import {
  CommentPropertyRegistryEntry,
  CommentPropertyValueType,
  CommentTabGroup,
  CommentTheme,
  CommentThemeConfig,
} from './types'

const commentPropertyRegistry = new Map<string, CommentPropertyRegistryEntry>()
const commentTabGroups = new Map<string, CommentTabGroup>()
const commentThemes = new Map<string, CommentThemeConfig>()

export const registerCommentProperty = (entry: CommentPropertyRegistryEntry) => {
  commentPropertyRegistry.set(entry.id, entry)
}

export const getCommentProperty = (propertyId: string): CommentPropertyRegistryEntry | undefined => {
  return commentPropertyRegistry.get(propertyId)
}

export const getCommentPropertiesByData = (
  data: Record<string, CommentPropertyValueType>,
): CommentPropertyRegistryEntry[] => {
  const properties: CommentPropertyRegistryEntry[] = []

  for (const key of Object.keys(data)) {
    const property = commentPropertyRegistry.get(key)
    if (property) {
      // Check if property should be displayed based on current data
      if (!property.shouldDisplay || property.shouldDisplay(data)) {
        properties.push(property)
      }
    }
  }

  return properties.sort((a, b) => (a.meta.display?.order ?? 0) - (b.meta.display?.order ?? 0))
}

export const getAllCommentProperties = (): CommentPropertyRegistryEntry[] => {
  return Array.from(commentPropertyRegistry.values())
}

export const registerCommentTabGroup = (group: CommentTabGroup) => {
  commentTabGroups.set(group.id, group)
}

export const getCommentTabGroups = (): CommentTabGroup[] => {
  return Array.from(commentTabGroups.values())
}

export const getCommentTabGroup = (id: string): CommentTabGroup | undefined => {
  return commentTabGroups.get(id)
}

export const registerCommentTheme = (config: CommentThemeConfig) => {
  commentThemes.set(config.id, config)
}

export const getCommentTheme = (data: Record<string, CommentPropertyValueType>): CommentTheme | undefined => {
  if (!data || Object.keys(data).length === 0) {
    return undefined
  }

  for (const themeConfig of commentThemes.values()) {
    const propertyValue = data[themeConfig.propertyId]

    if (propertyValue === undefined || propertyValue === null) {
      continue
    }

    if (themeConfig.matcher(propertyValue)) {
      return themeConfig.theme
    }
  }

  return undefined
}

export const getDisplayCommentProperties = (
  data: Record<string, CommentPropertyValueType>,
): CommentPropertyRegistryEntry[] => {
  const properties = getCommentPropertiesByData(data)
  const themePropertyIds = new Set(Array.from(commentThemes.values()).map(theme => theme.propertyId))

  return properties.filter(property => !themePropertyIds.has(property.id))
}
