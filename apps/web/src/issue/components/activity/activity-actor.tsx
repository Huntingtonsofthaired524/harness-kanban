import React from 'react'

import { UserDisplay } from '@/components/common/user-display'

interface ActivityActorProps {
  userId: string
}

export const ActivityActor: React.FC<ActivityActorProps> = ({ userId }) => {
  return <UserDisplay userId={userId} />
}
