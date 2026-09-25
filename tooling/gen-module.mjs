import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const modules = [
  [
    "iam",
    "foundation",
    "Identities, sessions, invitations, and roles as bundles of permission keys.",
  ],
  [
    "organisations",
    "foundation",
    "Organisations, branches, and portfolios. This is the reference slice.",
  ],
  ["audit", "foundation", "Append-only audit events for important changes."],
  ["parties", "stub", "Contacts and other parties."],
  ["properties", "stub", "Properties and units."],
  ["lettings", "stub", "Listings, applicants, and viewings."],
  ["onboarding", "stub", "Move-in onboarding."],
  ["tenancies", "stub", "Tenancy records."],
  ["compliance", "stub", "Compliance obligations and certificate history."],
  ["maintenance", "stub", "Maintenance work orders."],
  ["finance", "stub", "Rent, reconciliation, arrears, and statements."],
  [
    "documents",
    "stub",
    "Document metadata. File bytes go through the storage port.",
  ],
  ["communications", "stub", "Outbound email and SMS records."],
  ["workflow", "stub", "Tasks, exceptions, and the work queue."],
  ["migration", "stub", "Agency import: map, validate, dry-run, and cutover."],
  ["reporting", "stub", "Read models and reports."],
  [
    "integrations",
    "stub",
    "Per-organisation integration connections. Provider calls live in packages/integrations.",
  ],
  [
    "ai-services",
    "stub",
    "Governed AI suggestions. A suggestion is not source of truth.",
  ],
];

const integrations = [
  ["portals", "Property portal provider adapters."],
  ["referencing", "Referencing provider adapters."],
  ["esign", "E-sign provider adapters."],
  ["payments", "Payment provider adapters. Writes must be idempotent."],
  ["open-banking", "Open banking provider adapters."],
  ["legacy-import", "Reapit, Alto, and CSV import adapters."],
];

function modulePackage(name) {
  return {
    name: `@ezzi/${name}`,
    version: "0.0.0",
    private: true,
    type: "module",
    exports: {
      ".": "./src/index.ts",
      "./contracts": "./src/contracts/index.ts",
    },
    dependencies: {
      "@ezzi/shared-kernel": "workspace:*",
      "server-only": "catalog:",
    },
    devDependencies: {
      typescript: "catalog:",
    },
    scripts: {
      check: "tsc --noEmit",
    },
  };
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function writeModule(name, kind, summary) {
  const dir = path.join(root, "packages", "modules", name);
  if (await exists(path.join(dir, "package.json"))) {
    console.log(`skip ${name}: already exists`);
    return;
  }
  await mkdir(path.join(dir, "src", "domain"), { recursive: true });
  await mkdir(path.join(dir, "src", "application"), { recursive: true });
  await mkdir(path.join(dir, "src", "infrastructure"), { recursive: true });
  await mkdir(path.join(dir, "src", "contracts"), { recursive: true });

  const files = {
    "package.json": `${JSON.stringify(modulePackage(name), null, 2)}\n`,
    "tsconfig.json": `${JSON.stringify(
      {
        extends: "../../config/tsconfig/base.json",
        compilerOptions: { rootDir: "src" },
        include: ["src"],
      },
      null,
      2,
    )}\n`,
    "README.md": `# ${name}\n\n${summary}\n\nStatus: ${kind}. No business rules in this scaffold.\n`,
    "src/permissions.ts":
      "/** Permission keys owned by this module. Add keys when the module is implemented. */\nexport const permissions = {} as const;\n",
    "src/events.ts":
      "export const publishedEvents = [] as const;\nexport const subscribedEvents = [] as const;\n",
    "src/module.ts": `import type { ModuleManifest } from "@ezzi/shared-kernel";\nimport { publishedEvents, subscribedEvents } from "./events";\nimport { permissions } from "./permissions";\n\nexport const manifest = {\n  id: "${name}",\n  permissions: Object.values(permissions),\n  nav: [],\n  routes: [],\n  jobs: [],\n  publishes: publishedEvents,\n  subscribesTo: subscribedEvents,\n} satisfies ModuleManifest;\n`,
    "src/index.ts":
      'import "server-only";\n\nexport { publishedEvents, subscribedEvents } from "./events";\nexport { manifest } from "./module";\nexport { permissions } from "./permissions";\n',
    "src/contracts/index.ts":
      "/** Client-safe schemas and enums. Do not import server-only code here. */\nexport {};\n",
    "src/domain/.gitkeep": "",
    "src/application/.gitkeep": "",
    "src/infrastructure/.gitkeep": "",
  };

  await Promise.all(
    Object.entries(files).map(([file, contents]) =>
      writeFile(path.join(dir, file), contents),
    ),
  );
}

async function writeIntegration(name, summary) {
  const dir = path.join(root, "packages", "integrations", name);
  if (await exists(path.join(dir, "package.json"))) {
    console.log(`skip adapter ${name}: already exists`);
    return;
  }
  await mkdir(path.join(dir, "src"), { recursive: true });
  const pkg = {
    name: `@ezzi/adapter-${name}`,
    version: "0.0.0",
    private: true,
    type: "module",
    exports: { ".": "./src/index.ts" },
    devDependencies: { typescript: "catalog:" },
    scripts: { check: "tsc --noEmit" },
  };
  await writeFile(
    path.join(dir, "package.json"),
    `${JSON.stringify(pkg, null, 2)}\n`,
  );
  await writeFile(
    path.join(dir, "tsconfig.json"),
    `${JSON.stringify(
      {
        extends: "../../config/tsconfig/base.json",
        compilerOptions: { rootDir: "src" },
        include: ["src"],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(dir, "README.md"),
    `# ${name}\n\n${summary}\n\nStatus: stub. No provider calls.\n`,
  );
  await writeFile(
    path.join(dir, "src", "index.ts"),
    "/** Provider adapter stub. Implement the module port here. */\nexport {};\n",
  );
}

const name = process.argv[2];
if (!name || name === "--help") {
  console.log("Usage: node tooling/gen-module.mjs <name> | --scaffold");
  process.exit(name ? 0 : 1);
}

if (name === "--scaffold") {
  await Promise.all(
    modules.map(([moduleName, kind, summary]) =>
      writeModule(moduleName, kind, summary),
    ),
  );
  await Promise.all(
    integrations.map(([integrationName, summary]) =>
      writeIntegration(integrationName, summary),
    ),
  );
  console.log(
    `Scaffolded ${modules.length} modules and ${integrations.length} integration stubs.`,
  );
} else {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error(
      "Module name must be lowercase letters, numbers, and hyphens.",
    );
    process.exit(1);
  }
  await writeModule(
    name,
    "stub",
    "Describe this module's responsibility in this README before adding code.",
  );
  console.log(
    `Created packages/modules/${name}. Register its manifest before using it.`,
  );
}
