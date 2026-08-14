import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-pitch text-white shadow-sm hover:bg-pitch-dark hover:shadow-md active:shadow-sm disabled:shadow-none disabled:opacity-50",
  secondary:
    "bg-white text-ink border border-line shadow-sm hover:border-pitch/40 hover:bg-pitch-dim active:shadow-none disabled:shadow-none",
  ghost:
    "bg-transparent text-ink hover:bg-pitch-dim",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
