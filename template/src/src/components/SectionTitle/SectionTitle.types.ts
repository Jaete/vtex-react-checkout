import type { ReactNode } from 'react';

export interface SectionTitleProps {
  children: ReactNode;
  /** Tag semântica do heading (padrão `h3`). */
  as?: 'h2' | 'h3' | 'h4';
  className?: string;
}
