"use client";

import { useCallback, useState } from "react";

/** Runs an action once with a short pending flag (for button loading states). */
export function usePendingAction(minMs = 320) {
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async (action: () => void | Promise<void>) => {
      if (pending) return;
      setPending(true);
      const started = Date.now();
      try {
        await action();
      } finally {
        const elapsed = Date.now() - started;
        const wait = Math.max(0, minMs - elapsed);
        if (wait > 0) {
          await new Promise((resolve) => setTimeout(resolve, wait));
        }
        setPending(false);
      }
    },
    [minMs, pending],
  );

  return { pending, run };
}
