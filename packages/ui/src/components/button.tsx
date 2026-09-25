"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn--primary refresh",
      ghost: "btn--ghost ghost",
      side: "btn--side side-out",
      danger: "btn--danger",
    },
    size: {
      default: "",
      sm: "btn--sm",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    children?: ReactNode;
    /** Shows spinner and disables interaction. */
    loading?: boolean;
    /** Label while loading; defaults to `children`. */
    loadingText?: ReactNode;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const isDisabled = Boolean(disabled || loading);

  if (asChild) {
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      type={type}
      className={cn(
        buttonVariants({ variant, size }),
        loading && "btn--loading",
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="btn__spinner" aria-hidden />
          <span className="btn__label">{loadingText ?? children}</span>
        </>
      ) : (
        <span className="btn__label">{children}</span>
      )}
    </Comp>
  );
}
