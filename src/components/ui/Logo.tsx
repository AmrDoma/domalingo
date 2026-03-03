import * as React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  /** Compact mode: show only the circle icon, no wordmark */
  iconOnly?: boolean;
}

export function Logo({ iconOnly = false, ...props }: LogoProps) {
  if (iconOnly) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" {...props}>
        <defs>
          <clipPath id="circleClipIcon">
            <circle cx={60} cy={60} r={45} />
          </clipPath>
        </defs>
        <circle cx={60} cy={60} r={45} fill="#0077B6" />
        <g clipPath="url(#circleClipIcon)">
          <path
            d="M 0 65 Q 30 45 60 65 T 120 65 L 120 120 L 0 120 Z"
            fill="#00B4D8"
          />
          <path
            d="M 0 85 Q 30 65 60 85 T 120 85 L 120 120 L 0 120 Z"
            fill="#90E0EF"
          />
        </g>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 120"
      width="100%"
      height="100%"
      {...props}
    >
      <defs>
        <clipPath id="circleClip">
          <circle cx={60} cy={60} r={45} />
        </clipPath>
      </defs>
      <circle cx={60} cy={60} r={45} fill="#0077B6" />
      <g clipPath="url(#circleClip)">
        <path
          d="M 0 65 Q 30 45 60 65 T 120 65 L 120 120 L 0 120 Z"
          fill="#00B4D8"
        />
        <path
          d="M 0 85 Q 30 65 60 85 T 120 85 L 120 120 L 0 120 Z"
          fill="#90E0EF"
        />
      </g>
      <text
        x={125}
        y={75}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={800}
        fontSize={42}
        fill="#03045E"
      >
        {"DomaLingo"}
      </text>
    </svg>
  );
}
