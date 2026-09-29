import { type IdCtx, ok, readJson, requireViewer, route } from "@/server/http";
import { addMessage } from "@/server/messages";

export const runtime = "nodejs";

export const POST = route<IdCtx>(async (req, ctx) => {
  const viewer = await requireViewer();
  const { id } = await ctx.params;
  const body = await readJson(req);
  const message = await addMessage(
    viewer.user.email,
    id,
    String(body.body ?? ""),
  );
  return ok({ message }, 201);
});
