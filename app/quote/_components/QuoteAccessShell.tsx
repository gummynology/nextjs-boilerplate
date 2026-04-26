
"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

type QuoteAccessShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export type CustomerContext = {
  customerCompany: string;
  customerEmail: string;
};

export const customerContextDefaults: CustomerContext = {
  customerCompany: "",
  customerEmail: "",
};

export function getStoredCustomerContext(): CustomerContext {
  return {
    customerCompany:
      window.localStorage.getItem("customer_company") || "Approved customer",
    customerEmail: window.localStorage.getItem("customer_email") || "",
  };
}

export function hasQuoteAccess() {
  return (
    window.localStorage.getItem("activated_customer") === "true" ||
    window.localStorage.getItem("approved_customer") === "true"
  );
}

export default function QuoteAccessShell({
  eyebrow,
  title,
  description,
  children,
}: QuoteAccessShellProps) {
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasQuoteAccess()) {
        router.replace("/activate");
        return;
      }

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
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold tracking-[0.22em] text-emerald-800 uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
              {description}
            </p>
          </div>
        </div>
      </section>

      {children}
    </main>
  );
}
