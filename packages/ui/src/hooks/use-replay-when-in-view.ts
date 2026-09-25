"use client";

import { useEffect, useRef, useState } from "react";

type ReplayWhenInViewOptions = {
  threshold?: number;
  rootMargin?: string;
};

/** Bumps a token each time the element scrolls into view (for replaying chart intros). */
export function useReplayWhenInView(options: ReplayWhenInViewOptions = {}) {
  const { threshold = 0.28, rootMargin = "0px 0px -6% 0px" } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [replayToken, setReplayToken] = useState(0);
  const inViewRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          if (!inViewRef.current && !reduceMotion) {
            setReplayToken((count) => count + 1);
          }
          inViewRef.current = true;
        } else {
          inViewRef.current = false;
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return {
    ref,
    replayToken,
    shouldAnimate: replayToken > 0,
  };
}
