import Link from "next/link";

const board = [
  { tag: "overdue", label: "Overdue", title: "Gas safety ended", place: "14 Rye Lane, Flat 2" },
  { tag: "today", label: "Today", title: "Viewing at 4:30", place: "41 Larkhall Lane" },
  { tag: "open", label: "Open", title: "£1,250 unmatched", place: "Reference NB-4419" },
];

const people = [
  {
    title: "The agency",
    copy: "Operations sees the queue. Lettings moves a home from listing to viewing to offer. Compliance keeps the certificate and the one before it. Finance matches rent or leaves it unmatched until a person decides.",
  },
  {
    title: "The landlord",
    copy: "They see their own properties, not the agency’s other clients. A quote waits for approve or reject. Statements appear only after they are ready to show.",
  },
  {
    title: "The tenant and contractor",
    copy: "A tenant follows the same status the office sees, pays rent without internal notes, and reports a repair. A contractor sees assigned jobs only, and a decline needs a reason.",
  },
];

const records = [
  {
    name: "Property",
    copy: "Address, office, and status: Onboarding, Available, Reserved, Occupied, Void, On hold, or Archived. A renewal keeps the history. Move-out checks finish before the home is offered again.",
  },
  {
    name: "Lettings",
    copy: "A listing per portal, the applicant, and the viewing outcome. A person chooses who proceeds. Handover does not mean typing the same details again.",
  },
  {
    name: "Compliance",
    copy: "The requirement, the evidence, and the expiry. Renewing keeps the old certificate on the record. Overdue is a rule, not a guess.",
  },
  {
    name: "Repairs",
    copy: "The tenant reports it. The office assigns it. The landlord approves a quote when the job needs that. The contractor completes the work they were given.",
  },
  {
    name: "Rent",
    copy: "A schedule, a payment that matches, or one that sits in the unmatched queue. An arrears plan is recorded. It does not become a legal step on its own.",
  },
  {
    name: "Offices",
    copy: "The first office is named when the organisation is created. The organisation admin adds the rest. The count you see later is simply how many of those names exist.",
  },
];

const steps = [
  {
    title: "You ask",
    copy: "Company, your name, email, and the first office. That is a request, not a live account.",
  },
  {
    title: "Ezzi sets it up",
    copy: "A platform admin approves it. The organisation opens in Setup and your email is invited.",
  },
  {
    title: "You add the rest",
    copy: "Offices, staff, and the reminder window. Staff sign in. They do not register themselves.",
  },
  {
    title: "The desk starts",
    copy: "The same property is what the office, the landlord, and the tenant are looking at.",
  },
];

export default function VisitPage() {
  return (
    <main className="visit">
      <section className="visit-hero">
        <div>
          <p className="kicker">For letting and management agencies</p>
          <h1>The keys, the certificate, and the rent. One desk.</h1>
          <p className="visit-lead">
            Ezzi keeps the property, the tenancy, the compliance file, the
            repair, and the money on the same record. Staff work the queue.
            Landlords, tenants, and contractors only see the part that is
            theirs.
          </p>
          <div className="visit-actions">
            <Link className="visit-cta" href="/visit/register">
              Register organisation
            </Link>
            <Link className="text-link" href="/">
              Already invited? Choose a role
            </Link>
          </div>
        </div>
        <aside className="visit-board" aria-label="Sample of one morning">
          <p className="kicker">A Tuesday, one office</p>
          <ul>
            {board.map((item) => (
              <li key={item.title}>
                <span className={`tag ${item.tag}`}>{item.label}</span>
                <span>
                  <strong>{item.title}</strong>
                  <span className="place">{item.place}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="hint">Sample only. Your own queue starts after setup.</p>
        </aside>
      </section>

      <section className="visit-facts" aria-label="How the record behaves">
        <p>
          <strong>One status</strong>
          The office and the tenant use the same name for the same state.
        </p>
        <p>
          <strong>Kept</strong>
          A renewal, a certificate, and a move-out stay on the record.
        </p>
        <p>
          <strong>Scoped</strong>
          A landlord never sees another landlord’s homes.
        </p>
        <p>
          <strong>A person decides</strong>
          Matching rent, choosing an applicant, and approving a quote are not
          automatic.
        </p>
      </section>

      <section className="visit-block">
        <h2>Who opens it</h2>
        <div className="visit-people">
          {people.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="visit-block">
        <h2>What is actually stored</h2>
        <ul className="visit-records">
          {records.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong>
              <p>{item.copy}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="visit-block">
        <h2>How an agency joins</h2>
        <ol className="visit-steps">
          {steps.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="visit-close">
        <div>
          <h2>Name the company and the first office.</h2>
          <p>
            Ezzi reviews the request, creates the organisation, and invites you
            as organisation admin. You add the other offices after that.
          </p>
        </div>
        <Link className="visit-cta" href="/visit/register">
          Register organisation
        </Link>
      </section>
    </main>
  );
}
