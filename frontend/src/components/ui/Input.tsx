import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute inset-y-0 left-3 flex items-center text-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary",
              "placeholder:text-muted",
              "transition-colors",
              "focus:border-authentication-blue focus:outline-none focus:ring-2 focus:ring-authentication-blue/20",
              hasError && "border-danger focus:border-danger focus:ring-danger/20",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              "disabled:cursor-not-allowed disabled:bg-soft-surface disabled:text-muted",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 right-3 flex items-center text-muted">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
