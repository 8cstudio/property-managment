"use client";

import { AuthShell, Button, FieldError, Hint } from "@ezzi/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type FormEvent,
  useEffect,
  useState,
  useTransition,
} from "react";
import { canRegister, needsVerify, requiresMfa, roleName } from "./roles";

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function authKey(role: string): string {
  return `ezzi-auth-${role}`;
}

export function mfaKey(role: string): string {
  return `ezzi-mfa-${role}`;
}

function pendingKey(role: string): string {
  return `ezzi-pending-${role}`;
}

export function AuthPanel({
  role,
  mode,
}: {
  role: string;
  mode: "sign-in" | "register" | "verify" | "mfa";
}) {
  const router = useRouter();
  const t = useTranslations("auth");
  const tf = useTranslations("forms");
  const register = canRegister(role);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const canSignIn =
    isEmail(email) && password.trim().length >= 8 && !pending;
  const registerReady =
    name.trim().length > 0 &&
    isEmail(email) &&
    password.length >= 8 &&
    password === confirm &&
    !pending;
  const canVerify = /^\d{6}$/.test(code.trim()) && !pending;

  useEffect(() => {
    if (mode === "register" && !register) {
      router.replace(`/role/${role}/sign-in`);
      return;
    }
    if (mode === "verify" && !needsVerify(role)) {
      router.replace(`/role/${role}/sign-in`);
      return;
    }
    if (mode === "mfa" && !requiresMfa(role)) {
      router.replace(`/role/${role}/sign-in`);
      return;
    }
    const signedIn = sessionStorage.getItem(authKey(role));
    if (signedIn && mode === "sign-in") {
      router.replace(`/role/${role}`);
    }
    if (signedIn && mode === "mfa" && sessionStorage.getItem(mfaKey(role))) {
      router.replace(`/role/${role}`);
    }
  }, [mode, register, role, router]);

  function signIn(event: FormEvent) {
    event.preventDefault();
    if (!canSignIn) return;
    if (!isEmail(email)) {
      setError(tf("errors.validEmail"));
      return;
    }
    if (password.trim().length < 8) {
      setError(tf("errors.passwordMin"));
      return;
    }
    setError("");
    startTransition(() => {
      sessionStorage.setItem(authKey(role), email.trim().toLowerCase());
      sessionStorage.removeItem(mfaKey(role));
      router.push(
        requiresMfa(role) ? `/role/${role}/mfa` : `/role/${role}`,
      );
    });
  }

  function createAccount(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(tf("errors.enterName"));
      return;
    }
    if (!isEmail(email)) {
      setError(tf("errors.validEmail"));
      return;
    }
    if (password.length < 8) {
      setError(tf("errors.passwordMin"));
      return;
    }
    if (password !== confirm) {
      setError(tf("errors.passwordsMismatch"));
      return;
    }
    const mail = email.trim().toLowerCase();
    if (needsVerify(role)) {
      setError("");
      startTransition(() => {
        sessionStorage.setItem(pendingKey(role), mail);
        router.push(`/role/${role}/verify`);
      });
      return;
    }
    setError("");
    startTransition(() => {
      sessionStorage.setItem(authKey(role), mail);
      sessionStorage.removeItem(mfaKey(role));
      router.push(
        requiresMfa(role) ? `/role/${role}/mfa` : `/role/${role}`,
      );
    });
  }

  function verifyMfa(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError(tf("errors.mfaCode"));
      return;
    }
    if (!sessionStorage.getItem(authKey(role))) {
      setError(tf("errors.signInFirst"));
      return;
    }
    setError("");
    startTransition(() => {
      sessionStorage.setItem(mfaKey(role), "1");
      router.push(`/role/${role}`);
    });
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    const pending = sessionStorage.getItem(pendingKey(role));
    if (!pending) {
      setError(tf("errors.verifyFirst"));
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError(tf("errors.verifyCode"));
      return;
    }
    setError("");
    startTransition(() => {
      sessionStorage.setItem(authKey(role), pending);
      sessionStorage.removeItem(pendingKey(role));
      router.push(`/role/${role}`);
    });
  }

  const title =
    mode === "mfa"
      ? t("mfaTitle")
      : mode === "verify"
        ? t("verifyEmail")
        : mode === "register"
          ? role === "org-admin"
            ? t("createPassword")
            : t("createAccount")
          : t("signIn");

  return (
    <AuthShell roleLabel={roleName(role)} title={title}>
      {mode === "sign-in" ? (
        <form className="form form--auth" noValidate onSubmit={signIn}>
          <label>
            {tf("email")}
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            {tf("password")}
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <FieldError>{error}</FieldError> : null}
          <Button
            type="submit"
            className="auth-submit"
            loading={pending}
            disabled={!canSignIn}
            loadingText={t("signingIn")}
          >
            {t("signIn")}
          </Button>
          {register ? (
            <Link className="text-link" href={`/role/${role}/register`}>
              {role === "org-admin"
                ? t("firstTimePassword")
                : t("createAccount")}
            </Link>
          ) : (
            <Hint>
              {role === "super-admin" ? t("hintSuperAdmin") : t("hintStaff")}
            </Hint>
          )}
        </form>
      ) : null}
      {mode === "register" ? (
        <form className="form form--auth" noValidate onSubmit={createAccount}>
          <label>
            {tf("name")}
            <input
              value={name}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            {tf("email")}
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            {tf("password")}
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <label>
            {tf("confirmPassword")}
            <input
              type="password"
              value={confirm}
              autoComplete="new-password"
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </label>
          {error ? <FieldError>{error}</FieldError> : null}
          <Button
            type="submit"
            className="auth-submit"
            loading={pending}
            disabled={!registerReady}
            loadingText={t("creating")}
          >
            {role === "org-admin" ? t("createPasswordBtn") : t("createAccount")}
          </Button>
          <Link className="text-link" href={`/role/${role}/sign-in`}>
            {t("alreadyHaveAccess")}
          </Link>
        </form>
      ) : null}
      {mode === "mfa" ? (
        <form className="form form--auth" noValidate onSubmit={verifyMfa}>
          <Hint>{t("mfaHint")}</Hint>
          <label>
            {tf("authenticationCode")}
            <input
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </label>
          {error ? <FieldError>{error}</FieldError> : null}
          <Button
            type="submit"
            className="auth-submit"
            loading={pending}
            disabled={!canVerify}
            loadingText={t("checking")}
          >
            {t("continue")}
          </Button>
        </form>
      ) : null}
      {mode === "verify" ? (
        <form className="form form--auth" noValidate onSubmit={verify}>
          <Hint>{t("verifyHint")}</Hint>
          <label>
            {tf("code")}
            <input
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </label>
          {error ? <FieldError>{error}</FieldError> : null}
          <Button
            type="submit"
            className="auth-submit"
            loading={pending}
            disabled={!canVerify}
            loadingText={t("verifying")}
          >
            {t("verify")}
          </Button>
        </form>
      ) : null}
    </AuthShell>
  );
}
