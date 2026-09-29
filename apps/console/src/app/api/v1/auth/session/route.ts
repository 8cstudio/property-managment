import { ok, route } from "@/server/http";
import { resolveViewer } from "@/server/session";

export const runtime = "nodejs";

export const GET = route(async () => {
  const viewer = await resolveViewer();
  return ok({ viewer });
});
