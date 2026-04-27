"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  AccessRequestRow,
  QuoteRequestRow,
  decodeCustomerKey,
  formatCents,
  formatCurrency,
  formatDateTime,
  getContactName,
  getCustomerEmail,
  getQuoteEstimatedTotal,
  getQuoteUnitCents,
  normalizeKeyPart,
  statusClass,
} from "@/lib/quoteManagement";
import {
  AdminNavButton,
  AdminPageShell,
} from "../../_components/AdminAccessGate";

function matchQuoteToAccess(quote: QuoteRequestRow, access: AccessRequestRow) {
  const quoteEmail = normalizeKeyPart(quote.customer_email);
  const accessEmail = normalizeKeyPart(access.business_email);
  const quoteCompany = normalizeKeyPart(quote.company_name);
  const accessCompany = normalizeKeyPart(access.company_name);

  return (
    (quoteEmail && accessEmail && quoteEmail === accessEmail) ||
    (quoteCompany && accessCompany && quoteCompany === accessCompany)
  );
}

function detailValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === ""
    ? "Not provided"
    : String(value);
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-zinc-950">
        {detailValue(value)}
      </p>
    </div>
  );
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ companyKey: string }>();
  const companyKey = decodeCustomerKey(params.companyKey || "");
  const [accessRows, setAccessRows] = useState<AccessRequestRow[]>([]);
  const [quoteRows, setQuoteRows] = useState<QuoteRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMessage("Supabase is not configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const [accessResult, quoteResult] = await Promise.all([
      supabase
        .from("access_requests")
        .select(
          "id, first_name, last_name, company_name, company_website, business_email, phone, address, city, state, zip_code, country, status, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("quote_requests")
        .select(
          "id, created_at, quotation_number, source, dosage_form, customer_email, company_name, contact_name, phone, address, product_name, project_name, status, estimated_total_price, estimated_unit_price_cents, module_data",
        )
        .order("created_at", { ascending: false }),
    ]);

    setIsLoading(false);

    if (accessResult.error) {
      setErrorMessage(accessResult.error.message);
      return;
    }

    if (quoteResult.error) {
      setErrorMessage(quoteResult.error.message);
      return;
    }

    setAccessRows((accessResult.data || []) as AccessRequestRow[]);
    setQuoteRows((quoteResult.data || []) as QuoteRequestRow[]);
  }

  useEffect(() => {
    loadData();
  }, []);

  const { access, quotes } = useMemo(() => {
    let matchedAccess: AccessRequestRow | null = null;
    let matchedQuotes: QuoteRequestRow[] = [];

    if (companyKey.startsWith("access:")) {
      const accessId = companyKey.replace("access:", "");
      matchedAccess =
        accessRows.find((row) => String(row.id) === accessId) || null;
      matchedQuotes = matchedAccess
        ? quoteRows.filter((quote) => matchQuoteToAccess(quote, matchedAccess!))
        : [];
    } else if (companyKey.startsWith("email:")) {
      const email = normalizeKeyPart(companyKey.replace("email:", ""));
      matchedAccess =
        accessRows.find(
          (row) => normalizeKeyPart(row.business_email) === email,
        ) || null;
      matchedQuotes = quoteRows.filter(
        (quote) => normalizeKeyPart(quote.customer_email) === email,
      );
    } else if (companyKey.startsWith("company:")) {
      const company = normalizeKeyPart(companyKey.replace("company:", ""));
      matchedAccess =
        accessRows.find(
          (row) => normalizeKeyPart(row.company_name) === company,
        ) || null;
      matchedQuotes = quoteRows.filter(
        (quote) => normalizeKeyPart(quote.company_name) === company,
      );
    }

    return { access: matchedAccess, quotes: matchedQuotes };
  }, [accessRows, quoteRows, companyKey]);

  const fallbackQuote = quotes[0] || null;
  const companyName =
    access?.company_name || fallbackQuote?.company_name || "Customer detail";
  const contactName = access
    ? getContactName(access)
    : fallbackQuote
      ? getContactName(fallbackQuote)
      : "Not provided";
  const email = access
    ? getCustomerEmail(access)
    : fallbackQuote?.customer_email || "";

  return (
    <AdminPageShell
      eyebrow="Customer Detail"
      title={companyName}
      description="Review customer profile information and quotation history."
      actions={
        <>
          <AdminNavButton href="/admin/customers">Back to Customer List</AdminNavButton>
          <AdminNavButton href="/admin/internal-quote" primary>
            Create Internal Quote
          </AdminNavButton>
        </>
      }
    >
      {errorMessage ? (
        <div className="mb-6 border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">{errorMessage}</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="border border-zinc-200 bg-white p-8 text-center font-semibold text-zinc-700 shadow-sm">
          Loading customer detail...
        </div>
      ) : null}

      {!isLoading ? (
        <div className="grid gap-6">
          <section className="border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">
                  Customer information
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Primary company record used for sales review.
                </p>
              </div>
              <span
                className={`inline-flex w-fit rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase ${statusClass(
                  access?.status || fallbackQuote?.status || "unknown",
                )}`}
              >
                {access?.status || fallbackQuote?.status || "unknown"}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailCard label="Company Name" value={companyName} />
              <DetailCard label="Contact Name" value={contactName} />
              <DetailCard label="Business Email" value={email} />
              <DetailCard label="Phone Number" value={access?.phone || fallbackQuote?.phone} />
              <DetailCard label="Company Website" value={access?.company_website} />
              <DetailCard label="Address" value={access?.address || fallbackQuote?.address} />
              <DetailCard label="City" value={access?.city} />
              <DetailCard label="State" value={access?.state} />
              <DetailCard label="Zip Code" value={access?.zip_code} />
              <DetailCard label="Country" value={access?.country} />
              <DetailCard label="Approval Status" value={access?.status} />
            </div>
          </section>

          <section className="border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-zinc-950">
                Quotation requests
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Quote requests submitted by this customer or created internally.
              </p>
            </div>

            {quotes.length === 0 ? (
              <div className="p-8 text-center text-base font-semibold text-zinc-700">
                No quotations found for this customer.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse text-left">
                  <thead className="bg-zinc-50">
                    <tr>
                      {[
                        "Quotation Number",
                        "Product Name",
                        "Project Name",
                        "Dosage Form",
                        "Status",
                        "Created Date",
                        "Estimated Total Price",
                        "Estimated Price Per Gummy",
                        "Actions",
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
                  <tbody className="divide-y divide-zinc-200">
                    {quotes.map((quote) => (
                      <tr key={quote.id} className="align-top">
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/quotes/${quote.id}`}
                            className="text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                          >
                            {quote.quotation_number || "Pending Number"}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-sm text-zinc-700">
                          {quote.product_name || quote.module_data?.product_name || "Not provided"}
                        </td>
                        <td className="px-5 py-4 text-sm text-zinc-700">
                          {quote.project_name || quote.module_data?.project_name || "Not provided"}
                        </td>
                        <td className="px-5 py-4 text-sm text-zinc-700">
                          {quote.dosage_form || "Not provided"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase ${statusClass(
                              quote.status,
                            )}`}
                          >
                            {quote.status || "new"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-zinc-700">
                          {formatDateTime(quote.created_at)}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-zinc-950">
                          {formatCurrency(getQuoteEstimatedTotal(quote))}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-zinc-950">
                          {formatCents(getQuoteUnitCents(quote))}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/quotes/${quote.id}`}
                            className="inline-flex min-h-10 items-center justify-center rounded-sm border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800"
                          >
                            View quote
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
