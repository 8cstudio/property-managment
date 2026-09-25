export type ActorType = "user" | "system" | "service";

export type RequestContext = {
  actorId: string | null;
  actorType: ActorType;
  organisationId: string | null;
  branchIds: readonly string[];
  portfolioIds: readonly string[];
  permissions: ReadonlySet<string>;
  correlationId: string;
  locale: string;
};

export type ResourceRef = {
  organisationId?: string;
  branchId?: string;
  portfolioId?: string;
};

/** Deny when the key is missing or the resource is outside the actor's scope. */
export function can(
  ctx: RequestContext,
  permission: string,
  resource?: ResourceRef,
): boolean {
  if (!ctx.permissions.has(permission)) {
    return false;
  }
  if (
    resource?.organisationId &&
    ctx.organisationId &&
    resource.organisationId !== ctx.organisationId
  ) {
    return false;
  }
  if (
    resource?.branchId &&
    ctx.branchIds.length > 0 &&
    !ctx.branchIds.includes(resource.branchId)
  ) {
    return false;
  }
  if (
    resource?.portfolioId &&
    ctx.portfolioIds.length > 0 &&
    !ctx.portfolioIds.includes(resource.portfolioId)
  ) {
    return false;
  }
  return true;
}
