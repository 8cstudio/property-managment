/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-application-stay-pure",
      severity: "error",
      comment:
        "Domain and application cannot import infrastructure, Next.js, or provider SDKs.",
      from: { path: "(^|/)(domain|application)/" },
      to: {
        path: "(^|/)infrastructure/|node_modules/(next|drizzle-orm|drizzle-kit|better-auth|postgres|pg-boss|@sentry)/",
      },
    },
    {
      name: "no-cross-module-internals",
      severity: "error",
      comment:
        "A module may import another module only through its package root or ./contracts.",
      from: { path: "^packages/modules/([^/]+)/" },
      to: {
        path: "^packages/modules/[^/]+/src/(domain|application|infrastructure)/",
        pathNot: "^packages/modules/$1/",
      },
    },
    {
      name: "app-routes-stay-thin",
      severity: "error",
      comment:
        "Delivery routes cannot import repositories, Drizzle, or module infrastructure.",
      from: { path: "^apps/[^/]+/src/app/" },
      to: {
        path: "(^|/)infrastructure/|node_modules/(drizzle-orm|postgres)/",
      },
    },
    {
      name: "client-avoids-server-only",
      severity: "error",
      comment: "Client entry points cannot import server-only module roots.",
      from: { path: "\\.client\\.(ts|tsx)$" },
      to: { path: "node_modules/server-only" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["types", "import", "default"],
    },
  },
};
