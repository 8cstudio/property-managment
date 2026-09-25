import { PageMain, Shimmer } from "@ezzi/ui";

export default function Loading() {
  return (
    <PageMain aria-busy="true" aria-live="polite">
      <p className="kicker">Loading the queue</p>
      <Shimmer size="lg" />
      <ul className="counts" style={{ marginTop: "1rem" }}>
        {["a", "b", "c", "d", "e"].map((item) => (
          <li key={item} className="count">
            <Shimmer />
            <Shimmer />
          </li>
        ))}
      </ul>
    </PageMain>
  );
}
