"use client";

import { PageMain, RolePickCard, RolePickGrid } from "@ezzi/ui";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { roleCards } from "@/features/workspace/roles";
import { APP_DISPLAY_NAME } from "@/i18n/brand";
import { roleIcons } from "./role-icons";

export function GateBoard() {
  const t = useTranslations("gate");
  const tRoles = useTranslations("roles");

  return (
    <PageMain className="gate-page">
      <section className="gate-hero">
        <p className="gate-hero__eyebrow">
          <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
          {t("eyebrow")}
        </p>
        <h1>{t("title")}</h1>
        <p className="gate-hero__lead">{t("lead")}</p>
      </section>
      <RolePickGrid>
        <RolePickCard
          href="/visit"
          title={t("visitor")}
          description={t("visitorDescription", { brand: APP_DISPLAY_NAME })}
          icon={Sparkles}
          index={0}
          featured
        />
        {roleCards.map((role, index) => {
          const Icon = roleIcons[role.id];
          return (
            <RolePickCard
              key={role.id}
              href={`/role/${role.id}/sign-in`}
              title={tRoles(`${role.id}.name`)}
              description={tRoles(`${role.id}.line`)}
              {...(Icon ? { icon: Icon } : {})}
              index={index + 1}
            />
          );
        })}
      </RolePickGrid>
    </PageMain>
  );
}
