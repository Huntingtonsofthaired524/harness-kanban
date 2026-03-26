import { SystemPropertyId } from './constants'
import type {
  PropertyDefinition,
  ResolvedStatusAction,
  StatusDefinition,
  StatusPropertyConfig,
  StatusTransition,
} from './types'

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const parseStatusDefinition = (value: unknown): StatusDefinition | null => {
  if (!isObject(value)) {
    return null
  }

  const { id, label, icon } = value
  if (typeof id !== 'string' || typeof label !== 'string' || typeof icon !== 'string') {
    return null
  }

  return { id, label, icon }
}

const parseStatusTransition = (value: unknown): StatusTransition | null => {
  if (!isObject(value)) {
    return null
  }

  const { toStatusId, actionLabel } = value
  if (typeof toStatusId !== 'string' || typeof actionLabel !== 'string') {
    return null
  }

  return { toStatusId, actionLabel }
}

export const parseStatusPropertyConfig = (config: unknown): StatusPropertyConfig | null => {
  if (!isObject(config)) {
    return null
  }

  const { initialStatusId, statuses, transitions } = config
  if (typeof initialStatusId !== 'string' || !Array.isArray(statuses) || !isObject(transitions)) {
    return null
  }

  const parsedStatuses = statuses.map(parseStatusDefinition)
  if (parsedStatuses.some(status => status === null)) {
    return null
  }

  const parsedTransitions = Object.fromEntries(
    Object.entries(transitions).map(([statusId, value]) => {
      if (!Array.isArray(value)) {
        return [statusId, null]
      }

      const parsed = value.map(parseStatusTransition)
      if (parsed.some(transition => transition === null)) {
        return [statusId, null]
      }

      return [statusId, parsed]
    }),
  )

  if (Object.values(parsedTransitions).some(value => value === null)) {
    return null
  }

  return {
    initialStatusId,
    statuses: parsedStatuses as StatusDefinition[],
    transitions: parsedTransitions as Record<string, StatusTransition[]>,
  }
}

export const getStatusPropertyConfig = (property: Pick<PropertyDefinition, 'config'>): StatusPropertyConfig | null => {
  return parseStatusPropertyConfig(property.config)
}

export const findStatusDefinition = (
  config: StatusPropertyConfig,
  statusId: string | null | undefined,
): StatusDefinition | null => {
  if (!statusId) {
    return null
  }

  return config.statuses.find(status => status.id === statusId) ?? null
}

export const getStatusTransitions = (
  config: StatusPropertyConfig,
  statusId: string | null | undefined,
): StatusTransition[] => {
  if (!statusId) {
    return []
  }

  return config.transitions[statusId] ?? []
}

export const resolveStatusActions = (
  config: StatusPropertyConfig,
  currentStatusId: string | null | undefined,
): ResolvedStatusAction[] => {
  return getStatusTransitions(config, currentStatusId)
    .map(transition => {
      const definition = findStatusDefinition(config, transition.toStatusId)
      if (!definition) {
        return null
      }

      return {
        ...definition,
        ...transition,
      }
    })
    .filter((action): action is ResolvedStatusAction => action !== null)
}

export const isStatusProperty = (property: Pick<PropertyDefinition, 'id'>): boolean => {
  return property.id === SystemPropertyId.STATUS
}
