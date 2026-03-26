'use client'

import { SignedIn } from '@daveyplate/better-auth-ui'
import { SideChat } from './side-chat'

export function AuthenticatedSideChat() {
  return (
    <SignedIn>
      <SideChat />
    </SignedIn>
  )
}
