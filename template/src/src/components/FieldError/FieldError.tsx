import { AlertCircleIcon } from '~components/Icons';
import type { FieldErrorProps } from './FieldError.types';
import styles from './FieldError.module.scss';

function FieldError({ children, className = '' }: FieldErrorProps) {
  return (
    <div className={`${styles.error} ${className}`.trim()} role="alert">
      <AlertCircleIcon width={14} height={14} />
      <span>{children}</span>
    </div>
  );
}

export default FieldError;
