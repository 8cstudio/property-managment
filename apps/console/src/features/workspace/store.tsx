"use client";

import {
  DeskBootFloating,
  type DeskBootStep,
} from "./desk-boot-loader";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createSeed,
  type DeskState,
  type Office,
  type OnboardingStep,
  defaultOrgSettings,
  seedOffice,
  type OrgRoleDefinition,
  type OrgSettings,
} from "./data";
import {
  isAssignableOrgRole,
  normalizeRoleCatalog,
  resolveStaffAccessRole,
} from "./staff-roles";
import * as deskClient from "./desk-client";
import type { DeskCollections } from "./desk-client";
import { flashDeskError, flashDeskSuccess } from "./desk-feedback";
import {
  collectMetricValues,
  upsertMetricSnapshots,
} from "@/features/dashboard/metric-snapshots";
import { stripOrphanDeskData } from "./desk-sanitize";
import * as orgRequestsClient from "./org-requests-client";
import { apiGetSession, type Viewer } from "./session-client";

/** Current signed-in user for audit actor labels (set by DeskProvider). */
const deskViewerRef: { current: Viewer | null } = { current: null };

/** Everything except identity (orgs/users), which comes from the orgs API. */
function pickCollections(state: DeskState): DeskCollections {
  return {
    properties: state.properties,
    work: state.work,
    listings: state.listings,
    applicants: state.applicants,
    viewings: state.viewings,
    certificates: state.certificates,
    jobs: state.jobs,
    payments: state.payments,
    arrears: state.arrears,
    statements: state.statements,
    migrations: state.migrations,
    migrationIssues: state.migrationIssues,
    migrationMappings: state.migrationMappings,
    documents: state.documents,
    requirements: state.requirements,
    rentSchedules: state.rentSchedules,
    integrations: state.integrations,
    integrationLogs: state.integrationLogs,
    audit: state.audit,
    onboarding: state.onboarding,
    reminderDays: state.reminderDays,
    notice: state.notice,
    security: state.security,
    metricSnapshots: state.metricSnapshots ?? [],
  };
}

export type DeskApi = {
  createOrg: (input: {
    name: string;
    branch: string;
    admin: string;
    adminName?: string;
    modules?: Record<string, boolean>;
  }) => Promise<void>;
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
  saveOrgStaffRoles: (
    orgId: string,
    input: {
      roleCatalog: OrgRoleDefinition[];
      disabledRoleLabels: string[];
    },
  ) => void;
  renameOrgStaffRole: (
    orgId: string,
    fromLabel: string,
    toLabel: string,
  ) => void;
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
    phone: string;
    country: string;
    branch: string;
    about: string;
    memberYears: number;
    memberCount: number;
    minProperties: number;
  }) => Promise<void>;
  decideRequest: (
    id: string,
    status: "Approved" | "Declined",
  ) => Promise<void>;
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

const DeskContext = createContext<{
  state: DeskState;
  api: DeskApi;
  viewer: Viewer | null;
} | null>(null);

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
        actor:
          deskViewerRef.current?.user.name ||
          deskViewerRef.current?.user.email ||
          "Staff",
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
  const [bootStep, setBootStep] = useState<DeskBootStep | null>(1);
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootTry, setBootTry] = useState(0);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const stateRef = useRef<DeskState | null>(null);
  const collectionsLoadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let active = true;
    void apiGetSession().then((v) => {
      if (!active) return;
      deskViewerRef.current = v;
      setViewer(v);
    });
    return () => {
      active = false;
    };
  }, [role]);

  /** Reload organisations + memberships from the API (source of truth). */
  const refreshIdentity = useCallback(async () => {
    try {
      const { orgs, staff } = await deskClient.fetchIdentity();
      setState((cur) => (cur ? { ...cur, orgs, users: staff } : cur));
    } catch {
      /* keep current state */
    }
  }, []);

  useEffect(() => {
    let active = true;
    collectionsLoadedRef.current = false;
    const seed = createSeed();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    setState(seed);
    setBootStep(1);
    setBootError(null);

    const mergeState = (patch: Partial<DeskState> | ((cur: DeskState) => DeskState)) => {
      setState((cur) => {
        const base = cur ?? seed;
        return typeof patch === "function" ? patch(base) : { ...base, ...patch };
      });
    };

    const signal = controller.signal;
    let finished = 0;
    let failed = false;
    const mark = (step: DeskBootStep) => {
      finished += 1;
      if (!active) return;
      if (finished < 3) setBootStep(step);
    };

    void (async () => {
      await Promise.all([
        deskClient
          .fetchIdentity(signal)
          .then(({ orgs, staff }) => {
            if (active) mergeState({ orgs, users: staff });
          })
          .catch(() => {
            failed = true;
          })
          .finally(() => mark(2)),
        orgRequestsClient
          .fetchOrgRequestsApi(signal)
          .then((requests) => {
            if (active) mergeState({ requests });
          })
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "";
            if (message.includes("Platform admins")) return;
            failed = true;
          })
          .finally(() => mark(3)),
        deskClient
          .fetchDeskCollections(signal)
          .then((collections) => {
            if (!active) return;
            if (collections) {
              const { requests: _legacyRequests, ...rest } =
                collections as DeskCollections & {
                  requests?: DeskState["requests"];
                };
              mergeState((cur) =>
                stripOrphanDeskData({
                  ...cur,
                  ...rest,
                  metricSnapshots: rest.metricSnapshots ?? [],
                }),
              );
            }
            collectionsLoadedRef.current = true;
          })
          .catch(() => {
            failed = true;
          })
          .finally(() => mark(3)),
      ]);

      if (!active) return;
      setBootStep(failed ? 3 : null);
      setBootError(failed ? "failed" : null);
    })();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [role, bootTry]);

  // Debounced persistence of desk collections after any local mutation.
  useEffect(() => {
    if (!state || !collectionsLoadedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const current = stateRef.current;
      if (!current) return;
      const metricSnapshots = upsertMetricSnapshots(
        current.metricSnapshots ?? [],
        collectMetricValues(current),
      );
      const snapshotsChanged =
        JSON.stringify(metricSnapshots) !==
        JSON.stringify(current.metricSnapshots ?? []);
      const next = snapshotsChanged
        ? { ...current, metricSnapshots }
        : current;
      if (snapshotsChanged) {
        stateRef.current = next;
        setState(next);
      }
      void deskClient.saveDeskCollections(pickCollections(next)).catch(() => {
        /* best-effort; the next mutation will retry */
      });
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  const api = useMemo<DeskApi>(
    () => ({
      createOrg: async ({ name, branch, admin, adminName, modules }) => {
        try {
          const { org, staff } = await deskClient.createOrgApi({
            name: name.trim(),
            branch: branch.trim(),
            adminEmail: admin.trim(),
            ...(adminName ? { adminName: adminName.trim() } : {}),
            ...(modules ? { modules } : {}),
          });
          setState((current) =>
            current
              ? {
                  ...current,
                  orgs: [...current.orgs, org],
                  users: [...current.users, staff],
                }
              : current,
          );
          flashDeskSuccess(
            staff.status === "Active"
              ? `${org.name} is in Setup. ${staff.email} already has EZZI access as organisation admin.`
              : `${org.name} is in Setup. ${staff.email} activates by entering their email on the sign-in page to set a password.`,
          );
        } catch (error) {
          flashDeskError(
            error instanceof Error
              ? error.message
              : "Could not create organisation.",
          );
        }
      },
      setOrgStatus: (id, status, reason) => {
        const org = stateRef.current?.orgs.find((item) => item.id === id);
        setState((current) =>
          current
            ? withAudit(
                {
                  ...current,
                  orgs: current.orgs.map((item) =>
                    item.id === id ? { ...item, status, reason } : item,
                  ),
                },
                `${status} ${org?.name ?? "organisation"}: ${reason}`,
                org?.name ?? "",
                "",
              )
            : current,
        );
        deskClient
          .patchOrgApi(id, { status, reason })
          .then(() =>
            flashDeskSuccess(
              `${org?.name ?? "Organisation"} is now ${status}. Records were kept.`,
            ),
          )
          .catch((error) => {
            flashDeskError(
              error instanceof Error ? error.message : "Could not update status.",
            );
            void refreshIdentity();
          });
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
        deskClient
          .patchOrgApi(orgId, {
            name: input.name.trim(),
            legalName: input.legalName.trim(),
            companyNumber: input.companyNumber.trim(),
            billingEmail: input.billingEmail.trim().toLowerCase(),
          })
          .catch((error) => {
            flashDeskError(
              error instanceof Error ? error.message : "Could not save profile.",
            );
            void refreshIdentity();
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
        deskClient.patchOrgApi(orgId, { settings: input }).catch((error) => {
          flashDeskError(
            error instanceof Error ? error.message : "Could not save settings.",
          );
          void refreshIdentity();
        });
        flashDeskSuccess("Organisation settings saved.");
      },
      saveOrgStaffRoles: (orgId, input) => {
        const org = stateRef.current?.orgs.find((item) => item.id === orgId);
        if (!org) {
          flashDeskError("Organisation not found.");
          return;
        }
        const roleCatalog = normalizeRoleCatalog(input.roleCatalog);
        const disabledRoleLabels = input.disabledRoleLabels;
        const previewOrg = {
          ...org,
          settings: { ...org.settings, roleCatalog, disabledRoleLabels },
        };
        const team =
          stateRef.current?.users.filter((user) => user.orgId === orgId) ?? [];
        const invalid = team.find(
          (user) => !isAssignableOrgRole(user.role, previewOrg),
        );
        if (invalid) {
          flashDeskError(
            `${invalid.name} still uses “${invalid.role}”. Reassign them before disabling or removing that role.`,
          );
          return;
        }
        const settings = { roleCatalog, disabledRoleLabels };
        setState((current) => {
          if (!current) return current;
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === orgId
                  ? { ...item, settings: { ...item.settings, ...settings } }
                  : item,
              ),
            },
            "Updated staff roles",
            org.name,
            "Saved",
          );
        });
        deskClient.patchOrgApi(orgId, { settings }).catch((error) => {
          flashDeskError(
            error instanceof Error ? error.message : "Could not save staff roles.",
          );
          void refreshIdentity();
        });
        flashDeskSuccess("Staff roles saved.");
      },
      renameOrgStaffRole: (orgId, fromLabel, toLabel) => {
        const from = fromLabel.trim();
        const to = toLabel.trim();
        if (!from || !to || from === to) return;
        const org = stateRef.current?.orgs.find((item) => item.id === orgId);
        if (!org) {
          flashDeskError("Organisation not found.");
          return;
        }
        const access = resolveStaffAccessRole(from, org);
        if (!access) {
          flashDeskError("That role cannot be renamed.");
          return;
        }
        let roleCatalog = org.settings.roleCatalog ?? [];
        if (!isAssignableOrgRole(to, { ...org, settings: { ...org.settings, roleCatalog } })) {
          roleCatalog = normalizeRoleCatalog([
            ...roleCatalog,
            { label: to, access },
          ]);
        } else {
          roleCatalog = roleCatalog.map((row) =>
            row.label === from ? { ...row, label: to } : row,
          );
        }
        const previewOrg = {
          ...org,
          settings: { ...org.settings, roleCatalog },
        };
        if (!isAssignableOrgRole(to, previewOrg)) {
          flashDeskError("That role name is not allowed.");
          return;
        }
        const affected =
          stateRef.current?.users.filter(
            (user) => user.orgId === orgId && user.role === from,
          ) ?? [];
        void (async () => {
          try {
            for (const user of affected) {
              const staff = await deskClient.patchOrgUserApi(orgId, user.id, {
                role: to,
              });
              setState((current) =>
                current
                  ? {
                      ...current,
                      users: current.users.map((item) =>
                        item.id === user.id ? staff : item,
                      ),
                    }
                  : current,
              );
            }
            await deskClient.patchOrgApi(orgId, {
              settings: { ...org.settings, roleCatalog },
            });
            setState((current) =>
              current
                ? {
                    ...current,
                    orgs: current.orgs.map((item) =>
                      item.id === orgId
                        ? {
                            ...item,
                            settings: { ...item.settings, roleCatalog },
                          }
                        : item,
                    ),
                  }
                : current,
            );
            flashDeskSuccess("Role renamed for all affected members.");
          } catch (error) {
            flashDeskError(
              error instanceof Error ? error.message : "Could not rename role.",
            );
            void refreshIdentity();
          }
        })();
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
        const org = stateRef.current?.orgs.find((item) => item.id === orgId);
        const nextModules = {
          ...(org?.modules ?? {}),
          [name]: !(org?.modules?.[name] ?? false),
        };
        flashDeskSuccess(`${name} access changed. Existing records stay.`);
        setState((current) =>
          current
            ? {
                ...current,
                orgs: current.orgs.map((item) =>
                  item.id === orgId ? { ...item, modules: nextModules } : item,
                ),
              }
            : current,
        );
        deskClient.patchOrgApi(orgId, { modules: nextModules }).catch((error) => {
          flashDeskError(
            error instanceof Error ? error.message : "Could not update modules.",
          );
          void refreshIdentity();
        });
      },
      inviteUser: ({ name, email, role: userRole, scope, orgId }) => {
        const targetOrg = orgId ?? stateRef.current?.orgs[0]?.id;
        if (!targetOrg) {
          flashDeskError("No organisation selected for this invite.");
          return;
        }
        void (async () => {
          try {
            const staff = await deskClient.addOrgUserApi(targetOrg, {
              name: name.trim(),
              email: email.trim(),
              role: userRole,
              scope,
            });
            setState((current) =>
              current
                ? { ...current, users: [...current.users, staff] }
                : current,
            );
            flashDeskSuccess(
              staff.status === "Active"
                ? `${staff.email} already has EZZI access and can sign in now.`
                : `${staff.email} is invited. They activate by entering their email on the sign-in page to set a password.`,
            );
          } catch (error) {
            flashDeskError(
              error instanceof Error ? error.message : "Could not add this user.",
            );
          }
        })();
      },
      updateUser: (id, input) => {
        const user = stateRef.current?.users.find((item) => item.id === id);
        if (!user) {
          flashDeskError("User not found.");
          return;
        }
        void (async () => {
          try {
            const staff = await deskClient.patchOrgUserApi(user.orgId, id, {
              name: input.name.trim(),
              email: input.email.trim(),
              role: input.role,
              scope: input.scope,
            });
            setState((current) =>
              current
                ? {
                    ...current,
                    users: current.users.map((item) =>
                      item.id === id ? staff : item,
                    ),
                  }
                : current,
            );
            flashDeskSuccess("User details saved.");
          } catch (error) {
            flashDeskError(
              error instanceof Error ? error.message : "Could not save user.",
            );
          }
        })();
      },
      setUserStatus: (id, status, reason) => {
        const user = stateRef.current?.users.find((item) => item.id === id);
        if (!user) {
          flashDeskError("User not found.");
          return;
        }
        void (async () => {
          try {
            const staff = await deskClient.patchOrgUserApi(user.orgId, id, {
              status,
              statusNote: reason.trim(),
            });
            setState((current) =>
              current
                ? {
                    ...current,
                    users: current.users.map((item) =>
                      item.id === id ? staff : item,
                    ),
                  }
                : current,
            );
            flashDeskSuccess(`User is now ${status}.`);
          } catch (error) {
            flashDeskError(
              error instanceof Error ? error.message : "Could not update user.",
            );
          }
        })();
      },
      removeUser: (id, _reason) => {
        const user = stateRef.current?.users.find((item) => item.id === id);
        if (!user) {
          flashDeskError("User not found.");
          return;
        }
        void (async () => {
          try {
            await deskClient.removeOrgUserApi(user.orgId, id);
            setState((current) =>
              current
                ? {
                    ...current,
                    users: current.users.filter((item) => item.id !== id),
                  }
                : current,
            );
            flashDeskSuccess("Member removed from this organisation.");
          } catch (error) {
            flashDeskError(
              error instanceof Error ? error.message : "Could not remove member.",
            );
          }
        })();
      },
      resendUserInvite: (id) => {
        const user = stateRef.current?.users.find((item) => item.id === id);
        if (!user) return;
        flashDeskSuccess("Invitation resent.");
      },
      createOffice: (orgId, input) => {
        const id = `${orgId}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
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
        const org = stateRef.current?.orgs.find((item) => item.id === orgId);
        const nextOffices = [...(org?.offices ?? []), office];
        setState((current) =>
          current
            ? {
                ...current,
                orgs: current.orgs.map((item) =>
                  item.id === orgId ? { ...item, offices: nextOffices } : item,
                ),
              }
            : current,
        );
        deskClient
          .patchOrgApi(orgId, { offices: nextOffices })
          .catch((error) => {
            flashDeskError(
              error instanceof Error ? error.message : "Could not save office.",
            );
            void refreshIdentity();
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
        {
          const org0 = stateRef.current?.orgs.find((item) => item.id === orgId);
          const nextOffices = (org0?.offices ?? []).map((office) =>
            office.id === officeId
              ? {
                  ...office,
                  ...input,
                  name: input.name.trim(),
                  email: input.email.trim().toLowerCase(),
                }
              : office,
          );
          deskClient
            .patchOrgApi(orgId, { offices: nextOffices })
            .catch((error) => {
              flashDeskError(
                error instanceof Error ? error.message : "Could not save office.",
              );
              void refreshIdentity();
            });
        }
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
        {
          const org0 = stateRef.current?.orgs.find((item) => item.id === orgId);
          const nextOffices = (org0?.offices ?? []).map((office) =>
            office.id === officeId
              ? {
                  ...office,
                  status,
                  notes: reason.trim()
                    ? `${office.notes}\n${reason.trim()}`.trim()
                    : office.notes,
                }
              : office,
          );
          deskClient
            .patchOrgApi(orgId, { offices: nextOffices })
            .catch((error) => {
              flashDeskError(
                error instanceof Error ? error.message : "Could not update office.",
              );
              void refreshIdentity();
            });
        }
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
          const org0 = stateRef.current?.orgs.find((item) => item.id === orgId);
          const nextOffices = (org0?.offices ?? []).filter(
            (office) => office.id !== officeId,
          );
          deskClient
            .patchOrgApi(orgId, { offices: nextOffices })
            .catch((error) => {
              flashDeskError(
                error instanceof Error ? error.message : "Could not remove office.",
              );
              void refreshIdentity();
            });
          flashDeskSuccess("Office removed.");
        }
      },
      requestOrg: async (input) => {
        try {
          const request = await orgRequestsClient.submitOrgRequestApi({
            company: input.company.trim(),
            contact: input.contact.trim(),
            email: input.email.trim(),
            phone: input.phone.trim(),
            country: input.country.trim(),
            branch: input.branch.trim(),
            about: input.about.trim(),
            memberYears: input.memberYears,
            memberCount: input.memberCount,
            minProperties: input.minProperties,
          });
          setState((current) =>
            current
              ? { ...current, requests: [request, ...current.requests] }
              : current,
          );
          flashDeskSuccess(
            `${request.company} is requested. A platform admin will set it up.`,
          );
        } catch (error) {
          flashDeskError(
            error instanceof Error
              ? error.message
              : "Could not submit this request.",
          );
          throw error;
        }
      },
      decideRequest: async (id, status) => {
        const request = stateRef.current?.requests.find((item) => item.id === id);
        try {
          const result = await orgRequestsClient.decideOrgRequestApi(id, status);
          setState((current) => {
            if (!current) return current;
            const requests = current.requests.map((item) =>
              item.id === id ? result.request : item,
            );
            if (status === "Declined") {
              const message = `${result.request.company} was declined. No organisation was created.`;
              return withAudit(
                { ...current, requests },
                `Declined organisation request ${result.request.company}`,
                result.request.company,
                message,
              );
            }
            return withAudit(
              { ...current, requests },
              `Approved organisation ${result.request.company}`,
              result.request.company,
              "",
            );
          });
          if (status === "Declined") {
            flashDeskSuccess(
              `${result.request.company} was declined. No organisation was created.`,
            );
          } else {
            await refreshIdentity();
            flashDeskSuccess(
              `${result.request.company} is in Setup. ${result.request.email} activates by entering their email on the org-admin sign-in page to set a password.`,
            );
          }
        } catch (error) {
          flashDeskError(
            error instanceof Error ? error.message : "Could not update request.",
          );
        }
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
            "Migration",
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
        flashDeskSuccess("Document uploaded.");
      },
      reportIssue: (category, detail) => {
        const ref = `MT-${Date.now().toString().slice(-6)}`;
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            jobs: [
              {
                id: `j-${Date.now()}`,
                title: category,
                address: detail.trim() || "—",
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
        flashDeskSuccess(`Issue submitted. Reference ${ref}.`);
      },
    }),
    [],
  );

  const deskState = state ?? createSeed();

  return (
    <DeskContext.Provider value={{ state: deskState, api, viewer }}>
      {children}
      {bootStep !== null ? (
        <DeskBootFloating
          step={bootStep}
          failed={Boolean(bootError)}
          onRetry={() => setBootTry((n) => n + 1)}
        />
      ) : null}
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
