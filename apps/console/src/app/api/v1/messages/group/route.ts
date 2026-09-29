import { ok, readJson, requireViewer, route } from "@/server/http";
import { createGroup } from "@/server/messages";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  const viewer = await requireViewer();
  const body = await readJson(req);
  const emails = Array.isArray(body.emails)
    ? body.emails.map((e) => String(e))
    : [];
  const conversation = await createGroup(
    viewer.user.email,
    String(body.title ?? ""),
    emails,
  );
  return ok({ conversation }, 201);
});
