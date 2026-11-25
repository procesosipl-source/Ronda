import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  description?: string
  children: ReactNode
}

/** Tarjeta centrada con el logo, para las pantallas fuera de la aplicación (ingreso, contraseña). */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <section className="w-full max-w-[400px] rounded-card border border-line bg-surface p-7 shadow-card sm:p-8">
        <img src="/brand/ronda-logotipo.svg" alt="Ronda" className="h-[30px]" />
        <h1 className="mt-7 text-[1.6rem] font-semibold">{title}</h1>
        {description !== undefined && <p className="mt-1 text-ink-2">{description}</p>}
        <div className="mt-6">{children}</div>
      </section>
      <p className="mt-6 text-[0.76rem] text-ink-3">Ronda · IPL – Ingeniería de Procesos Luján</p>
    </main>
  )
}
