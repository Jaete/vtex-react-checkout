import type { SectionTitleProps } from './SectionTitle.types';
import styles from './SectionTitle.module.scss';

function SectionTitle({ children, as: Tag = 'h3', className = '' }: SectionTitleProps) {
  return <Tag className={`${styles.title} ${className}`.trim()}>{children}</Tag>;
}

export default SectionTitle;
