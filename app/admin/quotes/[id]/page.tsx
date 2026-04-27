"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  AccessRequestRow,
  QuoteRequestRow,
  encodeCustomerKey,
  formatCents,
  formatCurrency,
  formatDateTime,
  getContactName,
  getCustomerKeyFromQuote,
  getFeasibilityPreview,
  getPricingPreview,
  getQuoteEstimatedTotal,
  getQuoteUnitCents,
  normalizeKeyPart,
  statusClass,
} from "@/lib/quoteManagement";
import {
  AdminNavButton,
  AdminPageShell,
} from "../../_components/AdminAccessGate";

const quoteStatuses = [
  { label: "Mark as Reviewing", value: "reviewing" },
  { label: "Mark as Quoted", value: "quoted" },
  { label: "Mark as Won", value: "won" },
  { label: "Mark as Lost", value: "lost" },
];

function detailValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "Not provided";
  }

  return String(value);
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function KeyValueGrid({
  items,
}: {
  items: { label: string; value: unknown }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase">
            {item.label}
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-zinc-950">
            {detailValue(item.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function JsonValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <div className="grid gap-3">
        {value.map((item, index) => (
          <div key={index} className="border border-zinc-200 bg-zinc-50 p-3">
            <JsonValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div className="grid gap-2">
        {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
          <div
            key={key}
            className="grid gap-2 border-b border-zinc-100 pb-2 text-sm sm:grid-cols-[220px_1fr]"
          >
            <span className="font-semibold text-zinc-600">
              {key.replace(/_/g, " ")}
            </span>
            <span className="break-words text-zinc-950">
              {typeof item === "object" && item !== null ? (
                <JsonValue value={item} />
              ) : (
                detailValue(item)
              )}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <span>{detailValue(value)}</span>;
}

function IngredientBreakdownTable({ rows }: { rows: any[] }) {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-sm font-semibold text-zinc-700">
        No ingredient cost breakdown available.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] border-collapse text-left">
        <thead className="bg-zinc-50">
          <tr>
            {[
              "Ingredient",
              "Amount Per Serving",
              "Serving Size",
              "Amount Per Gummy",
              "Price Per kg",
              "Cost Per Gummy",
              "Cost Per Serving",
              "Price Confidence",
              "Customer Supplied",
              "Warnings",
            ].map((header) => (
              <th
                key={header}
                className="border-b border-zinc-200 px-4 py-3 text-xs font-semibold tracking-[0.14em] text-zinc-600 uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {rows.map((row, index) => (
            <tr key={`${row.ingredient_name || row.name || index}`} className="align-top">
              <td className="px-4 py-3 text-sm font-semibold text-zinc-950">
                {row.ingredient_name || row.name || row.matched_ingredient_name || "Not provided"}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {detailValue(row.amount_per_serving)}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {detailValue(row.serving_size)}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {detailValue(row.amount_per_gummy_mg || row.amount_per_gummy)}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {row.price_per_kg_usd === null || row.price_per_kg_usd === undefined
                  ? "Vendor quote"
                  : formatCurrency(Number(row.price_per_kg_usd))}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {formatCents(
                  Number.isFinite(Number(row.cost_per_gummy))
                    ? Number(row.cost_per_gummy) * 100
                    : Number.isFinite(Number(row.estimated_raw_cost_per_gummy))
                      ? Number(row.estimated_raw_cost_per_gummy) * 100
                      : null,
                )}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {formatCurrency(
                  Number.isFinite(Number(row.cost_per_serving))
                    ? Number(row.cost_per_serving)
                    : Number.isFinite(Number(row.estimated_raw_cost_per_serving))
                      ? Number(row.estimated_raw_cost_per_serving)
                      : null,
                )}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {detailValue(row.price_confidence)}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {detailValue(row.customer_supplied)}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-700">
                {[
                  row.vendor_quote_required ? "Vendor quote required" : "",
                  row.regulatory_review_required ? "Regulatory review" : "",
                  row.requires_rd_review ? "R&D review" : "",
                ]
                  .filter(Boolean)
                  .join(", ") || "None"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const [quote, setQuote] = useState<QuoteRequestRow | null>(null);
  const [access, setAccess] = useState<AccessRequestRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState("");

  async function loadQuote() {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMessage("Supabase is not configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("quote_requests")
      .select(
        "id, created_at, quotation_number, source, dosage_form, customer_email, company_name, contact_name, phone, address, product_name, project_name, status, estimated_total_price, estimated_unit_price_cents, module_data",
      )
      .eq("id", params.id)
      .single();

    if (error) {
      setIsLoading(false);
      setErrorMessage(error.message);
      return;
    }

    const quoteRow = data as QuoteRequestRow;
    setQuote(quoteRow);

    const { data: accessData } = await supabase
      .from("access_requests")
      .select(
        "id, first_name, last_name, company_name, company_website, business_email, phone, address, city, state, zip_code, country, status, created_at",
      )
      .limit(1000);

    const matchedAccess =
      ((accessData || []) as AccessRequestRow[]).find((row) => {
        const quoteEmail = normalizeKeyPart(quoteRow.customer_email);
        const accessEmail = normalizeKeyPart(row.business_email);
        const quoteCompany = normalizeKeyPart(quoteRow.company_name);
        const accessCompany = normalizeKeyPart(row.company_name);

        return (
          (quoteEmail && accessEmail && quoteEmail === accessEmail) ||
          (quoteCompany && accessCompany && quoteCompany === accessCompany)
        );
      }) || null;

    setAccess(matchedAccess);
    setIsLoading(false);
  }

  async function updateStatus(nextStatus: string) {
    const supabase = getSupabaseClient();

    if (!quote || !supabase) {
      return;
    }

    setUpdatingStatus(nextStatus);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("quote_requests")
      .update({ status: nextStatus })
      .eq("id", quote.id);

    setUpdatingStatus("");

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setQuote({ ...quote, status: nextStatus });
    setSuccessMessage(`Quote marked as ${nextStatus}.`);
  }

  useEffect(() => {
    loadQuote();
  }, [params.id]);

  const pricing = useMemo(() => getPricingPreview(quote?.module_data || null), [quote]);
  const feasibility = useMemo(
    () => getFeasibilityPreview(quote?.module_data || null),
    [quote],
  );
  const customerKey = quote ? getCustomerKeyFromQuote(quote) : "";
  const ingredientBreakdown = [
    pricing.ingredient_cost_breakdown,
    pricing.ingredient_cost_lines,
    feasibility.ingredient_cost_lines,
    quote?.module_data?.active_ingredients,
  ].find((rows) => Array.isArray(rows)) || [];

  return (
    <AdminPageShell
      eyebrow="Quote Detail"
      title={quote?.quotation_number || "Quotation detail"}
      description="Review submitted configuration, technical signals, and internal pricing detail."
      actions={
        <>
          {quote ? (
            <AdminNavButton href={`/admin/customers/${encodeCustomerKey(customerKey)}`}>
              Back to Customer
            </AdminNavButton>
          ) : null}
          <AdminNavButton href="/admin/customers">Back to Customer List</AdminNavButton>
        </>
      }
    >
      {errorMessage ? (
        <div className="mb-6 border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">{errorMessage}</p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-6 border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            {successMessage}
          </p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="border border-zinc-200 bg-white p-8 text-center font-semibold text-zinc-700 shadow-sm">
          Loading quotation...
        </div>
      ) : null}

      {!isLoading && quote ? (
        <div className="grid gap-6">
          <SectionCard title="Quotation summary">
            <div className="mb-5 flex flex-wrap gap-2">
              {quoteStatuses.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => updateStatus(status.value)}
                  disabled={updatingStatus === status.value}
                  className="inline-flex min-h-10 items-center justify-center rounded-sm border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                >
                  {updatingStatus === status.value ? "Saving..." : status.label}
                </button>
              ))}
            </div>
            <KeyValueGrid
              items={[
                { label: "Quotation Number", value: quote.quotation_number || "Pending Number" },
                { label: "Status", value: quote.status || "new" },
                { label: "Source", value: quote.source || "customer_portal" },
                { label: "Created Date", value: formatDateTime(quote.created_at) },
                { label: "Dosage Form", value: quote.dosage_form },
                { label: "Estimated Total Price", value: formatCurrency(getQuoteEstimatedTotal(quote)) },
                { label: "Estimated Price Per Gummy", value: formatCents(getQuoteUnitCents(quote)) },
              ]}
            />
          </SectionCard>

          <SectionCard title="Customer and product information">
            <KeyValueGrid
              items={[
                { label: "Customer Company Name", value: quote.company_name },
                { label: "Contact Name", value: quote.contact_name || (access ? getContactName(access) : "") },
                { label: "Email", value: quote.customer_email },
                { label: "Phone", value: quote.phone || access?.phone },
                { label: "Address", value: quote.address || access?.address },
                { label: "Product Name", value: quote.product_name || quote.module_data?.product_name },
                { label: "Project Name", value: quote.project_name || quote.module_data?.project_name },
              ]}
            />
          </SectionCard>

          <SectionCard title="Internal Only Pricing Breakdown">
            <div className="mb-5 border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">
                Internal Only Pricing Breakdown
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                This section is intended for sales, R&D, purchasing, and
                management review. It should not be shared as a final commercial
                quote without confirmation.
              </p>
            </div>
            <KeyValueGrid
              items={[
                { label: "Gross Margin", value: pricing.gross_margin ? `${(Number(pricing.gross_margin) * 100).toFixed(0)}%` : null },
                { label: "Active Cost", value: formatCurrency(pricing.active_cost) },
                { label: "Base Gummy System Cost", value: formatCurrency(pricing.base_system_cost) },
                { label: "Base Cost Per Gummy", value: formatCurrency(pricing.base_cost_per_gummy) },
                { label: "Overhead Cost", value: formatCurrency(pricing.overhead_cost) },
                { label: "Complexity Fee", value: formatCurrency(pricing.complexity_fee) },
                { label: "Calculated Price", value: formatCurrency(pricing.calculated_price) },
                { label: "Calculated Unit Price Before Floor", value: formatCents(Number(pricing.calculated_price_per_gummy) * 100) },
                { label: "Floor Price", value: formatCurrency(pricing.floor_total_price) },
                { label: "Floor Unit Price", value: formatCents(Number(pricing.floor_price_cents_per_gummy)) },
                { label: "Final Protected Price", value: formatCurrency(pricing.final_price) },
                { label: "Floor Protection Status", value: pricing.floor_protection_status },
                { label: "R&D Fee", value: formatCurrency(pricing.rd_fee) },
                { label: "Mold Cost", value: formatCurrency(pricing.mold_cost) },
                { label: "Vendor Quote Warnings", value: pricing.vendor_quote_ingredient_names?.join(", ") || pricing.pricing_note },
                { label: "Regulatory Review Warnings", value: feasibility.regulatory_review_note },
                { label: "Total Gummies", value: pricing.requested_total_gummies },
                { label: "Total Weight kg", value: pricing.requested_total_kg },
                { label: "MOQ Adjustment", value: pricing.moq_applied ? "300kg MOQ applied" : "Not applied" },
                { label: "Applied Gross Margin Tier", value: pricing.gross_margin ? `${(Number(pricing.gross_margin) * 100).toFixed(0)}%` : null },
              ]}
            />

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-zinc-950">
                Ingredient Cost Breakdown
              </h3>
              <div className="mt-4">
                <IngredientBreakdownTable rows={ingredientBreakdown} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Full module data">
            <JsonValue value={quote.module_data || {}} />
          </SectionCard>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
