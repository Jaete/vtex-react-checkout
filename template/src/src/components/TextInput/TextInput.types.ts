import type { InputHTMLAttributes } from 'react'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Habilita o preenchimento flexível dentro de um flex container (padrão `true`). */
  fluid?: boolean
}
