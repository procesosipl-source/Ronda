import { useState, type ComponentProps } from 'react'

interface FormFieldProps {
  id: string
  label: string
  error?: string | undefined
  /** Agrega el botón Mostrar / Ocultar (para contraseñas). */
  revealable?: boolean
  /** Atributos del campo, incluido lo que devuelve `register()` de react-hook-form. */
  inputProps: ComponentProps<'input'>
}

/** Campo de formulario con su etiqueta y su mensaje de error debajo. */
export function FormField({ id, label, error, revealable = false, inputProps }: FormFieldProps) {
  const [revealed, setRevealed] = useState(false)
  const hasError = error !== undefined
  const errorId = `${id}-error`
  const type = revealable ? (revealed ? 'text' : 'password') : inputProps.type

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.84rem] font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={type}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={`h-11 w-full rounded-control border bg-surface pl-3 text-ink ${revealable ? 'pr-20' : 'pr-3'} ${
            hasError ? 'border-danger' : 'border-line'
          }`}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setRevealed((visible) => !visible)}
            aria-pressed={revealed}
            aria-label={revealed ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
            className="absolute inset-y-0 right-0 min-w-16 rounded-control px-3 text-[0.84rem] font-semibold text-primary hover:bg-primary-soft"
          >
            {revealed ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>
      {hasError && (
        <p id={errorId} className="text-[0.84rem] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
