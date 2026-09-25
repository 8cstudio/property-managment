"use client";

import { Shimmer, Work } from "@ezzi/ui";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createSeed,
  type DeskState,
  type Office,
  type OnboardingStep,
  defaultOrgSettings,
  seedOffice,
  type Org,
  type OrgSettings,
} from "./data";
import { flashDeskError, flashDeskSuccess } from "./desk-feedback";

export type DeskApi = {
  createOrg: (input: {
    name: string;
    branch: string;
    admin: string;
    modules?: Record<string, boolean>;
  }) => void;
  setOrgStatus: (
    id: string,
    status: DeskState["orgs"][number]["status"],
    reason: string,
  ) => void;
  updateOrgProfile: (
    orgId: string,
    input: {
      name: string;
      legalName: string;
      companyNumber: string;
      billingEmail: string;
    },
  ) => void;
  saveOrgSettings: (orgId: string, input: Partial<OrgSettings>) => void;
  addOrgIntegration: (
    orgId: string,
    input: { name: string; kind: string },
  ) => string;
  toggleModule: (orgId: string, name: string) => void;
  inviteUser: (input: {
    name: string;
    email: string;
    role: string;
    scope: string;
    orgId?: string;
  }) => void;
  updateUser: (
    id: string,
    input: { name: string; email: string; role: string; scope: string },
  ) => void;
  setUserStatus: (
    id: string,
    status: DeskState["users"][number]["status"],
    reason: string,
  ) => void;
  removeUser: (id: string, reason: string) => void;
  resendUserInvite: (id: string) => void;
  createOffice: (
    orgId: string,
    input: Omit<Office, "id" | "status"> & { status?: Office["status"] },
  ) => string;
  updateOffice: (
    orgId: string,
    officeId: string,
    input: Omit<Office, "id">,
  ) => void;
  setOfficeStatus: (
    orgId: string,
    officeId: string,
    status: Office["status"],
    reason: string,
  ) => void;
  removeOffice: (orgId: string, officeId: string, reason: string) => void;
  requestOrg: (input: {
    company: string;
    contact: string;
    email: string;
    branch: string;
  }) => void;
  decideRequest: (id: string, status: "Approved" | "Declined") => void;
  saveSettings: (days: string) => void;
  testIntegration: (id: string) => void;
  saveIntegrationConfig: (
    id: string,
    input: { endpoint: string; apiKey: string; webhookUrl: string; syncCadence: string },
  ) => void;
  disconnectIntegration: (id: string) => void;
  assignWork: (id: string, owner: string) => void;
  resolveWork: (id: string) => void;
  setPropertyStatus: (id: string, status: string, reason: string) => void;
  toggleCheck: (id: string, item: string) => void;
  publishListing: (id: string) => void;
  setViewingOutcome: (id: string, outcome: string) => void;
  acceptApplicant: (id: string) => void;
  validateCert: (id: string) => void;
  renewCert: (id: string, expiry: string) => void;
  matchPayment: (id: string) => void;
  savePlan: (id: string, plan: string) => void;
  publishStatement: (id: string) => void;
  setMigrationStage: (id: string, stage: string) => void;
  runMigrationImport: (id: string) => void;
  runMigrationValidation: (id: string) => void;
  decideJob: (id: string, status: string) => void;
  acceptJob: (id: string) => void;
  declineJob: (id: string, reason: string) => void;
  completeJob: (id: string, notes: string) => void;
  quoteJob: (id: string, amount: string) => void;
  submitStep: (id: string) => void;
  reportIssue: (category: string, detail: string) => void;
  createListing: (input: {
    address: string;
    portal: string;
    rent: string;
    bedrooms: string;
    description: string;
  }) => string;
  createMigrationProject: (input: {
    agency: string;
    source: string;
  }) => string;
  createRentSchedule: (input: {
    tenancy: string;
    amount: string;
    frequency: string;
    method: string;
  }) => string;
  updateRentSchedule: (
    id: string,
    input: { amount: string; frequency: string; method: string; status: string },
  ) => void;
  setRequirementStatus: (id: string, status: string) => void;
  uploadDocument: (input: {
    name: string;
    type: string;
    linkedTo: string;
    orgId: string;
  }) => void;
};

const DeskContext = createContext<{ state: DeskState; api: DeskApi } | null>(
  null,
);

function stamp(): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date());
}

function withAudit(
  state: DeskState,
  action: string,
  org: string,
  _message: string,
): DeskState {
  return {
    ...state,
    audit: [
      {
        id: `a-${Date.now()}`,
        when: `Today ${stamp()}`,
        actor: "You",
        action,
        org,
      },
      ...state.audit,
    ],
  };
}

export function DeskProvider({
  role,
  children,
}: {
  role: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<DeskState | null>(null);

  useEffect(() => {
    const key = "ezzi-desk";
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DeskState;
        const seen = new Set<string>();
        if (!parsed.requests) parsed.requests = [];
        if (!parsed.integrationLogs) parsed.integrationLogs = [];
        parsed.integrations = parsed.integrations.map((row) => ({
          ...row,
          kind: row.kind ?? "Connection",
          endpoint: row.endpoint ?? "",
          apiKeyHint: row.apiKeyHint ?? "",
          webhookUrl: row.webhookUrl ?? "",
          syncCadence: row.syncCadence ?? "Manual",
          lastSyncAt: row.lastSyncAt ?? "Unknown",
          lastError: row.lastError ?? "",
        }));
        parsed.onboarding = parsed.onboarding.map((row) => ({
          ...row,
          summary: row.summary ?? "",
        }));
        parsed.listings = parsed.listings.map((row) => ({
          ...row,
          rent: row.rent ?? "",
          bedrooms: row.bedrooms ?? "",
          description: row.description ?? "",
        }));
        parsed.requirements = parsed.requirements.map((row) => ({
          ...row,
          evidence: row.evidence ?? "",
          owner: row.owner ?? "",
        }));
        parsed.rentSchedules = parsed.rentSchedules.map((row) => ({
          ...row,
          nextDue: row.nextDue ?? "1 Oct 2026",
          method: row.method ?? "Standing order",
        }));
        parsed.users = parsed.users.map((row) => ({
          ...row,
          statusNote: row.statusNote ?? "",
        }));
        parsed.orgs = parsed.orgs.map((org) => ({
          ...org,
          legalName: org.legalName ?? org.name,
          companyNumber: org.companyNumber ?? "",
          billingEmail: org.billingEmail ?? "",
          settings: {
            ...defaultOrgSettings(),
            ...org.settings,
            reminderDays:
              org.settings?.reminderDays ?? parsed.reminderDays ?? "30",
          },
        }));
        parsed.notice = "";
        parsed.orgs = parsed.orgs.map((org) => {
          const legacy = org as Org & { branches?: string[] };
          let next: (typeof parsed.orgs)[number] = org;
          if (!legacy.offices) {
            next = {
              ...org,
              offices: legacy.branches?.length
                ? legacy.branches.map((name) => seedOffice(org.id, name))
                : [],
            };
          }
          if (!seen.has(next.id)) {
            seen.add(next.id);
            return next;
          }
          const id = `org-${globalThis.crypto.randomUUID()}`;
          seen.add(id);
          return { ...next, id };
        });
        setState(parsed);
        return;
      } catch {
        sessionStorage.removeItem(key);
      }
    }
    setState(createSeed());
  }, [role]);

  useEffect(() => {
    if (!state) return;
    sessionStorage.setItem(
      "ezzi-desk",
      JSON.stringify({ ...state, notice: "" }),
    );
  }, [role, state]);

  const api = useMemo<DeskApi>(
    () => ({
      createOrg: ({ name, branch, admin, modules }) => {
        let success: string | null = null;
        let duplicate = false;
        setState((current) => {
          if (!current) return current;
          const company = name.trim();
          const taken = current.orgs.some(
            (org) => org.name.trim().toLowerCase() === company.toLowerCase(),
          );
          if (taken) {
            duplicate = true;
            return current;
          }
          const id = `org-${globalThis.crypto.randomUUID()}`;
          success = `${company} is in Setup. Invite sent to ${admin.trim()}.`;
          return withAudit(
            {
              ...current,
              orgs: [
                ...current.orgs,
                {
                  id,
                  name: company,
                  status: "Setup",
                  offices: [
                    seedOffice(id, branch.trim(), {
                      manager: admin.trim(),
                    }),
                  ],
                  modules: modules ?? {
                    Properties: true,
                    Lettings: true,
                    Compliance: true,
                    Maintenance: true,
                    Finance: false,
                    Migration: false,
                  },
                  reason: "",
                  legalName: company,
                  companyNumber: "",
                  billingEmail: admin.trim().toLowerCase(),
                  settings: defaultOrgSettings(),
                },
              ],
              users: [
                ...current.users,
                {
                  id: `u-${globalThis.crypto.randomUUID()}`,
                  name: admin.trim(),
                  email: admin.trim().toLowerCase(),
                  role: "Organisation Admin",
                  scope: branch.trim(),
                  status: "Invited",
                  orgId: id,
                  statusNote: "",
                },
              ],
            },
            `Created organisation ${company}`,
            company,
            success,
          );
        });
        if (duplicate) {
          flashDeskError("An organisation with this name already exists.");
        } else if (success) {
          flashDeskSuccess(success);
        }
      },
      setOrgStatus: (id, status, reason) => {
        let success: string | null = null;
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === id);
          success = `${org?.name ?? "Organisation"} is now ${status}. Records were kept.`;
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === id ? { ...item, status, reason } : item,
              ),
            },
            `${status} ${org?.name ?? "organisation"}: ${reason}`,
            org?.name ?? "",
            success,
          );
        });
        if (success) flashDeskSuccess(success);
      },
      updateOrgProfile: (orgId, input) => {
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === orgId);
          const name = input.name.trim();
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === orgId
                  ? {
                      ...item,
                      name,
                      legalName: input.legalName.trim(),
                      companyNumber: input.companyNumber.trim(),
                      billingEmail: input.billingEmail.trim().toLowerCase(),
                    }
                  : item,
              ),
              audit: current.audit.map((row) =>
                row.org === org?.name ? { ...row, org: name } : row,
              ),
            },
            `Updated organisation profile for ${name}`,
            name,
            "Saved",
          );
        });
        flashDeskSuccess("Organisation profile saved.");
      },
      saveOrgSettings: (orgId, input) => {
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === orgId);
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === orgId
                  ? {
                      ...item,
                      settings: { ...item.settings, ...input },
                    }
                  : item,
              ),
            },
            "Updated organisation settings",
            org?.name ?? "",
            "Saved",
          );
        });
        flashDeskSuccess("Organisation settings saved.");
      },
      addOrgIntegration: (orgId, input) => {
        const id = `i-${Date.now()}`;
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === orgId);
          return withAudit(
            {
              ...current,
              integrations: [
                {
                  id,
                  name: input.name.trim(),
                  orgId,
                  status: "Not configured",
                  kind: input.kind.trim(),
                  endpoint: "",
                  apiKeyHint: "",
                  webhookUrl: "",
                  syncCadence: "Manual",
                  lastSyncAt: "Never",
                  lastError: "",
                },
                ...current.integrations,
              ],
            },
            `Added ${input.name} connection`,
            org?.name ?? "",
            "Created",
          );
        });
        flashDeskSuccess("Connection added. Open it to configure.");
        return id;
      },
      toggleModule: (orgId, name) => {
        flashDeskSuccess(
          `${name} access changed. Existing records stay.`,
        );
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            orgs: current.orgs.map((org) =>
              org.id === orgId
                ? {
                    ...org,
                    modules: { ...org.modules, [name]: !org.modules[name] },
                  }
                : org,
            ),
          };
        });
      },
      inviteUser: ({ name, email, role: userRole, scope, orgId = "northbridge" }) => {
        let success: string | null = null;
        let duplicate = false;
        setState((current) => {
          if (!current) return current;
          const mail = email.trim().toLowerCase();
          const taken = current.users.some(
            (user) => user.email?.toLowerCase() === mail,
          );
          if (taken) {
            duplicate = true;
            return current;
          }
          const org =
            current.orgs.find((item) => item.id === orgId)?.name ??
            "Organisation";
          success = `Invitation sent to ${mail}.`;
          return withAudit(
            {
              ...current,
              users: [
                ...current.users,
                {
                  id: `u-${globalThis.crypto.randomUUID()}`,
                  name,
                  email: mail,
                  role: userRole,
                  scope,
                  status: "Invited",
                  orgId,
                  statusNote: "",
                },
              ],
            },
            `Invited ${mail} as ${userRole}`,
            org,
            success,
          );
        });
        if (duplicate) {
          flashDeskError(
            "This email already has an active or invited account.",
          );
        } else if (success) {
          flashDeskSuccess(success);
        }
      },
      updateUser: (id, input) => {
        let duplicate = false;
        setState((current) => {
          if (!current) return current;
          const user = current.users.find((item) => item.id === id);
          const org =
            current.orgs.find((item) => item.id === user?.orgId)?.name ?? "";
          const mail = input.email.trim().toLowerCase();
          const emailTaken = current.users.some(
            (item) => item.id !== id && item.email.toLowerCase() === mail,
          );
          if (emailTaken) {
            duplicate = true;
            return current;
          }
          return withAudit(
            {
              ...current,
              users: current.users.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      name: input.name.trim(),
                      email: mail,
                      role: input.role,
                      scope: input.scope,
                    }
                  : item,
              ),
            },
            `Updated ${user?.name ?? "user"} profile and access`,
            org,
            "Saved",
          );
        });
        if (duplicate) {
          flashDeskError("Another user already uses this email.");
        } else {
          flashDeskSuccess("User details saved.");
        }
      },
      setUserStatus: (id, status, reason) => {
        setState((current) => {
          if (!current) return current;
          const user = current.users.find((item) => item.id === id);
          const org =
            current.orgs.find((item) => item.id === user?.orgId)?.name ?? "";
          return withAudit(
            {
              ...current,
              users: current.users.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status,
                      statusNote: reason.trim(),
                    }
                  : item,
              ),
            },
            `${status} ${user?.email ?? "user"}: ${reason.trim()}`,
            org,
            "Updated",
          );
        });
        flashDeskSuccess(`User is now ${status}.`);
      },
      removeUser: (id, reason) => {
        setState((current) => {
          if (!current) return current;
          const user = current.users.find((item) => item.id === id);
          if (!user) return current;
          const org =
            current.orgs.find((item) => item.id === user.orgId)?.name ?? "";
          return withAudit(
            {
              ...current,
              users: current.users.filter((item) => item.id !== id),
            },
            `Removed member ${user.email}: ${reason.trim()}`,
            org,
            "Removed",
          );
        });
        flashDeskSuccess("Member removed from this organisation.");
      },
      resendUserInvite: (id) => {
        setState((current) => {
          if (!current) return current;
          const user = current.users.find((item) => item.id === id);
          const org =
            current.orgs.find((item) => item.id === user?.orgId)?.name ?? "";
          if (!user) return current;
          return withAudit(
            current,
            `Resent invite to ${user.email}`,
            org,
            "Sent",
          );
        });
        flashDeskSuccess("Invitation resent.");
      },
      createOffice: (orgId, input) => {
        const id = `${orgId}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === orgId);
          const office: Office = {
            id,
            status: input.status ?? "Active",
            name: input.name.trim(),
            line1: input.line1.trim(),
            line2: input.line2.trim(),
            town: input.town.trim(),
            postcode: input.postcode.trim(),
            phone: input.phone.trim(),
            email: input.email.trim().toLowerCase(),
            manager: input.manager.trim(),
            notes: input.notes.trim(),
          };
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === orgId
                  ? { ...item, offices: [...item.offices, office] }
                  : item,
              ),
            },
            `Added office ${office.name}`,
            org?.name ?? "",
            "Created",
          );
        });
        flashDeskSuccess(`${input.name.trim()} office created.`);
        return id;
      },
      updateOffice: (orgId, officeId, input) => {
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === orgId);
          const existing = org?.offices.find((item) => item.id === officeId);
          const previousName = existing?.name ?? "";
          const nextName = input.name.trim();
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === orgId
                  ? {
                      ...item,
                      offices: item.offices.map((office) =>
                        office.id === officeId
                          ? {
                              ...office,
                              ...input,
                              name: nextName,
                              email: input.email.trim().toLowerCase(),
                            }
                          : office,
                      ),
                    }
                  : item,
              ),
              properties:
                previousName && previousName !== nextName
                  ? current.properties.map((property) =>
                      property.branch === previousName
                        ? { ...property, branch: nextName }
                        : property,
                    )
                  : current.properties,
              users:
                previousName && previousName !== nextName
                  ? current.users.map((user) =>
                      user.scope === previousName
                        ? { ...user, scope: nextName }
                        : user,
                    )
                  : current.users,
            },
            `Updated office ${nextName}`,
            org?.name ?? "",
            "Saved",
          );
        });
        flashDeskSuccess("Office details saved.");
      },
      setOfficeStatus: (orgId, officeId, status, reason) => {
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === orgId);
          const office = org?.offices.find((item) => item.id === officeId);
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === orgId
                  ? {
                      ...item,
                      offices: item.offices.map((row) =>
                        row.id === officeId
                          ? {
                              ...row,
                              status,
                              notes: reason.trim()
                                ? `${row.notes}\n${reason.trim()}`.trim()
                                : row.notes,
                            }
                          : row,
                      ),
                    }
                  : item,
              ),
            },
            `${status} office ${office?.name ?? ""}: ${reason.trim()}`,
            org?.name ?? "",
            "Updated",
          );
        });
        flashDeskSuccess(`Office marked ${status}.`);
      },
      removeOffice: (orgId, officeId, reason) => {
        let blocked = false;
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === orgId);
          const office = org?.offices.find((item) => item.id === officeId);
          if (!office) return current;
          const inUse = current.properties.some(
            (property) => property.branch === office.name,
          );
          if (inUse) {
            blocked = true;
            return current;
          }
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === orgId
                  ? {
                      ...item,
                      offices: item.offices.filter(
                        (row) => row.id !== officeId,
                      ),
                    }
                  : item,
              ),
            },
            `Removed office ${office.name}: ${reason.trim()}`,
            org?.name ?? "",
            "Removed",
          );
        });
        if (blocked) {
          flashDeskError(
            "Cannot remove an office that still has properties assigned. Reassign them first.",
          );
        } else {
          flashDeskSuccess("Office removed.");
        }
      },
      requestOrg: ({ company, contact, email, branch }) => {
        const message = `${company.trim()} is requested. A platform admin will set it up.`;
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            requests: [
              {
                id: `req-${globalThis.crypto.randomUUID()}`,
                company: company.trim(),
                contact: contact.trim(),
                email: email.trim().toLowerCase(),
                branch: branch.trim(),
                status: "Requested",
              },
              ...current.requests,
            ],
          };
        });
        flashDeskSuccess(message);
      },
      decideRequest: (id, status) => {
        let success: string | null = null;
        setState((current) => {
          if (!current) return current;
          const request = current.requests.find((item) => item.id === id);
          if (request?.status !== "Requested") return current;
          const requests = current.requests.map((item) =>
            item.id === id ? { ...item, status } : item,
          );
          if (status === "Declined") {
            success = `${request.company} was declined. No organisation was created.`;
            return withAudit(
              { ...current, requests },
              `Declined organisation request ${request.company}`,
              request.company,
              success,
            );
          }
          const orgId = `org-${globalThis.crypto.randomUUID()}`;
          success = `${request.company} is in Setup with ${request.branch} as its first office. Invite sent to ${request.email}.`;
          return withAudit(
            {
              ...current,
              requests,
              orgs: [
                ...current.orgs,
                {
                  id: orgId,
                  name: request.company,
                  status: "Setup",
                  offices: [seedOffice(orgId, request.branch)],
                  modules: {
                    Properties: true,
                    Lettings: true,
                    Compliance: true,
                    Maintenance: true,
                    Finance: false,
                    Migration: false,
                  },
                  reason: "",
                  legalName: request.company,
                  companyNumber: "",
                  billingEmail: request.email,
                  settings: defaultOrgSettings(),
                },
              ],
              users: [
                ...current.users,
                {
                  id: `u-${globalThis.crypto.randomUUID()}`,
                  name: request.contact,
                  email: request.email,
                  role: "Organisation Admin",
                  scope: request.branch,
                  status: "Invited",
                  orgId,
                  statusNote: "",
                },
              ],
            },
            `Approved organisation ${request.company}`,
            request.company,
            success,
          );
        });
        if (success) flashDeskSuccess(success);
      },
      saveSettings: (days) => {
        setState((current) =>
          current ? { ...current, reminderDays: days } : current,
        );
        flashDeskSuccess("Reminder window saved.");
      },
      testIntegration: (id) => {
        let message = "Connection responded. Status is Connected.";
        setState((current) => {
          if (!current) return current;
          const item = current.integrations.find((row) => row.id === id);
          message = `${item?.name ?? "Connection"} responded. Status is Connected.`;
          const log = {
            id: `il-${Date.now()}`,
            integrationId: id,
            when: `Today ${stamp()}`,
            level: "info" as const,
            message: "Manual connection test succeeded",
          };
          return {
            ...current,
            integrations: current.integrations.map((row) =>
              row.id === id
                ? {
                    ...row,
                    status: "Connected",
                    lastSyncAt: `Today ${stamp()}`,
                    lastError: "",
                  }
                : row,
            ),
            integrationLogs: [log, ...current.integrationLogs],
          };
        });
        flashDeskSuccess(message);
      },
      saveIntegrationConfig: (id, input) => {
        setState((current) => {
          if (!current) return current;
          const hint =
            input.apiKey.trim().length > 0
              ? `••••${input.apiKey.trim().slice(-4)}`
              : current.integrations.find((row) => row.id === id)?.apiKeyHint ??
                "";
          const item = current.integrations.find((row) => row.id === id);
          const org = current.orgs.find((o) => o.id === item?.orgId)?.name ?? "";
          return withAudit(
            {
              ...current,
              integrations: current.integrations.map((row) =>
                row.id === id
                  ? {
                      ...row,
                      endpoint: input.endpoint.trim(),
                      webhookUrl: input.webhookUrl.trim(),
                      syncCadence: input.syncCadence.trim(),
                      apiKeyHint: hint || row.apiKeyHint,
                      status:
                        row.status === "Not configured"
                          ? "Connected"
                          : row.status,
                    }
                  : row,
              ),
              integrationLogs: [
                {
                  id: `il-${Date.now()}`,
                  integrationId: id,
                  when: `Today ${stamp()}`,
                  level: "info" as const,
                  message: "Configuration saved",
                },
                ...current.integrationLogs,
              ],
            },
            `Updated ${item?.name ?? "integration"} settings`,
            org,
            "Saved",
          );
        });
        flashDeskSuccess("Integration settings saved.");
      },
      disconnectIntegration: (id) => {
        setState((current) => {
          if (!current) return current;
          const item = current.integrations.find((row) => row.id === id);
          const org = current.orgs.find((o) => o.id === item?.orgId)?.name ?? "";
          return withAudit(
            {
              ...current,
              integrations: current.integrations.map((row) =>
                row.id === id
                  ? {
                      ...row,
                      status: "Disconnected",
                      apiKeyHint: "",
                      lastError: "Disconnected by administrator",
                    }
                  : row,
              ),
              integrationLogs: [
                {
                  id: `il-${Date.now()}`,
                  integrationId: id,
                  when: `Today ${stamp()}`,
                  level: "warn" as const,
                  message: "Connection disconnected",
                },
                ...current.integrationLogs,
              ],
            },
            `Disconnected ${item?.name ?? "integration"}`,
            org,
            "Disconnected",
          );
        });
        flashDeskSuccess("Integration disconnected.");
      },
      assignWork: (id, owner) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            work: current.work.map((item) =>
              item.id === id ? { ...item, owner, state: "Open" } : item,
            ),
          };
        });
        flashDeskSuccess(`Assigned to ${owner}.`);
      },
      resolveWork: (id) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            work: current.work.map((item) =>
              item.id === id ? { ...item, state: "Resolved" } : item,
            ),
          };
        });
        flashDeskSuccess("Marked resolved.");
      },
      setPropertyStatus: (id, status, reason) => {
        const message = `Status is ${status}.`;
        setState((current) => {
          if (!current) return current;
          const property = current.properties.find((item) => item.id === id);
          return withAudit(
            {
              ...current,
              properties: current.properties.map((item) =>
                item.id === id ? { ...item, status } : item,
              ),
            },
            `${property?.address ?? "Property"} set to ${status}: ${reason}`,
            "Property",
            message,
          );
        });
        flashDeskSuccess(message);
      },
      toggleCheck: (id, item) =>
        setState((current) =>
          current
            ? {
                ...current,
                properties: current.properties.map((property) =>
                  property.id === id
                    ? {
                        ...property,
                        checks: {
                          ...property.checks,
                          [item]: !property.checks[item],
                        },
                      }
                    : property,
                ),
              }
            : current,
        ),
      publishListing: (id) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            listings: current.listings.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "Published",
                    publishedAt: `Today ${stamp()}`,
                  }
                : item,
            ),
          };
        });
        flashDeskSuccess("Sent to the portal. Channel status is Published.");
      },
      createListing: (input) => {
        const id = `ls-${Date.now()}`;
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            listings: [
              {
                id,
                address: input.address.trim(),
                portal: input.portal.trim(),
                status: "Draft",
                rent: input.rent.trim(),
                bedrooms: input.bedrooms.trim(),
                description: input.description.trim(),
              },
              ...current.listings,
            ],
          };
        });
        flashDeskSuccess("Listing saved as draft.");
        return id;
      },
      setViewingOutcome: (id, outcome) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            viewings: current.viewings.map((item) =>
              item.id === id ? { ...item, outcome } : item,
            ),
          };
        });
        flashDeskSuccess(`Viewing marked ${outcome}.`);
      },
      acceptApplicant: (id) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            applicants: current.applicants.map((item) =>
              item.id === id ? { ...item, stage: "Selected" } : item,
            ),
          };
        });
        flashDeskSuccess(
          "Applicant selected. Onboarding can start without retyping.",
        );
      },
      validateCert: (id) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            certificates: current.certificates.map((item) =>
              item.id === id ? { ...item, status: "Compliant" } : item,
            ),
          };
        });
        flashDeskSuccess("Evidence checked. Status is Compliant.");
      },
      renewCert: (id, expiry) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            certificates: current.certificates.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "Compliant",
                    expiry,
                    history: [
                      `Previous expiry ${item.expiry}`,
                      ...item.history,
                    ],
                  }
                : item,
            ),
          };
        });
        flashDeskSuccess(
          "New expiry saved. The previous certificate is still in history.",
        );
      },
      matchPayment: (id) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            payments: current.payments.map((item) =>
              item.id === id ? { ...item, status: "Matched" } : item,
            ),
          };
        });
        flashDeskSuccess("Payment matched to the tenancy.");
      },
      savePlan: (id, plan) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            arrears: current.arrears.map((item) =>
              item.id === id ? { ...item, plan } : item,
            ),
          };
        });
        flashDeskSuccess("Payment plan saved. No legal step was taken.");
      },
      publishStatement: (id) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            statements: current.statements.map((item) =>
              item.id === id ? { ...item, status: "Published" } : item,
            ),
          };
        });
        flashDeskSuccess("Statement published for the landlord view.");
      },
      setMigrationStage: (id, stage) => {
        const note =
          stage === "Live"
            ? "Cutover written. Source id and batch kept on each row."
            : stage === "Dry run"
              ? "Dry run finished. Production was not written."
              : stage === "Mapped"
                ? "Field mapping saved for this project."
                : "Staging only. Live records are unchanged.";
        setState((current) => {
          if (!current) return current;
          return withAudit(
            {
              ...current,
              migrations: current.migrations.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      stage,
                      note,
                      ...(stage === "Dry run"
                        ? {
                            dryRunCounts: {
                              properties: 128,
                              tenancies: 96,
                              contacts: 214,
                            },
                            reconciliationOk: true,
                          }
                        : {}),
                      ...(stage === "Live" ? { reconciliationOk: true } : {}),
                    }
                  : item,
              ),
            },
            `Migration moved to ${stage}`,
            "Northbridge Lettings",
            note,
          );
        });
        flashDeskSuccess(note);
      },
      runMigrationImport: (id) => {
        setState((current) => {
          if (!current) return current;
          return withAudit(
            {
              ...current,
              migrations: current.migrations.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      importedRows: 842,
                      lastImportAt: `Today ${stamp()}`,
                      stage: item.stage === "Staging" ? "Imported" : item.stage,
                      note: "Sample extract loaded to staging.",
                    }
                  : item,
              ),
            },
            "Migration import to staging",
            "Migration",
            "Staging updated.",
          );
        });
        flashDeskSuccess("Import loaded to staging.");
      },
      runMigrationValidation: (id) => {
        setState((current) => {
          if (!current) return current;
          return withAudit(
            {
              ...current,
              migrations: current.migrations.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      errorCount: 3,
                      warningCount: 11,
                      duplicateCount: 2,
                      stage: "Validated",
                      note: "Validation finished. Review issues before dry run.",
                    }
                  : item,
              ),
            },
            "Migration validation run",
            "Migration",
            "Validation complete.",
          );
        });
        flashDeskSuccess("Validation complete. Review issues on the Validation tab.");
      },
      decideJob: (id, status) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            jobs: current.jobs.map((item) =>
              item.id === id ? { ...item, status } : item,
            ),
          };
        });
        flashDeskSuccess(`Quote ${status.toLowerCase()}.`);
      },
      acceptJob: (id) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            jobs: current.jobs.map((item) =>
              item.id === id ? { ...item, status: "Scheduled" } : item,
            ),
          };
        });
        flashDeskSuccess("Job accepted.");
      },
      declineJob: (id, reason) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            jobs: current.jobs.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "Declined",
                    declineReason: reason,
                    assignee: "Unassigned",
                  }
                : item,
            ),
          };
        });
        flashDeskSuccess("Declined. Operations can reassign it.");
      },
      completeJob: (id, notes) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            jobs: current.jobs.map((item) =>
              item.id === id ? { ...item, status: "Complete", notes } : item,
            ),
          };
        });
        flashDeskSuccess("Marked complete. Waiting on operations review.");
      },
      quoteJob: (id, amount) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            jobs: current.jobs.map((item) =>
              item.id === id
                ? { ...item, quote: amount, status: "Waiting approval" }
                : item,
            ),
          };
        });
        flashDeskSuccess("Quote sent. Work waits for approval.");
      },
      submitStep: (id) => {
        setState((current) => {
          if (!current) return current;
          const order = current.onboarding.map((item) => item.id);
          const index = order.indexOf(id);
          let onboarding = current.onboarding.map((item) =>
            item.id === id
              ? { ...item, state: "Complete", blocker: "" }
              : item,
          );
          if (index >= 0 && index < order.length - 1) {
            const nextId = order[index + 1];
            onboarding = onboarding.map((item) =>
              item.id === nextId &&
              (item.state === "Not started" ||
                item.state === "Blocked" ||
                item.state === "In progress")
                ? { ...item, state: "In progress", blocker: "" }
                : item,
            );
          }
          return { ...current, onboarding: onboarding as OnboardingStep[] };
        });
        flashDeskSuccess("Step submitted.");
      },
      createMigrationProject: (input) => {
        const id = `m-${Date.now()}`;
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            migrations: [
              {
                id,
                agency: input.agency.trim(),
                source: input.source.trim(),
                stage: "Imported",
                note: "New project — configure mapping before dry run.",
                importedRows: 0,
                errorCount: 0,
                warningCount: 0,
                duplicateCount: 0,
                sourceBatch: `B-${Date.now().toString().slice(-6)}`,
                reconciliationOk: false,
              },
              ...current.migrations,
            ],
          };
        });
        flashDeskSuccess("Migration project created.");
        return id;
      },
      createRentSchedule: (input) => {
        const id = `rs-${Date.now()}`;
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            rentSchedules: [
              {
                id,
                tenancy: input.tenancy.trim(),
                amount: input.amount.trim(),
                frequency: input.frequency.trim(),
                status: "Active",
                nextDue: "1 Nov 2026",
                method: input.method.trim(),
              },
              ...current.rentSchedules,
            ],
          };
        });
        flashDeskSuccess("Rent schedule created.");
        return id;
      },
      updateRentSchedule: (id, input) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            rentSchedules: current.rentSchedules.map((item) =>
              item.id === id
                ? {
                    ...item,
                    amount: input.amount.trim(),
                    frequency: input.frequency.trim(),
                    method: input.method.trim(),
                    status: input.status,
                  }
                : item,
            ),
          };
        });
        flashDeskSuccess("Rent schedule updated.");
      },
      setRequirementStatus: (id, status) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            requirements: current.requirements.map((item) =>
              item.id === id ? { ...item, status } : item,
            ),
          };
        });
        flashDeskSuccess(`Requirement marked ${status}.`);
      },
      uploadDocument: (input) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            documents: [
              {
                id: `doc-${Date.now()}`,
                name: input.name.trim(),
                type: input.type.trim(),
                linkedTo: input.linkedTo.trim(),
                uploaded: `Today ${stamp()}`,
                orgId: input.orgId,
              },
              ...current.documents,
            ],
          };
        });
        flashDeskSuccess("Document uploaded (mock).");
      },
      reportIssue: (category, detail) => {
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            jobs: [
              {
                id: `j-${Date.now()}`,
                title: category,
                address: "22 Queen's Road",
                status: "Submitted",
                quote: "",
                assignee: "Unassigned",
                notes: detail,
                declineReason: "",
              },
              ...current.jobs,
            ],
          };
        });
        flashDeskSuccess("Issue submitted. Reference MT-2041.");
      },
    }),
    [],
  );

  if (!state) {
    return (
      <Work aria-busy="true">
        <p className="kicker">Opening the desk</p>
        <Shimmer size="lg" />
      </Work>
    );
  }

  return (
    <DeskContext.Provider value={{ state, api }}>
      {children}
    </DeskContext.Provider>
  );
}

export function useDesk() {
  const value = useContext(DeskContext);
  if (!value) {
    throw new Error("Desk is only available inside a role");
  }
  return value;
}
