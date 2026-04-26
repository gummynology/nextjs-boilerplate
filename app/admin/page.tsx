"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AccessRequestStatus = "pending" | "approved" | "rejected" | string;

type AccessRequest = {
  id: number | string;
  first_name: string;
  last_name: string;
  company_name: string;
  business_email: string;
  status: AccessRequestStatus;
  activation_token: string | null;
  activated: boolean | null;
  activated_at: string | null;
  created_at: string;
};

const tableHeaders = [
  "Name",
  "Company",
  "Business Email",
  "Status",
  "Created",
  "Activation Link",
  "Review",
];

const ADMIN_SESSION_KEY = "gummynology_admin_session";
const ACTIVATION_BASE_URL = "https://quote.gummynology.com/activate";

function formatDate(value: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: AccessRequestStatus) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function generateActivationToken() {
  const values = new Uint8Array(32);
  window.crypto.getRandomValues(values);

  return btoa(String.fromCharCode(...values))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getActivationLink(token: string) {
  return `${ACTIVATION_BASE_URL}?token=${encodeURIComponent(token)}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);

  async function loadRequests({ showLoading = true } = {}) {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMessage(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load access requests.",
      );
      setIsLoading(false);
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }
    setErrorMessage("");
    setSuccessMessage("");
    setWarningMessage("");

    const { data, error } = await supabase
      .from("access_requests")
      .select(
        "id, first_name, last_name, company_name, business_email, status, activation_token, activated, activated_at, created_at",
      )
      .order("created_at", { ascending: false });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message || "Unable to load access requests.");
      return;
    }

    setRequests((data || []) as AccessRequest[]);
  }

  async function updateStatus(
    request: AccessRequest,
    nextStatus: "approved" | "rejected",
  ) {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMessage(
        "Supabase is not configured. Add environment variables before reviewing requests.",
      );
      return;
    }

    setUpdatingId(request.id);
    setErrorMessage("");
    setSuccessMessage("");
    setWarningMessage("");

    const activationToken =
      request.activation_token || generateActivationToken();

    const updatePayload =
      nextStatus === "approved"
        ? {
            status: nextStatus,
            activation_token: activationToken,
            activated: false,
            activated_at: null,
          }
        : { status: nextStatus };

    const { error } = await supabase
      .from("access_requests")
      .update(updatePayload)
      .eq("id", request.id);

    if (error) {
      setUpdatingId(null);
      setErrorMessage(error.message || "Unable to update request status.");
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, ...updatePayload } : item,
      ),
    );

    if (nextStatus === "approved") {
      try {
        const response = await fetch("/api/send-access-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: request.business_email,
            first_name: request.first_name,
            activation_token: activationToken,
          }),
        });

        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          setWarningMessage(
            result?.error ||
              "Access was approved, but the activation email could not be sent. Copy the activation link and send it manually.",
          );
        } else {
          setSuccessMessage(
            `Access approved and activation email sent to ${request.business_email}.`,
          );
        }
      } catch {
        setWarningMessage(
          "Access was approved, but the activation email request failed. Copy the activation link and send it manually.",
        );
      }
    }

    setUpdatingId(null);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hasAdminSession =
        window.localStorage.getItem(ADMIN_SESSION_KEY) === "authenticated";

      if (!hasAdminSession) {
        router.replace("/admin-login");
        return;
      }

      setIsCheckingAccess(false);
      loadRequests({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  function handleSignOut() {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    router.replace("/admin-login");
  }

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

  return (
    <main className="min-h-screen bg-[#f7f6f1] text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold tracking-[0.22em] text-emerald-800 uppercase">
                Internal Review
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl">
                Access request admin dashboard
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
                Review submitted company requests and update approval status for
                the Gummynology quote system.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/pricing"
                className="inline-flex min-h-11 items-center justify-center rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800"
              >
                Manage Raw Materials
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-11 items-center justify-center rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-red-700 hover:text-red-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">
                Access requests
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Status updates are saved directly to Supabase.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadRequests()}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {errorMessage ? (
            <div className="m-5 border border-red-200 bg-red-50 p-4 sm:m-6">
              <p className="text-sm font-semibold text-red-900">
                {errorMessage}
              </p>
            </div>
          ) : null}

          {successMessage ? (
            <div className="m-5 border border-emerald-200 bg-emerald-50 p-4 sm:m-6">
              <p className="text-sm font-semibold text-emerald-900">
                {successMessage}
              </p>
            </div>
          ) : null}

          {warningMessage ? (
            <div className="m-5 border border-amber-200 bg-amber-50 p-4 sm:m-6">
              <p className="text-sm font-semibold text-amber-900">
                {warningMessage}
              </p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-base font-semibold text-zinc-700">
                Loading access requests...
              </p>
            </div>
          ) : null}

          {!isLoading && requests.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base font-semibold text-zinc-700">
                No access requests found.
              </p>
            </div>
          ) : null}

          {!isLoading && requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left">
                <thead className="bg-zinc-50">
                  <tr>
                    {tableHeaders.map((header) => (
                      <th
                        key={header}
                        className="border-b border-zinc-200 px-5 py-4 text-xs font-semibold tracking-[0.14em] text-zinc-600 uppercase"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {requests.map((request) => {
                    const isUpdating = updatingId === request.id;

                    return (
                      <tr key={request.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-zinc-950">
                            {request.first_name} {request.last_name}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-zinc-700">
                            {request.company_name}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <a
                            href={`mailto:${request.business_email}`}
                            className="text-sm font-medium text-emerald-800 hover:text-emerald-950"
                          >
                            {request.business_email}
                          </a>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase ${statusClass(
                              request.status,
                            )}`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-zinc-700">
                            {formatDate(request.created_at)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {request.status === "approved" &&
                          request.activation_token ? (
                            <div className="max-w-sm">
                              <p className="break-all text-xs leading-5 text-zinc-700">
                                {getActivationLink(request.activation_token)}
                              </p>
                              <p className="mt-2 text-xs font-semibold text-emerald-800">
                                {request.activated
                                  ? "Activated"
                                  : "Ready to copy"}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-zinc-500">
                              Approve to generate link
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                isUpdating || request.status === "approved"
                              }
                              onClick={() => updateStatus(request, "approved")}
                              className="inline-flex min-h-10 items-center justify-center rounded-sm bg-emerald-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-zinc-300"
                            >
                              {isUpdating ? "Saving..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              disabled={
                                isUpdating || request.status === "rejected"
                              }
                              onClick={() => updateStatus(request, "rejected")}
                              className="inline-flex min-h-10 items-center justify-center rounded-sm border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
