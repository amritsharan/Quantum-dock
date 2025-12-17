import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function QuantumDockLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>QuantumDock Logo</title>
      {/* Outer Circle for 'Q' */}
      <circle cx="12" cy="12" r="9" />
      {/* Tail for 'Q' */}
      <line x1="16" y1="16" x2="20" y2="20" />
      
      {/* Atom symbol inside */}
      <ellipse cx="12" cy="12" rx="2.5" ry="6" />
      <ellipse cx="12" cy="12" rx="6" ry="2.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="6" ry="2.5" transform="rotate(-60 12 12)" />
    </svg>
  );
}
