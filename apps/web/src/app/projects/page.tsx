import { NextPage } from 'next'
import { Suspense } from 'react'

import { GlobalLoading } from '@/components/common/global-loading'
import { ProjectListPage } from '@/project/pages/list-page'
import { RedirectToSignIn, SignedIn, SignedOut } from '@daveyplate/better-auth-ui'

const ProjectListRoute: NextPage = () => {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <Suspense fallback={<GlobalLoading />}>
          <ProjectListPage />
        </Suspense>
      </SignedIn>
    </>
  )
}

export default ProjectListRoute
