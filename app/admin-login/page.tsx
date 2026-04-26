"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "GummyAdmin2026!";
const ADMIN_SESSION_KEY = "gummynology_admin_session";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== ADMIN_PASSWORD) {
      setErrorMessage("Incorrect password. Please try again.");
      return;
    }

    window.localStorage.setItem(ADMIN_SESSION_KEY, "authenticated");
    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f1] px-5 py-12 text-zinc-950">
      <section className="w-full max-w-md border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.18em] text-zinc-950 uppercase"
        >
          Gummynology
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-emerald-800 uppercase">
            Admin Access
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-zinc-950">
            Sign in to review requests
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            Enter the temporary admin password to access the internal request
            review dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="admin-password"
              className="text-sm font-semibold text-zinc-800"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 min-h-12 w-full rounded-sm border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage ? (
            <div className="border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">
                {errorMessage}
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-emerald-800 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-900"
          >
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
