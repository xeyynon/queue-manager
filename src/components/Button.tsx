import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface-2 text-ink hover:bg-line",
  ghost: "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-transparent text-danger-ink hover:bg-surface-2",
};

const SIZE: Record<Size, string> = {
  // 24px+ on desktop, 44px under coarse pointers (touch).
  sm: "h-8 px-2.5 text-sm gap-1.5 pointer-coarse:h-11 pointer-coarse:min-w-11",
  md: "h-10 px-4 text-sm gap-2 pointer-coarse:h-11",
  lg: "h-12 px-5 text-base gap-2",
  xl: "h-16 px-6 text-lg gap-3",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return [
    "inline-flex items-center justify-center rounded-md font-medium select-none",
    "transition-[background-color,color,transform] duration-100 ease-out",
    "disabled:opacity-50 disabled:cursor-not-allowed aria-busy:cursor-progress aria-busy:opacity-80",
    VARIANT[variant],
    SIZE[size],
    extra,
  ].join(" ");
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; busy?: boolean };

export function Button({ variant, size, busy, className = "", type = "button", children, ...rest }: Props) {
  return (
    <button type={type} aria-busy={busy || undefined} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
