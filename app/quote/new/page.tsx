"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewQuotePage() {
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hasApprovedAccess =
        window.localStorage.getItem("approved_customer") === "true";

      if (!hasApprovedAccess) {
        router.replace("/activate");
        return;
      }

      setCustomerCompany(
        window.localStorage.getItem("customer_company") || "Approved customer",
      );
      setCustomerEmail(window.localStorage.getItem("customer_email") || "");
      setIsCheckingAccess(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  if (isCheckingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f6f1] px-5 text-zinc-950">
        <div className="w-full max-w-md border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
            Quote Access
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-950">
            Checking access
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Redirecting to activation if quote access is required.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <nav className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-base font-semibold tracking-[0.18em] text-zinc-950 uppercase"
            >
              Gummynology
            </Link>
            <Link
              href="/request-access"
              className="rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800"
            >
              Request Access
            </Link>
          </nav>

          <div className="max-w-4xl py-6 lg:py-8">
            <p className="text-sm font-semibold tracking-[0.22em] text-emerald-800 uppercase">
              Verified Quote System
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl">
              Build your manufacturing estimate
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
              This placeholder confirms activated customers can enter the quote
              system. The product builder will be added in the next phase.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
          <div className="border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold text-zinc-950">
              Quote builder coming next
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-700">
              Gummy quote inputs, formulation assumptions, packaging options,
              and final quote submission will live here.
            </p>
          </div>

          <aside className="border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold tracking-[0.18em] text-zinc-500 uppercase">
              Activated Customer
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-zinc-950">
              {customerCompany}
            </h2>
            {customerEmail ? (
              <p className="mt-3 break-all text-sm font-medium text-emerald-800">
                {customerEmail}
              </p>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
