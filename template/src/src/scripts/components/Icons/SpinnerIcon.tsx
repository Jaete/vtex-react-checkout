import type { SVGProps } from 'react';

interface SpinnerIconProps extends SVGProps<SVGSVGElement> {
  pathClassName?: string;
}

function SpinnerIcon({ pathClassName, ...props }: SpinnerIconProps) {
  return (
    <svg viewBox="0 0 50 50" aria-hidden="true" {...props}>
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        strokeWidth={5}
        stroke="currentColor"
        strokeLinecap="round"
        className={pathClassName}
      />
    </svg>
  );
}

export default SpinnerIcon;
