"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { APP_DISPLAY_NAME } from "@/i18n/brand";

const STORAGE_KEY = "ezzi-platform-brand";

export type PlatformBrand = {
  name: string;
  logoUrl: string | null;
};

const fallback: PlatformBrand = { name: APP_DISPLAY_NAME, logoUrl: null };

type BrandContextValue = PlatformBrand & {
  save: (next: PlatformBrand) => void;
  reset: () => void;
};

const BrandContext = createContext<BrandContextValue | null>(null);

function readStored(): PlatformBrand | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlatformBrand>;
    const name = typeof parsed.name === "string" ? parsed.name.trim().slice(0, 40) : "";
    if (!name) return null;
    const logoUrl =
      typeof parsed.logoUrl === "string" && parsed.logoUrl.startsWith("data:image/")
        ? parsed.logoUrl
        : null;
    return { name, logoUrl };
  } catch {
    return null;
  }
}

export function PlatformBrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<PlatformBrand>(fallback);

  useEffect(() => {
    const stored = readStored();
    if (stored) setBrand(stored);
  }, []);

  const save = useCallback((next: PlatformBrand) => {
    const name = next.name.trim().slice(0, 40) || fallback.name;
    const value = { name, logoUrl: next.logoUrl };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    setBrand(value);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setBrand(fallback);
  }, []);

  return (
    <BrandContext.Provider value={{ ...brand, save, reset }}>
      {children}
    </BrandContext.Provider>
  );
}

export function usePlatformBrand(): BrandContextValue {
  return useContext(BrandContext) ?? { ...fallback, save() {}, reset() {} };
}
