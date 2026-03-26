'use client'

import { RegisterRenderersDynamically as RegisterPropRenderers } from '@/init-client'

export const ClientInit = () => {
  return (
    <>
      <RegisterPropRenderers />
    </>
  )
}
