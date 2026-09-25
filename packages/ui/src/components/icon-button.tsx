"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export function IconButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={cn("icon-btn", className)} {...props}>
      {children}
    </button>
  );
}
