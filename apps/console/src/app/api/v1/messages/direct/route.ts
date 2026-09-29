import { ok, readJson, requireViewer, route } from "@/server/http";
import { getOrCreateDirect } from "@/server/messages";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  const viewer = await requireViewer();
  const body = await readJson(req);
  const conversation = await getOrCreateDirect(
    viewer.user.email,
    String(body.email ?? ""),
  );
  return ok({ conversation }, 201);
});
