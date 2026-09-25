"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { AppBar } from "@/shell/app-bar";
import { authKey } from "./auth";
import { roleName, roleNav } from "./roles";
import { DeskProvider } from "./store";

export function RoleFrame({
  role,
  children,
}: {
  role: string;
  children: ReactNode;
}) {
  const path = usePathname();
  const links = roleNav[role];
  const mode = path.endsWith("/sign-in")
    ? "sign-in"
    : path.endsWith("/register")
      ? "register"
      : path.endsWith("/verify")
        ? "verify"
        : null;

  if (!links) {
    return (
      <>
        <AppBar />
        <main className="page">
          <h1>That role is not on this page</h1>
          <Link className="refresh" href="/">
            Back to roles
          </Link>
        </main>
      </>
    );
  }

  if (mode) {
    return (
      <>
        <AppBar section={roleName(role)} />
        <main className="page">{children}</main>
      </>
    );
  }

  return (
    <RequireSession role={role}>
      <AppBar section={roleName(role)} />
      <div className="frame">
        <nav className="side" aria-label={roleName(role)}>
          <p>{roleName(role)}</p>
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
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setEmail(sessionStorage.getItem(authKey(role)));
  }, [role]);

  useEffect(() => {
    if (email === null) router.replace(`/role/${role}/sign-in`);
  }, [email, role, router]);

  if (!email) {
    return (
      <>
        <AppBar section={roleName(role)} />
        <main className="page" aria-busy="true">
          <p className="kicker">Checking access</p>
        </main>
      </>
    );
  }

  return <>{children}</>;
}

function SignOut({ role }: { role: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="side-out"
      onClick={() => {
        sessionStorage.removeItem(authKey(role));
        router.push(`/role/${role}/sign-in`);
      }}
    >
      Sign out
    </button>
  );
}

function SideLinks({
  role,
  links,
}: {
  role: string;
  links: readonly { href: string; label: string }[];
}) {
  const path = usePathname();

  return (
    <>
      {links.map((link) => {
        const href = link.href ? `/role/${role}/${link.href}` : `/role/${role}`;
        const current = link.href ? path.startsWith(href) : path === href;
        return (
          <Link
            key={link.label}
            href={href}
            scroll={false}
            aria-current={current ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
