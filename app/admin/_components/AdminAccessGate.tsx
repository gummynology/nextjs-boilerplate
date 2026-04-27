"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ADMIN_SESSION_KEY } from "@/lib/quoteManagement";

export function AdminAccessGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hasAdminSession =
        window.localStorage.getItem(ADMIN_SESSION_KEY) === "authenticated";

      if (!hasAdminSession) {
        router.replace("/admin-login");
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
            Admin Access
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-950">
            Checking access
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Redirecting to admin login if authentication is required.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

export function AdminPageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AdminAccessGate>
      <main className="min-h-screen bg-[#f7f6f1] text-zinc-950">
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
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
              {actions ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          {children}
        </section>
      </main>
    </AdminAccessGate>
  );
}

export function AdminNavButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex min-h-11 items-center justify-center rounded-sm bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
          : "inline-flex min-h-11 items-center justify-center rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800"
      }
    >
      {children}
    </Link>
  );
}
