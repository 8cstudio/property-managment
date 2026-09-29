import { type IdCtx, ok, readJson, requireViewer, route } from "@/server/http";
import { ackDelivered, markConversationRead } from "@/server/messages";

export const runtime = "nodejs";

export const POST = route<IdCtx>(async (req, ctx) => {
  const viewer = await requireViewer();
  const { id: conversationId } = await ctx.params;
  const body = (await readJson(req)) as {
    deliver?: unknown;
    read?: unknown;
  };

  const updated: Awaited<ReturnType<typeof markConversationRead>> = [];

  if (body.read === true) {
    updated.push(...(await markConversationRead(viewer.user.email, conversationId)));
  }

  const deliverIds = Array.isArray(body.deliver)
    ? body.deliver.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  if (deliverIds.length > 0) {
    updated.push(
      ...(await ackDelivered(viewer.user.email, conversationId, deliverIds)),
    );
  }

  return ok({ messages: updated });
});
