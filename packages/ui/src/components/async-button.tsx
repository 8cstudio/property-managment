"use client";

import type { MouseEvent } from "react";
import { usePendingAction } from "../hooks/use-pending-action";
import { Button, type ButtonProps } from "./button";

type AsyncButtonProps = Omit<ButtonProps, "onClick" | "loading"> & {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  /** Override auto loading from `usePendingAction`. */
  loading?: boolean;
};

export function AsyncButton({
  onClick,
  loading: loadingOverride,
  disabled,
  ...props
}: AsyncButtonProps) {
  const { pending, run } = usePendingAction();

  return (
    <Button
      {...props}
      disabled={disabled}
      loading={loadingOverride ?? pending}
      onClick={(event) => {
        if (!onClick) return;
        void run(() => onClick(event));
      }}
    />
  );
}
