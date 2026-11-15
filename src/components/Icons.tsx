// Inline SVG icons: 16px, 1.8 stroke, round caps, currentColor. Decorative by default.
type P = { className?: string; title?: string };

function Svg({ className, title, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      // shrink-0: in a tight flex row an icon must never be squeezed to a dot (audit 2026-11-15).
      className={`shrink-0 ${className ?? ""}`}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const IconUp = (p: P) => <Svg {...p}><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></Svg>;
export const IconDown = (p: P) => <Svg {...p}><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" /></Svg>;
export const IconX = (p: P) => <Svg {...p}><path d="M4 4l8 8M12 4l-8 8" /></Svg>;
export const IconPlus = (p: P) => <Svg {...p}><path d="M8 3v10M3 8h10" /></Svg>;
export const IconClock = (p: P) => <Svg {...p}><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.5" /></Svg>;
export const IconMenu = (p: P) => <Svg {...p}><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" /></Svg>;
export const IconBack = (p: P) => <Svg {...p}><path d="M10 3.5 5.5 8l4.5 4.5" /></Svg>;
export const IconChart = (p: P) => <Svg {...p}><path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5" /></Svg>;
export const IconUndo = (p: P) => <Svg {...p}><path d="M5 6.5H10a3 3 0 0 1 0 6H7M5 6.5 7.5 4M5 6.5 7.5 9" /></Svg>;
export const IconUser = (p: P) => <Svg {...p}><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13.5c.8-2.4 2.7-3.5 5-3.5s4.2 1.1 5 3.5" /></Svg>;
export const IconAlert = (p: P) => <Svg {...p}><path d="M8 2.5 14 13H2L8 2.5Z" /><path d="M8 6.5v3M8 11.3v.2" /></Svg>;
