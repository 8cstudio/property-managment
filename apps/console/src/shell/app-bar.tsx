"use client";

import { Button, IconButton } from "@ezzi/ui";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_LOGO_TEXT } from "@/i18n/brand";
import { LocaleSwitcher } from "./locale-switcher";

export function ThemeToggle() {
  const t = useTranslations("theme");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    );
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("ezzi-theme", next);
    setTheme(next);
  }

  const toDark = theme !== "dark";

  return (
    <IconButton
      onClick={toggleTheme}
      aria-label={toDark ? t("toDark") : t("toLight")}
    >
      {toDark ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.5v1.75M12 18.75V20.5M3.5 12h1.75M18.75 12H20.5M6.1 6.1l1.25 1.25M16.65 16.65l1.25 1.25M17.9 6.1l-1.25 1.25M7.35 16.65l-1.25 1.25" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.5 14.2A7.2 7.2 0 0 1 9.8 4.5 6.6 6.6 0 1 0 19.5 14.2z" />
    </svg>
  );
}

export function AppBar({ section = "" }: { section?: string }) {
  const t = useTranslations("common");
  return (
    <header className="topbar">
      <p className="brand">
        {APP_LOGO_TEXT}
        {section ? <span>{section}</span> : null}
      </p>
      <div className="top-actions">
        <Button variant="ghost" asChild>
          <Link href="/">{t("home")}</Link>
        </Button>
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
