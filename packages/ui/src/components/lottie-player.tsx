"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import ezziLoader from "../assets/ezzi-loader.json";

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduce(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

type LottiePlayerProps = {
  /** URL of a Lottie JSON (e.g. "/lottie/error-404.json"), served by the host app. */
  src: string;
  loop?: boolean;
  className?: string;
  /** Accessible label; omit to mark the animation decorative. */
  label?: string;
};

/**
 * Renders a Lottie animation loaded by URL. Honors `prefers-reduced-motion`
 * by showing the first frame without playback.
 */
export function LottiePlayer({
  src,
  loop = true,
  className,
  label,
}: LottiePlayerProps) {
  const reduce = usePrefersReducedMotion();
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    fetch(src)
      .then((response) => response.json())
      .then((json) => {
        if (active) setData(json);
      })
      .catch(() => {
        if (active) setData(null);
      });
    return () => {
      active = false;
    };
  }, [src]);

  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true };

  if (!data) return <div className={cn("lottie", className)} {...a11y} />;

  return (
    <Lottie
      animationData={data}
      loop={reduce ? false : loop}
      autoplay={!reduce}
      className={cn("lottie", className)}
      {...a11y}
    />
  );
}

type EzziLoaderProps = {
  className?: string;
  label?: string;
};

/** Branded EZZI loading animation (bundled). Pauses on `prefers-reduced-motion`. */
export function EzziLoader({ className, label }: EzziLoaderProps) {
  const reduce = usePrefersReducedMotion();
  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true };

  return (
    <Lottie
      animationData={ezziLoader}
      loop={!reduce}
      autoplay={!reduce}
      className={cn("ezzi-loader", className)}
      {...a11y}
    />
  );
}
