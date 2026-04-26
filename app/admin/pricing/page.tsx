"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

type IngredientPriceRow = {
  id: string;
  name: string;
  price_per_kg_usd: number | null;
  price_confidence: "estimated" | "internal" | "needs_vendor_quote" | string;
  last_updated: string | null;
  notes: string | null;
};

const ADMIN_SESSION_KEY = "gummynology_admin_session";
const confidenceOptions = ["internal", "estimated", "needs_vendor_quote"];

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminPricingPage() {
  const router = useRouter();
  const [rows, setRows] = useState<IngredientPriceRow[]>([]);
  const [draftRows, setDraftRows] = useState<Record<string, IngredientPriceRow>>(
    {},
  );
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.price_confidence.toLowerCase().includes(query) ||
        (row.notes || "").toLowerCase().includes(query),
    );
  }, [rows, search]);

  async function loadPrices({ showLoading = true } = {}) {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMessage(
        "Supabase is not configured. Add environment variables before managing ingredient prices.",
      );
      setIsLoading(false);
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }
    setErrorMessage("");

    const { data, error } = await supabase
      .from("ingredient_prices")
      .select("id, name, price_per_kg_usd, price_confidence, last_updated, notes")
      .order("name", { ascending: true });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message || "Unable to load ingredient prices.");
      return;
    }

    const nextRows = (data || []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      price_per_kg_usd:
        row.price_per_kg_usd === null ? null : Number(row.price_per_kg_usd),
      price_confidence: String(row.price_confidence),
      last_updated: row.last_updated === null ? null : String(row.last_updated),
      notes: row.notes === null ? null : String(row.notes),
    }));

    setRows(nextRows);
    setDraftRows(
      Object.fromEntries(nextRows.map((row) => [row.id, { ...row }])),
    );
  }

  async function saveRow(rowId: string) {
    const draft = draftRows[rowId];
    const current = rows.find((row) => row.id === rowId);
    const supabase = getSupabaseClient();

    if (!draft || !current || !supabase) {
      return;
    }

    const price =
      draft.price_per_kg_usd === null || Number.isNaN(draft.price_per_kg_usd)
        ? null
        : draft.price_per_kg_usd;

    setSavingId(rowId);
    setSavedId(null);
    setErrorMessage("");

    const lastUpdated = new Date().toISOString();
    const { error } = await supabase
      .from("ingredient_prices")
      .update({
        price_per_kg_usd: price,
        price_confidence: draft.price_confidence,
        notes: draft.notes,
        last_updated: lastUpdated,
      })
      .eq("id", rowId);

    setSavingId(null);

    if (error) {
      setErrorMessage(error.message || "Unable to update ingredient price.");
      return;
    }

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              price_per_kg_usd: price,
              price_confidence: draft.price_confidence,
              notes: draft.notes,
              last_updated: lastUpdated,
            }
          : row,
      ),
    );
    setDraftRows((currentDrafts) => ({
      ...currentDrafts,
      [rowId]: {
        ...draft,
        price_per_kg_usd: price,
        last_updated: lastUpdated,
      },
    }));
    setSavedId(rowId);
  }

  function updateDraft(
    rowId: string,
    field: keyof IngredientPriceRow,
    value: string,
  ) {
    setDraftRows((current) => {
      const draft = current[rowId];

      if (!draft) {
        return current;
      }

      return {
        ...current,
        [rowId]: {
          ...draft,
          [field]:
            field === "price_per_kg_usd"
              ? value === ""
                ? null
                : Number(value)
              : value,
        },
      };
    });
    setSavedId(null);
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
      loadPrices({ showLoading: false });
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

  return (
    <main className="min-h-screen bg-[#f7f6f1] text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold tracking-[0.22em] text-emerald-800 uppercase">
                Ingredient Pricing
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl">
                Raw material price manager
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
                Update ingredient cost assumptions stored in Supabase. Gummies
                pricing uses these values without a redeploy.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">
                Ingredient prices
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Showing {filteredRows.length} of {rows.length} ingredients.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ingredient"
                className="min-h-11 border border-zinc-300 px-3 text-sm outline-none transition focus:border-emerald-800"
              />
              <button
                type="button"
                onClick={() => loadPrices()}
                disabled={isLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="m-5 border border-red-200 bg-red-50 p-4 sm:m-6">
              <p className="text-sm font-semibold text-red-900">
                {errorMessage}
              </p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-base font-semibold text-zinc-700">
                Loading ingredient prices...
              </p>
            </div>
          ) : null}

          {!isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="bg-zinc-50">
                  <tr>
                    {[
                      "Ingredient",
                      "Price / kg USD",
                      "Confidence",
                      "Notes",
                      "Last Updated",
                      "Save",
                    ].map((header) => (
                      <th
                        key={header}
                        className="border-b border-zinc-200 px-5 py-4 text-xs font-semibold tracking-[0.14em] text-zinc-600 uppercase"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const draft = draftRows[row.id] || row;

                    return (
                      <tr key={row.id} className="border-b border-zinc-100">
                        <td className="px-5 py-4 text-sm font-semibold text-zinc-950">
                          {row.name}
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draft.price_per_kg_usd ?? ""}
                            onChange={(event) =>
                              updateDraft(
                                row.id,
                                "price_per_kg_usd",
                                event.target.value,
                              )
                            }
                            onBlur={() => saveRow(row.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.currentTarget.blur();
                              }
                            }}
                            className="min-h-10 w-36 border border-zinc-300 px-3 text-sm outline-none transition focus:border-emerald-800"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={draft.price_confidence}
                            onChange={(event) => {
                              updateDraft(
                                row.id,
                                "price_confidence",
                                event.target.value,
                              );
                            }}
                            onBlur={() => saveRow(row.id)}
                            className="min-h-10 border border-zinc-300 px-3 text-sm outline-none transition focus:border-emerald-800"
                          >
                            {confidenceOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="text"
                            value={draft.notes ?? ""}
                            onChange={(event) =>
                              updateDraft(row.id, "notes", event.target.value)
                            }
                            onBlur={() => saveRow(row.id)}
                            className="min-h-10 w-72 border border-zinc-300 px-3 text-sm outline-none transition focus:border-emerald-800"
                          />
                        </td>
                        <td className="px-5 py-4 text-sm text-zinc-600">
                          {formatDate(row.last_updated)}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => saveRow(row.id)}
                            disabled={savingId === row.id}
                            className="inline-flex min-h-10 items-center justify-center rounded-sm bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-zinc-300"
                          >
                            {savingId === row.id
                              ? "Saving..."
                              : savedId === row.id
                                ? "Saved"
                                : "Save"}
                          </button>
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
