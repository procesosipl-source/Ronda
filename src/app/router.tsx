import { createBrowserRouter } from 'react-router'
import { NotFoundPage } from './NotFoundPage'
import { StartPage } from './StartPage'

export const router = createBrowserRouter([
  { path: '/', element: <StartPage /> },
  { path: '*', element: <NotFoundPage /> },
])
