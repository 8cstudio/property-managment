import Link from "next/link";
import { roleCards } from "@/features/workspace/roles";
import { AppBar } from "@/shell/app-bar";

export function Gate() {
  return (
    <>
      <AppBar />
      <main className="page">
        <h1>Choose a role</h1>
        <ul className="pick-grid">
          <li>
            <Link className="pick" href="/visit">
              <strong>Visitor</strong>
              <span>See Ezzi and register an organisation</span>
            </Link>
          </li>
          {roleCards.map((role) => (
            <li key={role.id}>
              <Link className="pick" href={`/role/${role.id}/sign-in`}>
                <strong>{role.name}</strong>
                <span>{role.line}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
