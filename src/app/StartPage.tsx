/** Pantalla provisoria hasta que exista el inicio de sesión (sesión 3). */
export function StartPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-card border border-line bg-surface p-8 text-center shadow-card">
        <img src="/brand/ronda-logotipo.svg" alt="Ronda" className="mx-auto h-[30px]" />
        <h1 className="mt-6 text-[1.6rem] font-semibold">Estamos armando Ronda</h1>
        <p className="mt-2 text-ink-2">
          Pronto vas a poder iniciar sesión y ver tu día desde acá.
        </p>
      </section>
    </main>
  )
}
