# Ezzi

Ezzi is a multi-tenant property-management workspace. Staff, landlords, tenants, and contractors share one property record. Each person only sees the part their role is allowed to see.

The screen you can use today is the console at [http://localhost:3000](http://localhost:3000). It is a working front end with sample records stored in the browser. Sign-in, organisation requests, and office lists change on the page. They are not saved in a database yet.

## What you need

- Node.js 24 or newer
- pnpm 12

Check both:

```powershell
node -v
pnpm -v
```

If `pnpm` is missing:

```powershell
npm install -g pnpm@12.6.0
```

PostgreSQL is for the later database work. The console screens do not need it.

## Install and run

From this folder:

```powershell
pnpm install
pnpm --filter @ezzi/console dev
```

Open [http://localhost:3000](http://localhost:3000). Every role — staff, landlord, tenant, contractor, and visitor — uses this app.

`pnpm dev` starts the console and the background worker through Turbo. If port 3000 is already in use, stop the other Next.js process before starting a second one.

## First page

The home page is a set of cards.

| Card | What it opens |
| --- | --- |
| Visitor | A public page about Ezzi, then a request to register an organisation |
| Super Admin | Sign in, then organisations, requests, users, integrations, modules, audit, reports |
| Organisation Admin | Sign in, or create a password from an invitation. Then offices, staff, and settings for one organisation |
| Operations Manager | Sign in, then today's queue |
| Property Manager | Sign in, then properties and tenancies |
| Lettings Agent | Sign in, then listings, applicants, and viewings |
| Compliance | Sign in, then certificates and expiry |
| Finance | Sign in, then payments, arrears, and statements |
| Migration Admin | Sign in, then an import project |
| Landlord | Sign in or create an account, then their own properties and approvals |
| Tenant | Create an account, enter a 6-digit code, then onboarding, rent, and repairs |
| Contractor | Sign in or create an account, then assigned jobs only |

Staff roles do not have public registration. Super Admin, Operations, Property, Lettings, Compliance, Finance, and Migration only sign in. Organisation Admin, Landlord, Tenant, and Contractor can also create an account.

On a sign-in form, use any real email address and a password of at least 8 characters. The side menu stays in place when you change pages inside a role. **Sign out** is at the bottom of that menu. **Home** in the top bar returns to the role cards.

The round icon beside Home switches light and dark. The choice is kept in the browser.

## Visitor and organisations

A visitor cannot create a live organisation. They send a request with the company name, their name, email, and the first office.

Super Admin opens **Requests** and chooses **Approve and create**. That creates the organisation, keeps that office as the first one, and invites the email as organisation admin. **Decline** leaves no organisation.

Super Admin can also create an organisation directly. The form asks for the company, the first office, and the admin email. A company name that already exists is refused. The admin field must be an email address.

## Offices

An office is a branch. The number you see is how many office names that organisation has.

Northbridge starts with Peckham, Deptford, and Greenwich, so the count is 3. Harbour starts with Deptford, so the count is 1.

- Super Admin names the first office when the organisation is created or when a visitor request is approved.
- Organisation Admin adds later offices from **Offices**.
- Adding an office updates the list for every role, because they share one sample desk in the browser.

Refresh the page if an older session still shows a bare number instead of the office names.

## What each role can do

These buttons change the sample data in the browser.

- **Super Admin** can suspend an organisation when a reason is entered. Records stay. Modules can be turned off without deleting data. A failed integration can be tested again.
- **Organisation Admin** invites a person by name and email, adds offices, and saves the certificate reminder window. They cannot grant Super Admin.
- **Operations** opens a queue item, assigns it, or resolves it.
- **Property Manager** changes a property status with a reason and ticks move-out checks.
- **Lettings** publishes a listing, records a viewing outcome, and selects an applicant.
- **Compliance** validates evidence or renews a certificate. The previous expiry stays on the record.
- **Finance** matches a payment, saves an arrears plan, or publishes a statement.
- **Migration** moves an import through mapping, duplicates, dry run, and cutover. Dry run does not write production data.
- **Landlord** approves or rejects a quote and opens statements.
- **Tenant** submits a checklist step and reports a repair.
- **Contractor** accepts a job, declines it with a reason, marks it complete, or sends an extra quote.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm --filter @ezzi/console dev` | Web app on port 3000 (all roles) |
| `pnpm dev` | Console plus background worker |
| `pnpm check` | Format check and TypeScript |
| `pnpm lint` | Biome check |
| `pnpm boundaries` | Dependency-direction check |
| `pnpm gen:module` | Scaffold a module from the organisations slice |

## Repository

- `apps/console` — all role and visitor screens on port 3000
- `apps/worker` — background jobs (no browser URL; runs when the product uses a database)
- `packages/modules` — one package per business area
- `packages/platform` — database, auth, storage, queue, and other ports
- `packages/shared-kernel` — shared result, id, and money types
- `docs` — architecture notes and the module guide
- `.cursor/rules` — rules for coding agents in this repo

Copy `.env.example` to `.env` when database work starts. Do not commit `.env`.

## Not built yet

Accounts are not checked against a real user store. There is no PostgreSQL schema, migration, or seed script in use by the console. The sample desk resets only when that browser storage is cleared. The product database, permissions, audit log, and worker are still to be built behind these screens.
