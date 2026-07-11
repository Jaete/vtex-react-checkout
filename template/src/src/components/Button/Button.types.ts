import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  /** Aparência (cores): `secondary` (neutro) ou `primary` (rosa da marca). */
  variant?: 'primary' | 'secondary'
  /** Dimensão (altura/padding/tipografia). `xl` é o maior — CTA de finalizar. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Ocupa 100% da largura disponível. */
  fullWidth?: boolean
  /** Exibe spinner e desabilita o botão enquanto uma ação assíncrona corre. */
  loading?: boolean
}
