import { Suspense } from 'react'

import { GlobalLoading } from '@/components/common/global-loading'
import { DetailPage } from '@/issue/pages/detail-page'

const IssueDetailRoute = () => {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <DetailPage />
    </Suspense>
  )
}

export default IssueDetailRoute
