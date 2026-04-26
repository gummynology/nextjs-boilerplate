import Link from "next/link";
import QuoteAccessShell from "./QuoteAccessShell";

type ComingSoonQuotePageProps = {
  dosageForm: string;
};

export default function ComingSoonQuotePage({
  dosageForm,
}: ComingSoonQuotePageProps) {
  return (
    <QuoteAccessShell
      eyebrow="Quote Module"
      title={`${dosageForm} quote module`}
      description="This quote module is coming soon. Please contact our team for manual review."
    >
      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
            Coming Soon
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-zinc-950">
            Manual review is available
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700">
            This quote module is coming soon. Please contact our team for
            manual review.
          </p>
          <Link
            href="/quote/new"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-sm bg-emerald-800 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-900"
          >
            Back to Quote Selection
          </Link>
        </div>
      </section>
    </QuoteAccessShell>
  );
}
