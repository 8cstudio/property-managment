"use client";

import { Button, PageMain } from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { AppBar } from "@/shell/app-bar";
import { authKey, mfaKey } from "./auth";
import { requiresMfa, roleName, roleNav } from "./roles";
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
  const links = roleNav[role];
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
          <SignOut role={role} />
        </nav>
        <DeskProvider role={role}>{children}</DeskProvider>
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
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setEmail(sessionStorage.getItem(authKey(role)));
  }, [role]);

  useEffect(() => {
    if (email === null) router.replace(`/role/${role}/sign-in`);
    else if (requiresMfa(role) && !sessionStorage.getItem(mfaKey(role))) {
      router.replace(`/role/${role}/mfa`);
    }
  }, [email, role, router]);

  if (!email) {
    return (
      <>
        <AppBar section={roleLabel} />
        <PageMain aria-busy="true">
          <p className="kicker">{t("checkingAccess")}</p>
        </PageMain>
      </>
    );
  }

  return <>{children}</>;
}

function SignOut({ role }: { role: string }) {
  const router = useRouter();
  const t = useTranslations("common");
  return (
    <Button
      variant="side"
      onClick={() => {
        sessionStorage.removeItem(authKey(role));
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
            {t(link.key)}
          </Link>
        );
      })}
    </>
  );
}
