import type { ModuleManifest } from "@ezzi/shared-kernel";
import { publishedEvents, subscribedEvents } from "./events";
import { permissions } from "./permissions";

export const manifest = {
  id: "communications",
  permissions: Object.values(permissions),
  nav: [],
  routes: [],
  jobs: [],
  publishes: publishedEvents,
  subscribesTo: subscribedEvents,
} satisfies ModuleManifest;
