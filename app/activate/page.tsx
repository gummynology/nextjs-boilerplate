"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

type ActivationState = "loading" | "success" | "error";

type ApprovedRequest = {
  id: string;
  business_email: string;
  company_name: string;
};

export default function ActivatePage() {
  const [activationState, setActivationState] =
    useState<ActivationState>("loading");
  const [message, setMessage] = useState("Verifying activation link...");

  useEffect(() => {
    async function activateCustomer() {
      const token = new URLSearchParams(window.location.search).get("token");

      if (!token) {
        setActivationState("error");
        setMessage(
          "Activation token is missing. Please use the activation link provided by Gummynology.",
        );
        return;
      }

      const supabase = getSupabaseClient();

      if (!supabase) {
        setActivationState("error");
        setMessage(
          "Supabase is not configured. Please contact Gummynology support.",
        );
        return;
      }

      const { data, error } = await supabase
        .from("access_requests")
        .select("id, business_email, company_name")
        .eq("activation_token", token)
        .eq("status", "approved")
        .maybeSingle();

      if (error || !data) {
        setActivationState("error");
        setMessage(
          "This activation link is invalid or has not been approved.",
        );
        return;
      }

      const approvedRequest = data as ApprovedRequest;
      const { error: updateError } = await supabase
        .from("access_requests")
        .update({
          activated: true,
          activated_at: new Date().toISOString(),
        })
        .eq("id", approvedRequest.id);

      if (updateError) {
        setActivationState("error");
        setMessage(
          updateError.message ||
            "Unable to activate this account. Please try again.",
        );
        return;
      }

      window.localStorage.setItem("approved_customer", "true");
      window.localStorage.setItem(
        "customer_email",
        approvedRequest.business_email,
      );
      window.localStorage.setItem(
        "customer_company",
        approvedRequest.company_name,
      );

      setActivationState("success");
      setMessage(
        "Your access has been activated. You can continue to the quote system.",
      );
    }

    activateCustomer();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f1] px-5 py-12 text-zinc-950">
      <section className="w-full max-w-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.18em] text-zinc-950 uppercase"
        >
          Gummynology
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-emerald-800 uppercase">
            Access Activation
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-zinc-950 sm:text-4xl">
            Quote system access
          </h1>
          <div
            className={`mt-6 border p-4 ${
              activationState === "success"
                ? "border-emerald-200 bg-emerald-50"
                : activationState === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-zinc-200 bg-zinc-50"
            }`}
          >
            <p
              className={`text-sm font-semibold leading-6 ${
                activationState === "success"
                  ? "text-emerald-900"
                  : activationState === "error"
                    ? "text-red-900"
                    : "text-zinc-700"
              }`}
            >
              {message}
            </p>
          </div>
        </div>

        {activationState === "success" ? (
          <Link
            href="/quote/new"
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-emerald-800 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-900"
          >
            Continue to Quote System
          </Link>
        ) : null}
      </section>
    </main>
  );
}
