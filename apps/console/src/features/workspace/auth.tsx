"use client";

import { AuthShell, Button, FieldError, Hint } from "@ezzi/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { canRegister, needsVerify, requiresMfa, roleName } from "./roles";
import {
  apiAccountState,
  apiActivate,
  apiRegister,
  apiGetSession,
  apiSignIn,
  bridgeIdentity,
  clearBridgeIdentity,
  roleAllowed,
} from "./session-client";

type SignInStep = "email" | "password" | "activate";

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
  const tc = useTranslations("common");
  const tf = useTranslations("forms");
  const register = canRegister(role);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [signInStep, setSignInStep] = useState<SignInStep>("email");

  const canContinueEmail = isEmail(email) && !pending;
  const canSignIn =
    isEmail(email) && password.trim().length >= 8 && !pending;
  const canActivate =
    isEmail(email) &&
    password.length >= 8 &&
    password === confirm &&
    !pending;
  const registerReady =
    name.trim().length > 0 &&
    isEmail(email) &&
    password.length >= 8 &&
    password === confirm &&
    !pending;
  const canVerify = /^\d{6}$/.test(code.trim()) && !pending;
  const [ready, setReady] = useState(false);

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

    let active = true;
    if (mode === "sign-in") {
      setReady(true);
      void apiGetSession()
        .then((viewer) => {
          if (!active) return;
          if (viewer && roleAllowed(viewer, role)) {
            bridgeIdentity(role, viewer);
            router.replace(`/role/${role}`);
            return;
          }
          clearBridgeIdentity(role);
        })
        .catch(() => clearBridgeIdentity(role));
    } else {
      void (async () => {
        if (mode === "mfa") {
          try {
            const viewer = await apiGetSession();
            if (!active) return;
            const mfaOk = Boolean(sessionStorage.getItem(mfaKey(role)));
            if (viewer && roleAllowed(viewer, role) && mfaOk) {
              bridgeIdentity(role, viewer);
              router.replace(`/role/${role}`);
              return;
            }
          } catch {
            /* show mfa form */
          }
        }
        if (active) setReady(true);
      })();
    }

    return () => {
      active = false;
    };
  }, [mode, register, role, router]);

  function resetSignInFlow() {
    setSignInStep("email");
    setPassword("");
    setConfirm("");
    setError("");
  }

  async function continueWithEmail(event: FormEvent) {
    event.preventDefault();
    if (!isEmail(email)) {
      setError(tf("errors.validEmail"));
      return;
    }
    setError("");
    setPending(true);
    try {
      const access = await apiAccountState(email.trim(), role);
      if (access.state === "unknown") {
        setError(t("emailNotRecognised"));
        return;
      }
      if (!access.portalAllowed && access.roles.length > 0) {
        setError(t("wrongPortalForRoles"));
        return;
      }
      if (access.state === "active") {
        setSignInStep("password");
        setPassword("");
      } else if (access.state === "invited") {
        setSignInStep("activate");
        setPassword("");
        setConfirm("");
      } else {
        setError(t("emailNotRecognised"));
      }
    } catch {
      setError(t("emailNotRecognised"));
    } finally {
      setPending(false);
    }
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!isEmail(email)) {
      setError(tf("errors.validEmail"));
      return;
    }
    if (password.trim().length < 8) {
      setError(tf("errors.passwordMin"));
      return;
    }
    setError("");
    setPending(true);
    try {
      const viewer = await apiSignIn(email.trim(), password, role);
      if (!roleAllowed(viewer, role)) {
        setError(
          `This account does not have access to the ${roleName(role)} area.`,
        );
        setPending(false);
        return;
      }
      bridgeIdentity(role, viewer);
      router.push(`/role/${role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setPending(false);
    }
  }

  async function activateInvited(event: FormEvent) {
    event.preventDefault();
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
    setError("");
    setPending(true);
    try {
      const viewer = await apiActivate(email.trim(), password, role);
      if (!roleAllowed(viewer, role)) {
        setError(
          `This account does not have access to the ${roleName(role)} area.`,
        );
        setPending(false);
        return;
      }
      bridgeIdentity(role, viewer);
      router.push(`/role/${role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed.");
      setPending(false);
    }
  }

  async function createAccount(event: FormEvent) {
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
    setError("");
    setPending(true);
    try {
      const viewer = await apiRegister({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      bridgeIdentity(role, viewer);
      router.push(`/role/${role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
      setPending(false);
    }
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
    setPending(true);
    sessionStorage.setItem(mfaKey(role), "1");
    router.push(`/role/${role}`);
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
    setPending(true);
    sessionStorage.setItem(authKey(role), pending);
    sessionStorage.removeItem(pendingKey(role));
    router.push(`/role/${role}`);
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
          : mode === "sign-in" && signInStep === "activate"
            ? t("activateAccount")
            : t("signIn");

  if (!ready) {
    return (
      <AuthShell roleLabel={roleName(role)} title={title}>
        <Hint>{tc("checkingAccess")}</Hint>
      </AuthShell>
    );
  }

  return (
    <AuthShell roleLabel={roleName(role)} title={title}>
      {mode === "sign-in" && signInStep === "email" ? (
        <form className="form form--auth" noValidate onSubmit={continueWithEmail}>
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
          {error ? <FieldError>{error}</FieldError> : null}
          <Button
            type="submit"
            className="auth-submit"
            loading={pending}
            disabled={!canContinueEmail}
            loadingText={t("checking")}
          >
            {t("continueWithEmail")}
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
      {mode === "sign-in" && signInStep === "password" ? (
        <form className="form form--auth" noValidate onSubmit={signIn}>
          <p className="hint">{email}</p>
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
          <button
            type="button"
            className="text-link"
            onClick={resetSignInFlow}
          >
            {t("changeEmail")}
          </button>
        </form>
      ) : null}
      {mode === "sign-in" && signInStep === "activate" ? (
        <form className="form form--auth" noValidate onSubmit={activateInvited}>
          <Hint>{t("activateHint")}</Hint>
          <p className="hint">{email}</p>
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
            disabled={!canActivate}
            loadingText={t("activating")}
          >
            {t("activateAccount")}
          </Button>
          <button
            type="button"
            className="text-link"
            onClick={resetSignInFlow}
          >
            {t("changeEmail")}
          </button>
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
