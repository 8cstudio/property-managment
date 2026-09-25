import { findModule } from "@/features/flows/catalog";
import { ModuleView } from "@/features/flows/module-view";
import { AppBar } from "@/shell/app-bar";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const module = findModule(id);

  if (!module) {
    return (
      <>
        <AppBar section="MODULE" />
        <main className="page">
          <h1>That module is not on this page</h1>
          <a className="refresh" href="/">
            Back home
          </a>
        </main>
      </>
    );
  }

  return <ModuleView module={module} />;
}
