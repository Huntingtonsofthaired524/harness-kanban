import { createParamDecorator } from '@nestjs/common'

export type AuthOrganizationOptions = Record<string, never>

export const AuthWorkspaceId = createParamDecorator(
  (data: AuthOrganizationOptions): typeof data extends undefined ? string : string | null => {
    return 'default-workspace-id'
  },
)
