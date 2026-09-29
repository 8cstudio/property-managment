import { ok, requireViewer, route } from "@/server/http";
import { listPeople } from "@/server/messages";

export const runtime = "nodejs";

export const GET = route(async () => {
  const viewer = await requireViewer();
  const people = await listPeople(viewer.user.email);
  return ok({ people });
});
