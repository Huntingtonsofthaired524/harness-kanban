import { NextPage } from 'next'
import { Suspense } from 'react'

import { GlobalLoading } from '@/components/common/global-loading'
import { NewIssuePage } from '@/issue/pages/create-page'

const IssueCreationRoute: NextPage = () => {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <NewIssuePage />
    </Suspense>
  )
}

export default IssueCreationRoute
