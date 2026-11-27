import { createBrowserRouter } from 'react-router'
import { AuditPage } from '../features/audit/AuditPage'
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage'
import { LoginPage } from '../features/auth/LoginPage'
import { NewPasswordPage } from '../features/auth/NewPasswordPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { InstitutionGate } from '../features/institutions/InstitutionGate'
import { NewPatientPage } from '../features/patients/NewPatientPage'
import { PatientPage } from '../features/patients/PatientPage'
import { PatientsPage } from '../features/patients/PatientsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { AppLayout } from './AppLayout'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'

// Las direcciones van en español: la persona las ve en el navegador y en los mails.
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <InstitutionGate>
          <AppLayout />
        </InstitutionGate>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'pacientes', element: <PatientsPage /> },
      { path: 'pacientes/nuevo', element: <NewPatientPage /> },
      { path: 'pacientes/:patientId', element: <PatientPage /> },
      { path: 'auditoria', element: <AuditPage /> },
      { path: 'configuracion', element: <SettingsPage /> },
    ],
  },
  { path: '/ingresar', element: <LoginPage /> },
  { path: '/recuperar-contrasena', element: <ForgotPasswordPage /> },
  { path: '/nueva-contrasena', element: <NewPasswordPage /> },
  { path: '*', element: <NotFoundPage /> },
])
