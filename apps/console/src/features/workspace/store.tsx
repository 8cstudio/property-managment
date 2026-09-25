"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createSeed, type DeskState } from "./data";

type DeskApi = {
  createOrg: (input: { name: string; branch: string; admin: string }) => void;
  setOrgStatus: (
    id: string,
    status: DeskState["orgs"][number]["status"],
    reason: string,
  ) => void;
  toggleModule: (orgId: string, name: string) => void;
  inviteUser: (input: {
    name: string;
    email: string;
    role: string;
    scope: string;
  }) => void;
  addBranch: (orgId: string, name: string) => void;
  requestOrg: (input: {
    company: string;
    contact: string;
    email: string;
    branch: string;
  }) => void;
  decideRequest: (id: string, status: "Approved" | "Declined") => void;
  saveSettings: (days: string) => void;
  testIntegration: (id: string) => void;
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
  decideJob: (id: string, status: string) => void;
  acceptJob: (id: string) => void;
  declineJob: (id: string, reason: string) => void;
  completeJob: (id: string, notes: string) => void;
  quoteJob: (id: string, amount: string) => void;
  submitStep: (id: string) => void;
  reportIssue: (category: string, detail: string) => void;
  clearNotice: () => void;
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
  notice: string,
): DeskState {
  return {
    ...state,
    notice,
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
        parsed.orgs = parsed.orgs.map((org) => {
          if (!seen.has(org.id)) {
            seen.add(org.id);
            return org;
          }
          const id = `org-${globalThis.crypto.randomUUID()}`;
          seen.add(id);
          return { ...org, id };
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
    sessionStorage.setItem("ezzi-desk", JSON.stringify(state));
  }, [role, state]);

  const api = useMemo<DeskApi>(
    () => ({
      clearNotice: () =>
        setState((current) => (current ? { ...current, notice: "" } : current)),
      createOrg: ({ name, branch, admin }) =>
        setState((current) => {
          if (!current) return current;
          const company = name.trim();
          const taken = current.orgs.some(
            (org) => org.name.trim().toLowerCase() === company.toLowerCase(),
          );
          if (taken) {
            return {
              ...current,
              notice: "An organisation with this name already exists.",
            };
          }
          const id = `org-${globalThis.crypto.randomUUID()}`;
          return withAudit(
            {
              ...current,
              orgs: [
                ...current.orgs,
                {
                  id,
                  name: company,
                  status: "Setup",
                  branches: [branch.trim()],
                  modules: {
                    Properties: true,
                    Lettings: true,
                    Compliance: true,
                    Maintenance: true,
                    Finance: false,
                    Migration: false,
                  },
                  reason: "",
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
                },
              ],
            },
            `Created organisation ${company}`,
            company,
            `${company} is in Setup. Invite sent to ${admin.trim()}.`,
          );
        }),
      setOrgStatus: (id, status, reason) =>
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === id);
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === id ? { ...item, status, reason } : item,
              ),
            },
            `${status} ${org?.name ?? "organisation"}: ${reason}`,
            org?.name ?? "",
            `${org?.name ?? "Organisation"} is now ${status}. Records were kept.`,
          );
        }),
      toggleModule: (orgId, name) =>
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            notice: `${name} access changed. Existing records stay.`,
            orgs: current.orgs.map((org) =>
              org.id === orgId
                ? {
                    ...org,
                    modules: { ...org.modules, [name]: !org.modules[name] },
                  }
                : org,
            ),
          };
        }),
      inviteUser: ({ name, email, role: userRole, scope }) =>
        setState((current) => {
          if (!current) return current;
          const mail = email.trim().toLowerCase();
          const taken = current.users.some(
            (user) => user.email?.toLowerCase() === mail,
          );
          if (taken) {
            return {
              ...current,
              notice: "This email already has an active or invited account.",
            };
          }
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
                  orgId: "northbridge",
                },
              ],
            },
            `Invited ${mail} as ${userRole}`,
            "Northbridge Lettings",
            `Invitation sent to ${mail}.`,
          );
        }),
      addBranch: (orgId, name) =>
        setState((current) => {
          if (!current) return current;
          const org = current.orgs.find((item) => item.id === orgId);
          return withAudit(
            {
              ...current,
              orgs: current.orgs.map((item) =>
                item.id === orgId
                  ? { ...item, branches: [...item.branches, name] }
                  : item,
              ),
            },
            `Added office ${name}`,
            org?.name ?? "",
            `${name} is now an office of ${org?.name ?? "the organisation"}.`,
          );
        }),
      requestOrg: ({ company, contact, email, branch }) =>
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            notice: `${company} is requested. A platform admin will set it up.`,
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
        }),
      decideRequest: (id, status) =>
        setState((current) => {
          if (!current) return current;
          const request = current.requests.find((item) => item.id === id);
          if (request?.status !== "Requested") return current;
          const requests = current.requests.map((item) =>
            item.id === id ? { ...item, status } : item,
          );
          if (status === "Declined") {
            return withAudit(
              { ...current, requests },
              `Declined organisation request ${request.company}`,
              request.company,
              `${request.company} was declined. No organisation was created.`,
            );
          }
          const orgId = `org-${globalThis.crypto.randomUUID()}`;
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
                  branches: [request.branch],
                  modules: {
                    Properties: true,
                    Lettings: true,
                    Compliance: true,
                    Maintenance: true,
                    Finance: false,
                    Migration: false,
                  },
                  reason: "",
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
                },
              ],
            },
            `Approved organisation ${request.company}`,
            request.company,
            `${request.company} is in Setup with ${request.branch} as its first office. Invite sent to ${request.email}.`,
          );
        }),
      saveSettings: (days) =>
        setState((current) =>
          current
            ? {
                ...current,
                reminderDays: days,
                notice: "Reminder window saved.",
              }
            : current,
        ),
      testIntegration: (id) =>
        setState((current) => {
          if (!current) return current;
          const item = current.integrations.find((row) => row.id === id);
          return {
            ...current,
            notice: `${item?.name ?? "Connection"} responded. Status is Connected.`,
            integrations: current.integrations.map((row) =>
              row.id === id ? { ...row, status: "Connected" } : row,
            ),
          };
        }),
      assignWork: (id, owner) =>
        setState((current) => {
          if (!current) return current;
          return {
            ...current,
            notice: `Assigned to ${owner}.`,
            work: current.work.map((item) =>
              item.id === id ? { ...item, owner, state: "Open" } : item,
            ),
          };
        }),
      resolveWork: (id) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Marked resolved.",
                work: current.work.map((item) =>
                  item.id === id ? { ...item, state: "Resolved" } : item,
                ),
              }
            : current,
        ),
      setPropertyStatus: (id, status, reason) =>
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
            `Status is ${status}.`,
          );
        }),
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
      publishListing: (id) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Sent to the portal. Channel status is Published.",
                listings: current.listings.map((item) =>
                  item.id === id ? { ...item, status: "Published" } : item,
                ),
              }
            : current,
        ),
      setViewingOutcome: (id, outcome) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: `Viewing marked ${outcome}.`,
                viewings: current.viewings.map((item) =>
                  item.id === id ? { ...item, outcome } : item,
                ),
              }
            : current,
        ),
      acceptApplicant: (id) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice:
                  "Applicant selected. Onboarding can start without retyping.",
                applicants: current.applicants.map((item) =>
                  item.id === id ? { ...item, stage: "Selected" } : item,
                ),
              }
            : current,
        ),
      validateCert: (id) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Evidence checked. Status is Compliant.",
                certificates: current.certificates.map((item) =>
                  item.id === id ? { ...item, status: "Compliant" } : item,
                ),
              }
            : current,
        ),
      renewCert: (id, expiry) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice:
                  "New expiry saved. The previous certificate is still in history.",
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
              }
            : current,
        ),
      matchPayment: (id) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Payment matched to the tenancy.",
                payments: current.payments.map((item) =>
                  item.id === id ? { ...item, status: "Matched" } : item,
                ),
              }
            : current,
        ),
      savePlan: (id, plan) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Payment plan saved. No legal step was taken.",
                arrears: current.arrears.map((item) =>
                  item.id === id ? { ...item, plan } : item,
                ),
              }
            : current,
        ),
      publishStatement: (id) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Statement published for the landlord view.",
                statements: current.statements.map((item) =>
                  item.id === id ? { ...item, status: "Published" } : item,
                ),
              }
            : current,
        ),
      setMigrationStage: (id, stage) =>
        setState((current) => {
          if (!current) return current;
          const note =
            stage === "Live"
              ? "Cutover written. Source id and batch kept on each row."
              : stage === "Dry run"
                ? "Dry run finished. Production was not written."
                : "Staging only. Live records are unchanged.";
          return withAudit(
            {
              ...current,
              migrations: current.migrations.map((item) =>
                item.id === id ? { ...item, stage, note } : item,
              ),
            },
            `Migration moved to ${stage}`,
            "Northbridge Lettings",
            note,
          );
        }),
      decideJob: (id, status) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: `Quote ${status.toLowerCase()}.`,
                jobs: current.jobs.map((item) =>
                  item.id === id ? { ...item, status } : item,
                ),
              }
            : current,
        ),
      acceptJob: (id) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Job accepted.",
                jobs: current.jobs.map((item) =>
                  item.id === id ? { ...item, status: "Scheduled" } : item,
                ),
              }
            : current,
        ),
      declineJob: (id, reason) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Declined. Operations can reassign it.",
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
              }
            : current,
        ),
      completeJob: (id, notes) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Marked complete. Waiting on operations review.",
                jobs: current.jobs.map((item) =>
                  item.id === id
                    ? { ...item, status: "Complete", notes }
                    : item,
                ),
              }
            : current,
        ),
      quoteJob: (id, amount) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Quote sent. Work waits for approval.",
                jobs: current.jobs.map((item) =>
                  item.id === id
                    ? { ...item, quote: amount, status: "Waiting approval" }
                    : item,
                ),
              }
            : current,
        ),
      submitStep: (id) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Step submitted.",
                onboarding: current.onboarding.map((item) =>
                  item.id === id ? { ...item, state: "Complete" } : item,
                ),
              }
            : current,
        ),
      reportIssue: (category, detail) =>
        setState((current) =>
          current
            ? {
                ...current,
                notice: "Issue submitted. Reference MT-2041.",
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
              }
            : current,
        ),
    }),
    [],
  );

  if (!state) {
    return (
      <div className="work" aria-busy="true">
        <p className="kicker">Opening the desk</p>
        <div className="shimmer lg" />
      </div>
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
