const productTypes = [
  "Gummies",
  "Capsules",
  "Tablets",
  "Powders",
  "Sachets",
  "Liquids",
  "Softgels",
];

const whyGummynology = [
  "U.S.-based supplement manufacturer",
  "OEM formulation and production experience",
  "Familiar with U.S. supplement market expectations",
  "Controlled access quote system",
  "Future production tracking and document access",
];

const steps = [
  "Request access",
  "Company review",
  "Receive access code",
  "Build your product",
  "Submit for final quote",
];

const trustItems = [
  "GMP-oriented manufacturing workflow",
  "Ingredient review",
  "Label and Supplement Facts support",
  "COA and documentation support",
  "Production record traceability planned",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f6f1] text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <nav className="flex items-center justify-between gap-4">
            <a
              href="https://www.gummynology.com"
              className="text-base font-semibold tracking-[0.18em] text-zinc-950 uppercase"
            >
              Gummynology
            </a>
            <a
              href="/request-access"
              className="hidden rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800 sm:inline-flex"
            >
              Request Access
            </a>
          </nav>

          <div className="grid gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-16">
            <div className="max-w-3xl">
              <p className="mb-5 text-sm font-semibold tracking-[0.22em] text-emerald-800 uppercase">
                Verified supplement manufacturing quotes
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl">
                Instant Supplement Manufacturing Quote
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700 sm:text-xl">
                A verified B2B portal for supplement brands to request OEM
                manufacturing quotes, starting with gummies and expanding to
                capsules, tablets, powders, sachets, liquids, and softgels.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/request-access"
                  className="inline-flex min-h-12 items-center justify-center rounded-sm bg-emerald-800 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-900"
                >
                  Request Access
                </a>
                <a
                  href="/quote/new"
                  className="inline-flex min-h-12 items-center justify-center rounded-sm border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-900 transition hover:border-emerald-700 hover:text-emerald-800"
                >
                  Get Instant Estimate
                </a>
              </div>
            </div>

            <div className="border border-zinc-200 bg-[#fbfaf7] p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="border-b border-zinc-200 pb-5">
                <p className="text-sm font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                  Quote readiness
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-zinc-950">
                  Built for verified brand teams and manufacturing review.
                </h2>
              </div>
              <dl className="grid grid-cols-2 gap-px overflow-hidden border border-zinc-200 bg-zinc-200">
                {[
                  ["Access", "Approved only"],
                  ["Initial format", "Gummies"],
                  ["Workflow", "OEM quote"],
                  ["Expansion", "7 formats"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white p-4">
                    <dt className="text-xs font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                      {label}
                    </dt>
                    <dd className="mt-2 text-lg font-semibold text-zinc-950">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
              Verified Access Only
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
              Qualification before quote entry
            </h2>
          </div>
          <p className="text-lg leading-8 text-zinc-700">
            Customers must register, verify their business information, and be
            approved before entering the quote system. This controlled process
            keeps pricing requests focused on qualified supplement brands and
            gives Gummynology the context needed for reliable OEM review.
          </p>
        </div>
      </section>

      <section className="bg-white py-12 lg:py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
              Product Types
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
              Quote paths for current and future dosage formats
            </h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {productTypes.map((product) => (
              <article
                key={product}
                className="border border-zinc-200 bg-[#fbfaf7] p-5"
              >
                <h3 className="text-xl font-semibold text-zinc-950">
                  {product}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-16">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
            Why Gummynology
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
            Manufacturing expertise with controlled quote access
          </h2>
          <ul className="mt-8 space-y-4">
            {whyGummynology.map((item) => (
              <li key={item} className="flex gap-3 text-base text-zinc-700">
                <span className="mt-2 h-2 w-2 shrink-0 bg-emerald-800" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-zinc-200 bg-white p-5 sm:p-6 lg:p-8">
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
            How It Works
          </p>
          <ol className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <li
                key={step}
                className="grid grid-cols-[2.75rem_1fr] items-center gap-4 border-b border-zinc-200 pb-4 last:border-b-0 last:pb-0"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-zinc-950 text-sm font-semibold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-lg font-semibold text-zinc-950">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-[#10251d] py-12 text-white lg:py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-emerald-200 uppercase">
              Compliance & Trust
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Quote preparation aligned with supplement manufacturing review
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item} className="border border-white/15 bg-white/5 p-4">
                <p className="text-base leading-7 text-zinc-100">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-zinc-600 sm:px-8 lg:px-10">
          <p className="font-semibold text-zinc-950">Gummynology LLC</p>
          <p>14201 Myerlake Cir, Clearwater, FL 33760</p>
          <a
            href="https://www.gummynology.com"
            className="font-semibold text-emerald-800 hover:text-emerald-900"
          >
            www.gummynology.com
          </a>
        </div>
      </footer>
    </main>
  );
}
