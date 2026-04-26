"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type NewIngredientForm = {
  name: string;
  aliases: string;
  category: string;
  common_dose_min: string;
  common_dose_max: string;
  unit: string;
  default_dose: string;
  price_per_kg_usd: string;
  price_confidence: string;
  gummy_suitability: string;
  taste_risk: string;
  heat_sensitivity: string;
  oil_soluble: boolean;
  mineral_heavy: boolean;
  requires_rd_review: boolean;
  regulatory_review_required: boolean;
  notes: string;
};

const ADMIN_SESSION_KEY = "gummynology_admin_session";
const confidenceOptions = ["internal", "estimated", "needs_vendor_quote"];
const suitabilityOptions = ["high", "medium", "low", "restricted"];
const riskOptions = ["low", "medium", "high"];
const unitOptions = ["mg", "mcg", "g", "IU", "billion CFU"];

const emptyIngredientForm: NewIngredientForm = {
  name: "",
  aliases: "",
  category: "",
  common_dose_min: "",
  common_dose_max: "",
  unit: "mg",
  default_dose: "",
  price_per_kg_usd: "",
  price_confidence: "estimated",
  gummy_suitability: "medium",
  taste_risk: "medium",
  heat_sensitivity: "medium",
  oil_soluble: false,
  mineral_heavy: false,
  requires_rd_review: false,
  regulatory_review_required: false,
  notes: "",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAliases(value: string) {
  return value
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);
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
  const [successMessage, setSuccessMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIngredient, setNewIngredient] =
    useState<NewIngredientForm>(emptyIngredientForm);
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);

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
    setSuccessMessage("");

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

  async function addIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseClient();
    const name = newIngredient.name.trim();

    if (!supabase) {
      setErrorMessage("Supabase is not configured.");
      return;
    }

    if (!name) {
      setErrorMessage("Ingredient name is required.");
      return;
    }

    setIsAddingIngredient(true);
    setErrorMessage("");
    setSuccessMessage("");

    const now = new Date().toISOString();
    const metadataPayload = {
      name,
      aliases: parseAliases(newIngredient.aliases),
      category: newIngredient.category.trim() || null,
      common_dose_min: parseNumber(newIngredient.common_dose_min),
      common_dose_max: parseNumber(newIngredient.common_dose_max),
      unit: newIngredient.unit,
      default_dose: parseNumber(newIngredient.default_dose),
      gummy_suitability: newIngredient.gummy_suitability,
      taste_risk: newIngredient.taste_risk,
      heat_sensitivity: newIngredient.heat_sensitivity,
      oil_soluble: newIngredient.oil_soluble,
      mineral_heavy: newIngredient.mineral_heavy,
      requires_rd_review: newIngredient.requires_rd_review,
      regulatory_review_required: newIngredient.regulatory_review_required,
      notes: newIngredient.notes.trim() || null,
      updated_at: now,
    };
    const pricePayload = {
      name,
      price_per_kg_usd: parseNumber(newIngredient.price_per_kg_usd),
      price_confidence: newIngredient.price_confidence,
      notes: newIngredient.notes.trim() || null,
      last_updated: now,
    };

    const { error: ingredientError } = await supabase
      .from("ingredients")
      .upsert(metadataPayload, { onConflict: "name" });

    if (ingredientError) {
      setIsAddingIngredient(false);
      setErrorMessage(
        ingredientError.message || "Unable to save ingredient metadata.",
      );
      return;
    }

    const { error: priceError } = await supabase
      .from("ingredient_prices")
      .upsert(pricePayload, { onConflict: "name" });

    setIsAddingIngredient(false);

    if (priceError) {
      setErrorMessage(priceError.message || "Unable to save ingredient price.");
      return;
    }

    setNewIngredient(emptyIngredientForm);
    setShowAddForm(false);
    setSuccessMessage(`${name} was added and is available to quote pages.`);
    await loadPrices({ showLoading: false });
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
                Add active ingredient metadata and update cost assumptions in
                Supabase. Gummies pricing uses these values without a redeploy.
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

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">
                Add active ingredient
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                New ingredients are saved to Supabase and become searchable in
                the Gummies Configurator after refresh.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm((current) => !current)}
              className="inline-flex min-h-11 items-center justify-center rounded-sm bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              {showAddForm ? "Close Form" : "Add New Ingredient"}
            </button>
          </div>

          {showAddForm ? (
            <form
              onSubmit={addIngredient}
              className="mt-6 grid gap-4 border-t border-zinc-200 pt-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              <TextField
                label="Name"
                value={newIngredient.name}
                onChange={(value) =>
                  setNewIngredient((current) => ({ ...current, name: value }))
                }
                required
              />
              <TextField
                label="Aliases"
                value={newIngredient.aliases}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    aliases: value,
                  }))
                }
                placeholder="Comma separated"
              />
              <TextField
                label="Category"
                value={newIngredient.category}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    category: value,
                  }))
                }
              />
              <SelectField
                label="Unit"
                value={newIngredient.unit}
                options={unitOptions}
                onChange={(value) =>
                  setNewIngredient((current) => ({ ...current, unit: value }))
                }
              />
              <TextField
                label="Common Dose Min"
                type="number"
                value={newIngredient.common_dose_min}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    common_dose_min: value,
                  }))
                }
              />
              <TextField
                label="Common Dose Max"
                type="number"
                value={newIngredient.common_dose_max}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    common_dose_max: value,
                  }))
                }
              />
              <TextField
                label="Default Dose"
                type="number"
                value={newIngredient.default_dose}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    default_dose: value,
                  }))
                }
              />
              <TextField
                label="Price / kg USD"
                type="number"
                value={newIngredient.price_per_kg_usd}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    price_per_kg_usd: value,
                  }))
                }
              />
              <SelectField
                label="Price Confidence"
                value={newIngredient.price_confidence}
                options={confidenceOptions}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    price_confidence: value,
                  }))
                }
              />
              <SelectField
                label="Gummy Suitability"
                value={newIngredient.gummy_suitability}
                options={suitabilityOptions}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    gummy_suitability: value,
                  }))
                }
              />
              <SelectField
                label="Taste Risk"
                value={newIngredient.taste_risk}
                options={riskOptions}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    taste_risk: value,
                  }))
                }
              />
              <SelectField
                label="Heat Sensitivity"
                value={newIngredient.heat_sensitivity}
                options={riskOptions}
                onChange={(value) =>
                  setNewIngredient((current) => ({
                    ...current,
                    heat_sensitivity: value,
                  }))
                }
              />
              <CheckboxField
                label="Oil soluble"
                checked={newIngredient.oil_soluble}
                onChange={(checked) =>
                  setNewIngredient((current) => ({
                    ...current,
                    oil_soluble: checked,
                  }))
                }
              />
              <CheckboxField
                label="Mineral heavy"
                checked={newIngredient.mineral_heavy}
                onChange={(checked) =>
                  setNewIngredient((current) => ({
                    ...current,
                    mineral_heavy: checked,
                  }))
                }
              />
              <CheckboxField
                label="Requires R&D review"
                checked={newIngredient.requires_rd_review}
                onChange={(checked) =>
                  setNewIngredient((current) => ({
                    ...current,
                    requires_rd_review: checked,
                  }))
                }
              />
              <CheckboxField
                label="Regulatory review required"
                checked={newIngredient.regulatory_review_required}
                onChange={(checked) =>
                  setNewIngredient((current) => ({
                    ...current,
                    regulatory_review_required: checked,
                  }))
                }
              />
              <label className="sm:col-span-2 lg:col-span-4">
                <span className="text-sm font-semibold text-zinc-800">
                  Notes
                </span>
                <textarea
                  rows={2}
                  value={newIngredient.notes}
                  onChange={(event) =>
                    setNewIngredient((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-20 w-full border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-800"
                />
              </label>
              <div className="sm:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={isAddingIngredient}
                  className="inline-flex min-h-12 items-center justify-center rounded-sm bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  {isAddingIngredient ? "Adding..." : "Save New Ingredient"}
                </button>
              </div>
            </form>
          ) : null}
        </div>

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

          {successMessage ? (
            <div className="m-5 border border-emerald-200 bg-emerald-50 p-4 sm:m-6">
              <p className="text-sm font-semibold text-emerald-950">
                {successMessage}
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

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <input
        required={required}
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-11 w-full border border-zinc-300 px-3 text-sm outline-none transition focus:border-emerald-800"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full border border-zinc-300 px-3 text-sm outline-none transition focus:border-emerald-800"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-emerald-800"
      />
      {label}
    </label>
  );
}
