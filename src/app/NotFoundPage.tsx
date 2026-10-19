import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-card border border-line bg-surface p-8 text-center shadow-card">
        <h1 className="text-[1.6rem] font-semibold">No encontramos esta página</h1>
        <p className="mt-2 text-ink-2">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-10 items-center rounded-control px-3 font-semibold text-primary hover:bg-primary-soft"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}
