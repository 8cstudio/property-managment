"use client";

import { Button, FieldError, Hint, usePendingAction } from "@ezzi/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { APP_DISPLAY_NAME } from "@/i18n/brand";
import { usePlatformBrand } from "./brand-provider";

const maxLogoBytes = 400_000;
const logoTypes = ["image/png", "image/jpeg", "image/webp"];

export function PlatformSettings() {
  const brand = usePlatformBrand();
  const t = useTranslations("platform");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tf = useTranslations("forms");
  const { pending, run } = usePendingAction();
  const [name, setName] = useState(brand.name);
  const [logoUrl, setLogoUrl] = useState<string | null>(brand.logoUrl);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(brand.name);
    setLogoUrl(brand.logoUrl);
  }, [brand.name, brand.logoUrl]);

  function onLogo(file: File | undefined) {
    setSaved(false);
    if (!file) return;
    if (!logoTypes.includes(file.type)) {
      setError(t("logoType"));
      return;
    }
    if (file.size > maxLogoBytes) {
      setError(t("logoTooLarge"));
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="work">
      <header className="page-title">
        <p className="kicker">{t("kicker")}</p>
        <h1>
          {tNav("platformSettingsBefore")}
          {APP_DISPLAY_NAME}
          {tNav("platformSettingsAfter")}
        </h1>
      </header>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          const nextName = name.trim();
          if (!nextName) {
            setSaved(false);
            setError(t("nameRequired"));
            return;
          }
          setError("");
          void run(async () => {
            brand.save({ name: nextName, logoUrl });
            setSaved(true);
          });
        }}
      >
        <label>
          {t("name")}
          <input
            value={name}
            maxLength={40}
            onChange={(event) => {
              setSaved(false);
              setName(event.target.value);
            }}
          />
        </label>
        <label>
          {t("logo")}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => onLogo(event.target.files?.[0])}
          />
        </label>
        <Hint>{t("logoHint")}</Hint>
        {logoUrl ? (
          <p className="brand-preview">
            <img src={logoUrl} alt="" />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSaved(false);
                setLogoUrl(null);
              }}
            >
              {t("removeLogo")}
            </Button>
          </p>
        ) : null}
        {error ? <FieldError>{error}</FieldError> : null}
        {saved ? <p className="hint">{t("saved")}</p> : null}
        <div className="form-actions">
          <Button
            type="submit"
            loading={pending}
            disabled={!name.trim() || pending}
            loadingText={tf("loading.saving")}
          >
            {tCommon("save")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              brand.reset();
              setName(APP_DISPLAY_NAME);
              setLogoUrl(null);
              setError("");
              setSaved(false);
            }}
          >
            {t("reset")} {APP_DISPLAY_NAME}
          </Button>
        </div>
      </form>
    </main>
  );
}
