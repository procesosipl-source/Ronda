import type { ReactNode } from 'react'

const toneClasses = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
} as const

interface NoticeProps {
  tone: keyof typeof toneClasses
  children: ReactNode
}

/** Aviso dentro de un formulario. El color acompaña al texto, nunca lo reemplaza. */
export function Notice({ tone, children }: NoticeProps) {
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-control px-3 py-2.5 text-[0.84rem] ${toneClasses[tone]}`}
    >
      {children}
    </p>
  )
}

/** Clases del botón principal (uno por pantalla, docs/diseno.md). */
export const primaryButtonClass =
  'h-11 rounded-control bg-primary font-semibold text-primary-ink hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70'

/** Clases del enlace o botón terciario. */
export const tertiaryButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-control px-3 text-[0.84rem] font-semibold text-primary hover:bg-primary-soft'
