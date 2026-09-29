import { ok, readJson, requireViewer, route } from "@/server/http";
import { getDeskCollections, saveDeskCollections } from "@/server/repo";
import type { DeskCollections } from "@/server/types";

export const runtime = "nodejs";

// Shared demo desk data (properties, work, listings, jobs, finance, migration,
// documents, integrations, audit, requests). Any signed-in user may read/write.
export const GET = route(async () => {
  await requireViewer();
  const collections = await getDeskCollections();
  return ok({ collections });
});

export const PUT = route(async (req) => {
  await requireViewer();
  const body = await readJson<{ collections?: DeskCollections }>(req);
  if (!body.collections || typeof body.collections !== "object") {
    const collections = await getDeskCollections();
    return ok({ collections });
  }
  const collections = await saveDeskCollections(body.collections);
  return ok({ collections });
});
