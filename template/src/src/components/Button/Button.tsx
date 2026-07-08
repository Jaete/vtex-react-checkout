import { SpinnerIcon } from '~components/Icons'
import type { ButtonProps } from './Button.types'
import styles from './Button.module.scss'

function Button({
  children,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  loading = false,
  type = 'button',
  disabled = false,
  className = '',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], fullWidth ? styles.fullWidth : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading && <SpinnerIcon className={styles.spinner} pathClassName={styles.spinnerPath} />}
      <span className={loading ? styles.hidden : styles.content}>{children}</span>
    </button>
  )
}

export default Button
