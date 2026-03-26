import { NextPage } from 'next'
import { redirect } from 'next/navigation'

const HomePage: NextPage = () => {
  return redirect('/projects')
}

export default HomePage
