import { createBrowserRouter } from 'react-router'
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage'
import { LoginPage } from '../features/auth/LoginPage'
import { NewPasswordPage } from '../features/auth/NewPasswordPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'

// Las direcciones van en español: la persona las ve en el navegador y en los mails.
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <HomePage />
      </RequireAuth>
    ),
  },
  { path: '/ingresar', element: <LoginPage /> },
  { path: '/recuperar-contrasena', element: <ForgotPasswordPage /> },
  { path: '/nueva-contrasena', element: <NewPasswordPage /> },
  { path: '*', element: <NotFoundPage /> },
])
