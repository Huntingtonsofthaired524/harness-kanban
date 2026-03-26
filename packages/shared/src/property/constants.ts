/**
 * System predefined property ids (users-created properties' ids would be dynamically generated)
 */
export enum SystemPropertyId {
  ID = 'property0001',
  TITLE = 'property0002',
  STATUS = 'property0003',
  CREATED_AT = 'property0004',
  UPDATED_AT = 'property0005',
  DESCRIPTION = 'property0006',
  PRIORITY = 'property0007',
  ASSIGNEE = 'property0012',
  REPORTER = 'property0013',
  PROJECT = 'property0014',

  // 1001-9999 reserved for custom predefined properties
  RESOLVED_AT = 'property1003',
}

/**
 * Property type constants
 */
export enum PropertyType {
  ID = 'id',
  TITLE = 'title',
  STATUS = 'status',
  SELECT = 'select',
  DATETIME = 'datetime',
  RICH_TEXT = 'rich_text',
  PLUGIN = 'plugin',
  USER = 'user',
  NUMBER = 'number',
  PROJECT = 'project',
}

/**
 * Mapping of system property IDs to property types
 */
export const PROPERTY_ID_TYPE_MAP = {
  [SystemPropertyId.ID]: PropertyType.ID,
  [SystemPropertyId.TITLE]: PropertyType.TITLE,
  [SystemPropertyId.STATUS]: PropertyType.STATUS,
  [SystemPropertyId.CREATED_AT]: PropertyType.DATETIME,
  [SystemPropertyId.UPDATED_AT]: PropertyType.DATETIME,
  [SystemPropertyId.DESCRIPTION]: PropertyType.RICH_TEXT,
  [SystemPropertyId.PRIORITY]: PropertyType.SELECT,
  [SystemPropertyId.ASSIGNEE]: PropertyType.USER,
  [SystemPropertyId.REPORTER]: PropertyType.USER,
  [SystemPropertyId.PROJECT]: PropertyType.PROJECT,
  [SystemPropertyId.RESOLVED_AT]: PropertyType.DATETIME,
} as const satisfies Record<SystemPropertyId, PropertyType>

export const NUMBER_VALUE_TYPES = [PropertyType.ID, PropertyType.DATETIME, PropertyType.NUMBER] as PropertyType[]

// there are only single-value and multi-value types so far,
// thus if a property is not in this list, it is a multi-value property
export const SINGLE_VALUE_PROPERTY_TYPES = [
  PropertyType.ID,
  PropertyType.TITLE,
  PropertyType.STATUS,
  PropertyType.SELECT,
  PropertyType.DATETIME,
  PropertyType.RICH_TEXT,
  PropertyType.USER,
  PropertyType.NUMBER,
  PropertyType.PROJECT,
] as PropertyType[]

export const CALCULATED_PROPERTY_TYPES: PropertyType[] = []

export enum FilterOperator {
  Equals = 'equals',
  NotEquals = 'notEquals',
  Contains = 'contains',
  NotContains = 'notContains',
  StartsWith = 'startsWith',
  NotStartsWith = 'notStartsWith',
  EndsWith = 'endsWith',
  NotEndsWith = 'notEndsWith',
  GreaterThan = 'gt',
  GreaterThanOrEqual = 'gte',
  LessThan = 'lt',
  LessThanOrEqual = 'lte',
  Set = 'set',
  NotSet = 'not set',
  HasAnyOf = 'has any of',
  HasNoneOf = 'has none of',
}

export enum CommonPropertyOperationType {
  SET = 'set',
  CLEAR = 'clear',
  ADD = 'add',
  REMOVE = 'remove',
}

// just for reference, not actually used in the code
export const SystemPropertyAlias = {
  [SystemPropertyId.ID]: 'id',
  [SystemPropertyId.TITLE]: 'title',
  [SystemPropertyId.CREATED_AT]: 'createdAt',
  [SystemPropertyId.UPDATED_AT]: 'updatedAt',
  [SystemPropertyId.DESCRIPTION]: 'description',
  [SystemPropertyId.STATUS]: 'status',
  [SystemPropertyId.PRIORITY]: 'priority',
  [SystemPropertyId.ASSIGNEE]: 'assignee',
  [SystemPropertyId.REPORTER]: 'reporter',
  [SystemPropertyId.PROJECT]: 'project',
  [SystemPropertyId.RESOLVED_AT]: 'resolvedAt',
}
