import { ok, requireViewer, route } from "@/server/http";
import { listConversations } from "@/server/messages";

export const runtime = "nodejs";

export const GET = route(async () => {
  const viewer = await requireViewer();
  const conversations = await listConversations(viewer.user.email);
  return ok({ conversations });
});
