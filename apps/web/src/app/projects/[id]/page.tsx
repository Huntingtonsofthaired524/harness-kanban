import { Suspense } from 'react'

import { GlobalLoading } from '@/components/common/global-loading'
import { ProjectDetailPage } from '@/project/pages/detail-page'

const ProjectDetailRoute = () => {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <ProjectDetailPage />
    </Suspense>
  )
}

export default ProjectDetailRoute
