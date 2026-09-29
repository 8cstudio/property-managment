"use client";

import { Button } from "@ezzi/ui";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlatformBrand } from "@/features/platform-brand/brand-provider";
import { LocaleSwitcher } from "./locale-switcher";

type ThemeName = "light" | "dark";

export function ThemeSwitcher() {
  const t = useTranslations("theme");
  const [theme, setTheme] = useState<ThemeName>("light");

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    );
  }, []);

  return (
    <label className="locale-switch">
      <span className="sr-only">{t("label")}</span>
      <select
        aria-label={t("label")}
        value={theme}
        onChange={(event) => {
          const next: ThemeName =
            event.target.value === "dark" ? "dark" : "light";
          document.documentElement.dataset.theme = next;
          localStorage.setItem("ezzi-theme", next);
          setTheme(next);
        }}
      >
        <option value="light">{t("light")}</option>
        <option value="dark">{t("dark")}</option>
      </select>
    </label>
  );
}

export function AppBar({ section = "" }: { section?: string }) {
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  const path = usePathname();
  const brand = usePlatformBrand();
  const roleMatch = path.match(/^\/role\/([^/]+)/);
  const role = roleMatch?.[1];
  return (
    <header className="topbar">
      <p className="brand">
        <span className="brand__mark">
          {brand.logoUrl ? (
            <img className="brand__logo" src={brand.logoUrl} alt="" />
          ) : null}
          {brand.name}
        </span>
        {section ? <span>{section}</span> : null}
      </p>
      <div className="top-actions">
        <Button variant="ghost" asChild>
          <Link href="/">{t("home")}</Link>
        </Button>
        {role ? (
          <Button variant="ghost" asChild>
            <Link href={`/role/${role}/messages`}>{tn("messages")}</Link>
          </Button>
        ) : null}
        <LocaleSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
