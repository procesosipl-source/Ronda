import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * Modal para crear o confirmar algo corto (docs/diseno.md: máximo ~560 px, radio de 14 px).
 * Usa el <dialog> del navegador: atrapa el foco, se cierra con Escape y bloquea el fondo.
 */
export function Modal({ title, open, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog === null) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="modal-title"
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-modal border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-ink/40"
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-[1.2rem] font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mt-1 -mr-2 flex size-9 items-center justify-center rounded-control text-ink-3 hover:bg-sunk"
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  )
}
