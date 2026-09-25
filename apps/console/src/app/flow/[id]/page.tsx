import { findFlow } from "@/features/flows/catalog";
import { FlowView } from "@/features/flows/flow-view";
import { AppBar } from "@/shell/app-bar";

export default async function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = findFlow(id);

  if (!flow) {
    return (
      <>
        <AppBar section="START" />
        <main className="page">
          <h1>That role is not on this page</h1>
          <a className="refresh" href="/">
            Back home
          </a>
        </main>
      </>
    );
  }

  return <FlowView flow={flow} />;
}
