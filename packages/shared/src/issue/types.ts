import { PropertyType } from '../property/constants'

export type ActivityPayload =
  | Comment
  | CreateIssueActivityPayload
  | ClearPropertyValueActivityPayload
  | SetPropertyValueActivityPayload

export interface Activity {
  id: string
  issueId: number
  type: string
  payload: ActivityPayload
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface Comment {
  id: string
  issueId: number
  content: string
  createdBy: string // user id
  parentId?: string | null // parent comment id
  createdAt: number // unix timestamp, milliseconds
  updatedAt: number // unix timestamp, milliseconds

  subComments?: Comment[]
}

export type CreateIssueActivityPayload = {
  userId: string
}

export type ClearPropertyValueActivityPayload = {
  userId: string
  propertyId: string
  propertyType: PropertyType
  propertyName: string
}

export type SetPropertyValueActivityPayload = {
  userId: string
  propertyId: string
  propertyType: PropertyType
  propertyName: string
  newValue: unknown
}
