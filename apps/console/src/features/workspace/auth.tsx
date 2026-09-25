"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { canRegister, needsVerify, roleName } from "./roles";

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function authKey(role: string): string {
  return `ezzi-auth-${role}`;
}

function pendingKey(role: string): string {
  return `ezzi-pending-${role}`;
}

export function AuthPanel({
  role,
  mode,
}: {
  role: string;
  mode: "sign-in" | "register" | "verify";
}) {
  const router = useRouter();
  const register = canRegister(role);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "register" && !register) {
      router.replace(`/role/${role}/sign-in`);
      return;
    }
    if (mode === "verify" && !needsVerify(role)) {
      router.replace(`/role/${role}/sign-in`);
      return;
    }
    const signedIn = sessionStorage.getItem(authKey(role));
    if (signedIn && mode === "sign-in") {
      router.replace(`/role/${role}`);
    }
  }, [mode, register, role, router]);

  function signIn(event: FormEvent) {
    event.preventDefault();
    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    sessionStorage.setItem(authKey(role), email.trim().toLowerCase());
    router.push(`/role/${role}`);
  }

  function createAccount(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const mail = email.trim().toLowerCase();
    if (needsVerify(role)) {
      sessionStorage.setItem(pendingKey(role), mail);
      router.push(`/role/${role}/verify`);
      return;
    }
    sessionStorage.setItem(authKey(role), mail);
    router.push(`/role/${role}`);
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    const pending = sessionStorage.getItem(pendingKey(role));
    if (!pending) {
      setError("Create an account before verifying.");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code.");
      return;
    }
    sessionStorage.setItem(authKey(role), pending);
    sessionStorage.removeItem(pendingKey(role));
    router.push(`/role/${role}`);
  }

  const title =
    mode === "verify"
      ? "Verify your email"
      : mode === "register"
        ? role === "org-admin"
          ? "Create your password"
          : "Create account"
        : "Sign in";

  return (
    <>
      <p className="kicker">{roleName(role)}</p>
      <h1>{title}</h1>
      {mode === "sign-in" ? (
        <form className="form" noValidate onSubmit={signIn}>
          <label>
            Email
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="field-error">{error}</p> : null}
          <button type="submit" className="refresh">
            Sign in
          </button>
          {register ? (
            <Link className="text-link" href={`/role/${role}/register`}>
              {role === "org-admin"
                ? "First time? Create your password"
                : "Create an account"}
            </Link>
          ) : (
            <p className="hint">
              {role === "super-admin"
                ? "Platform access is issued by Ezzi. There is no registration."
                : "Staff accounts are created by invitation. There is no public registration."}
            </p>
          )}
        </form>
      ) : null}
      {mode === "register" ? (
        <form className="form" noValidate onSubmit={createAccount}>
          <label>
            Name
            <input
              value={name}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirm}
              autoComplete="new-password"
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </label>
          {error ? <p className="field-error">{error}</p> : null}
          <button type="submit" className="refresh">
            {role === "org-admin" ? "Create password" : "Create account"}
          </button>
          <Link className="text-link" href={`/role/${role}/sign-in`}>
            Already have access? Sign in
          </Link>
        </form>
      ) : null}
      {mode === "verify" ? (
        <form className="form" noValidate onSubmit={verify}>
          <p className="hint">
            Enter the 6-digit code from the message sent to your email.
          </p>
          <label>
            Code
            <input
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </label>
          {error ? <p className="field-error">{error}</p> : null}
          <button type="submit" className="refresh">
            Verify
          </button>
        </form>
      ) : null}
    </>
  );
}
