export default function Loading() {
  return (
    <main className="page" aria-busy="true" aria-live="polite">
      <p className="kicker">Loading the queue</p>
      <div className="shimmer lg" />
      <ul className="counts" style={{ marginTop: "1rem" }}>
        {["a", "b", "c", "d", "e"].map((item) => (
          <li key={item} className="count">
            <div className="shimmer num" />
            <div className="shimmer" />
          </li>
        ))}
      </ul>
    </main>
  );
}
