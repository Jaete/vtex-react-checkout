import type { TextInputProps } from './TextInput.types'
import styles from './TextInput.module.scss'

function TextInput({
  fluid = true,
  type = 'text',
  className = '',
  ...rest
}: TextInputProps) {
  const classes = [styles.input, fluid ? styles.fluid : '', className]
    .filter(Boolean)
    .join(' ')

  return <input type={type} className={classes} {...rest} />
}

export default TextInput
