import Link from "next/link";
import QuoteAccessShell from "../_components/QuoteAccessShell";

const dosageForms = [
  {
    name: "Gummies",
    href: "/quote/gummies",
    description: "Structured gummy manufacturing quote request.",
  },
  {
    name: "Capsules",
    href: "/quote/capsules",
    description: "Capsule manufacturing module coming soon.",
  },
  {
    name: "Tablets",
    href: "/quote/tablets",
    description: "Tablet manufacturing module coming soon.",
  },
  {
    name: "Powders",
    href: "/quote/powders",
    description: "Powder manufacturing module coming soon.",
  },
  {
    name: "Sachets",
    href: "/quote/sachets",
    description: "Sachet manufacturing module coming soon.",
  },
  {
    name: "Liquids",
    href: "/quote/liquids",
    description: "Liquid manufacturing module coming soon.",
  },
  {
    name: "Softgels",
    href: "/quote/softgels",
    description: "Softgel manufacturing module coming soon.",
  },
  {
    name: "Tincture",
    href: "/quote/tincture",
    description: "Structured tincture manufacturing quote request.",
  },
];

export default function NewQuotePage() {
  return (
    <QuoteAccessShell
      eyebrow="Verified Quote System"
      title="Select a dosage form"
      description="Choose the manufacturing format for this quote request. Each module captures dosage-specific details for Gummynology review."
    >
      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dosageForms.map((dosageForm) => (
            <Link
              key={dosageForm.name}
              href={dosageForm.href}
              className="group flex min-h-52 flex-col justify-between border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-emerald-800 hover:shadow-md"
            >
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
                  Dosage Form
                </p>
                <h2 className="mt-4 text-2xl font-semibold text-zinc-950">
                  {dosageForm.name}
                </h2>
                <p className="mt-4 text-sm leading-6 text-zinc-600">
                  {dosageForm.description}
                </p>
              </div>
              <span className="mt-8 inline-flex min-h-11 items-center justify-center rounded-sm bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-emerald-800">
                Start Module
              </span>
            </Link>
          ))}
        </div>
      </section>
    </QuoteAccessShell>
  );
}
