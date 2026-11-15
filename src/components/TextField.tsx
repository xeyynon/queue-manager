import type { ComponentProps } from "react";

type Props = ComponentProps<"input"> & {
  label: string;
  error?: string | null;
  hint?: string;
  hideLabel?: boolean;
};

export function TextField({ label, error, hint, hideLabel, id, className = "", ...rest }: Props) {
  const inputId = id ?? `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const describedBy = [error ? `${inputId}-err` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : "text-sm font-medium text-ink-2"}>
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          "h-10 w-full min-w-0 rounded-md border border-field-line bg-surface-2 px-3 text-ink placeholder:text-ink-3",
          "outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent pointer-coarse:h-11",
          error ? "outline-2 outline-danger-ink" : "",
        ].join(" ")}
        {...rest}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-err`} role="alert" className="text-sm font-medium text-danger-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
