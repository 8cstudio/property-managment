import type { ModuleManifest } from "@ezzi/shared-kernel";
import { publishedEvents, subscribedEvents } from "./events";
import { permissions } from "./permissions";

export const manifest = {
  id: "integrations",
  permissions: Object.values(permissions),
  nav: [],
  routes: [],
  jobs: [],
  publishes: publishedEvents,
  subscribesTo: subscribedEvents,
} satisfies ModuleManifest;
