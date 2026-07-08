import type { SVGProps } from 'react';

function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="120" height="34" viewBox="0 0 120 34" fill="none" role="img" aria-label="Econverse" {...props}>
      <rect width="120" height="34" rx="4" fill="#f71963" />
      <text
        x="50%"
        y="60%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="Fabriga, sans-serif"
        fontWeight="800"
        fontSize="16"
      >
        ECONVERSE
      </text>
    </svg>
  );
}

export default LogoIcon;
