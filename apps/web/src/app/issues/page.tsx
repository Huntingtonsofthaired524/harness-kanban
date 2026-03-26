import { NextPage } from 'next'
import { redirect } from 'next/navigation'

const IssueListRoute: NextPage = () => {
  return redirect('/projects')
}

export default IssueListRoute
