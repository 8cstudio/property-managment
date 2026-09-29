"use client";

import { Button, FieldError, PageMain, Shimmer, Work } from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { AppBar } from "@/shell/app-bar";
import { APP_DISPLAY_NAME } from "@/i18n/brand";
import { mfaKey } from "./auth";
import { roleName, roleNav } from "./roles";
import {
  apiChangePassword,
  apiGetSession,
  apiSignOut,
  bridgeIdentity,
  clearBridgeIdentity,
  roleAllowed,
} from "./session-client";
import { DeskProvider } from "./store";

export function RoleFrame({
  role,
  children,
}: {
  role: string;
  children: ReactNode;
}) {
  const path = usePathname();
  const t = useTranslations("common");
  const tRoles = useTranslations("roles");
  const roleLabel = roleNav[role]
    ? tRoles(`${role}.name`)
    : roleName(role);
  const baseLinks = roleNav[role];
  const links = baseLinks
    ? [
        ...baseLinks,
        { href: "messages", label: "Messages", key: "messages" },
      ]
    : undefined;
  const mode = path.endsWith("/sign-in")
    ? "sign-in"
    : path.endsWith("/register")
      ? "register"
      : path.endsWith("/verify")
        ? "verify"
        : path.endsWith("/mfa")
          ? "mfa"
          : null;

  if (!links) {
    return (
      <>
        <AppBar />
        <PageMain>
          <h1>{t("unknownRole")}</h1>
          <Button variant="primary" asChild>
            <Link href="/">{t("backToRoles")}</Link>
          </Button>
        </PageMain>
      </>
    );
  }

  if (mode) {
    return (
      <>
        <AppBar section={roleLabel} />
        <PageMain className="auth-page">{children}</PageMain>
      </>
    );
  }

  return (
    <RequireSession role={role}>
      <AppBar section={roleLabel} />
      <div className="frame">
        <nav className="side" aria-label={roleLabel}>
          <p>{roleLabel}</p>
          <SideLinks role={role} links={links} />
          <ChangePassword />
          <SignOut role={role} />
        </nav>
        <div className="frame-main">
          <DeskProvider role={role}>{children}</DeskProvider>
        </div>
      </div>
    </RequireSession>
  );
}

function RequireSession({
  role,
  children,
}: {
  role: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("common");
  const tRoles = useTranslations("roles");
  const roleLabel = tRoles(`${role}.name`);
  const [status, setStatus] = useState<"loading" | "ok" | "slow">("loading");

  useEffect(() => {
    let active = true;
    const slowTimer = setTimeout(() => {
      if (active) setStatus((s) => (s === "loading" ? "slow" : s));
    }, 12_000);

    apiGetSession()
      .then((viewer) => {
        if (!active) return;
        if (!viewer || !roleAllowed(viewer, role)) {
          clearBridgeIdentity(role);
          router.replace(`/role/${role}/sign-in`);
          return;
        }
        bridgeIdentity(role, viewer);
        setStatus("ok");
      })
      .catch(() => {
        if (!active) return;
        clearBridgeIdentity(role);
        router.replace(`/role/${role}/sign-in`);
      })
      .finally(() => {
        clearTimeout(slowTimer);
      });
    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [role, router]);

  if (status === "slow") {
    return (
      <>
        <AppBar section={roleLabel} />
        <PageMain>
          <Work className="desk-boot desk-boot--auth">
            <p className="kicker">{t("sessionSlowTitle")}</p>
            <p className="hint">{t("sessionSlowHint")}</p>
            <Button variant="primary" asChild>
              <Link href={`/role/${role}/sign-in`}>{t("signIn")}</Link>
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setStatus("loading");
                void apiGetSession().then((viewer) => {
                  if (!viewer || !roleAllowed(viewer, role)) {
                    router.replace(`/role/${role}/sign-in`);
                    return;
                  }
                  bridgeIdentity(role, viewer);
                  setStatus("ok");
                });
              }}
            >
              {t("retry")}
            </Button>
          </Work>
        </PageMain>
      </>
    );
  }

  if (status !== "ok") {
    return (
      <>
        <AppBar section={roleLabel} />
        <PageMain aria-busy="true">
          <Work className="desk-boot desk-boot--auth">
            <p className="kicker">{t("checkingAccess")}</p>
            <Shimmer size="lg" />
          </Work>
        </PageMain>
      </>
    );
  }

  return <>{children}</>;
}

function ChangePassword() {
  const t = useTranslations("common");
  const tf = useTranslations("forms");
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNextPassword("");
    setConfirm("");
    setError("");
    setDone(false);
  }

  return (
    <div className="side-password">
      <Button
        variant="side"
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          reset();
        }}
      >
        {t("changePassword")}
      </Button>
      {open ? (
        <form
          className="side-password__form"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setDone(false);
            if (nextPassword.length < 8) {
              setError(tf("errors.passwordMin"));
              return;
            }
            if (nextPassword !== confirm) {
              setError(tf("errors.passwordsMismatch"));
              return;
            }
            setPending(true);
            void apiChangePassword(currentPassword, nextPassword)
              .then(() => {
                reset();
                setDone(true);
              })
              .catch((err: unknown) => {
                setError(
                  err instanceof Error ? err.message : tf("errors.passwordMin"),
                );
              })
              .finally(() => setPending(false));
          }}
        >
          <label>
            {t("currentPassword")}
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label>
            {t("newPassword")}
            <input
              type="password"
              autoComplete="new-password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
          <label>
            {tf("confirmPassword")}
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
              minLength={8}
            />
          </label>
          {error ? <FieldError>{error}</FieldError> : null}
          {done ? <p className="side-password__ok">{t("passwordUpdated")}</p> : null}
          <Button type="submit" variant="primary" disabled={pending}>
            {t("save")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function SignOut({ role }: { role: string }) {
  const router = useRouter();
  const t = useTranslations("common");
  return (
    <Button
      variant="side"
      onClick={async () => {
        await apiSignOut();
        clearBridgeIdentity(role);
        sessionStorage.removeItem(mfaKey(role));
        router.push(`/role/${role}/sign-in`);
      }}
    >
      {t("signOut")}
    </Button>
  );
}

function SideLinks({
  role,
  links,
}: {
  role: string;
  links: readonly { href: string; label: string; key: string }[];
}) {
  const path = usePathname();
  const t = useTranslations("nav");

  return (
    <>
      {links.map((link) => {
        const href = link.href ? `/role/${role}/${link.href}` : `/role/${role}`;
        const current = link.href ? path.startsWith(href) : path === href;
        return (
          <Link
            key={link.key}
            href={href}
            scroll={false}
            aria-current={current ? "page" : undefined}
          >
            {link.key === "platformSettings" ? (
              <>
                {t("platformSettingsBefore")}
                {APP_DISPLAY_NAME}
                {t("platformSettingsAfter")}
              </>
            ) : (
              t(link.key)
            )}
          </Link>
        );
      })}
    </>
  );
}
