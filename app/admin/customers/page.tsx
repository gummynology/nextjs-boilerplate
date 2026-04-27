"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  AccessRequestRow,
  QuoteRequestRow,
  encodeCustomerKey,
  formatDateTime,
  getContactName,
  getCustomerEmail,
  getCustomerKeyFromAccess,
  getCustomerKeyFromQuote,
  normalizeKeyPart,
  statusClass,
} from "@/lib/quoteManagement";
import {
  AdminNavButton,
  AdminPageShell,
} from "../_components/AdminAccessGate";

type CustomerSummary = {
  key: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  quote_count: number;
  last_quote_date: string | null;
};

function getQuoteMatchKey(quote: QuoteRequestRow) {
  return normalizeKeyPart(quote.customer_email || quote.company_name);
}

function getAccessMatchKey(access: AccessRequestRow) {
  return normalizeKeyPart(access.business_email || access.company_name);
}

function formatAddress(row: Partial<AccessRequestRow | QuoteRequestRow>) {
  const record = row as Record<string, string | number | null | undefined>;
  const parts = [
    record.address,
    record.city,
    record.state,
    record.zip_code,
    record.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Not provided";
}

export default function AdminCustomersPage() {
  const [accessRows, setAccessRows] = useState<AccessRequestRow[]>([]);
  const [quoteRows, setQuoteRows] = useState<QuoteRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

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

  const customers = useMemo(() => {
    const byMatchKey = new Map<string, CustomerSummary>();

    accessRows.forEach((row) => {
      const matchKey = getAccessMatchKey(row);

      if (!matchKey) {
        return;
      }

      byMatchKey.set(matchKey, {
        key: getCustomerKeyFromAccess(row),
        company_name: row.company_name || "Not provided",
        contact_name: getContactName(row),
        email: getCustomerEmail(row),
        phone: row.phone || "Not provided",
        address: formatAddress(row),
        status: row.status || "pending",
        quote_count: 0,
        last_quote_date: null,
      });
    });

    quoteRows.forEach((quote) => {
      const matchKey = getQuoteMatchKey(quote);

      if (!matchKey) {
        return;
      }

      const existing =
        byMatchKey.get(matchKey) ||
        ({
          key: getCustomerKeyFromQuote(quote),
          company_name: quote.company_name || "Not provided",
          contact_name: getContactName(quote),
          email: quote.customer_email || "",
          phone: quote.phone || "Not provided",
          address: quote.address || "Not provided",
          status: "quote customer",
          quote_count: 0,
          last_quote_date: null,
        } satisfies CustomerSummary);

      existing.quote_count += 1;

      if (
        quote.created_at &&
        (!existing.last_quote_date ||
          new Date(quote.created_at) > new Date(existing.last_quote_date))
      ) {
        existing.last_quote_date = quote.created_at;
      }

      byMatchKey.set(matchKey, existing);
    });

    return Array.from(byMatchKey.values()).sort((a, b) =>
      a.company_name.localeCompare(b.company_name),
    );
  }, [accessRows, quoteRows]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.company_name,
        customer.contact_name,
        customer.email,
        customer.phone,
        customer.address,
        customer.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [customers, search]);

  return (
    <AdminPageShell
      eyebrow="Sales"
      title="Sales quote management"
      description="Review approved customers and submitted quotation requests."
      actions={
        <>
          <AdminNavButton href="/admin">Access Requests</AdminNavButton>
          <AdminNavButton href="/admin/internal-quote" primary>
            Create Internal Quote
          </AdminNavButton>
          <AdminNavButton href="/admin/pricing">Manage Raw Materials</AdminNavButton>
        </>
      }
    >
      <div className="border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">
              Customers and companies
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Aggregated from access requests and submitted quote requests.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers"
              className="min-h-11 rounded-sm border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
            />
            <button
              type="button"
              onClick={loadData}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800"
            >
              Refresh
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
          <div className="p-8 text-center text-base font-semibold text-zinc-700">
            Loading customers...
          </div>
        ) : null}

        {!isLoading && filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-base font-semibold text-zinc-700">
            No customers found.
          </div>
        ) : null}

        {!isLoading && filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead className="bg-zinc-50">
                <tr>
                  {[
                    "Company Name",
                    "Contact Name",
                    "Email",
                    "Phone",
                    "Address",
                    "Status",
                    "Number of Quotes",
                    "Last Quote Date",
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
                {filteredCustomers.map((customer) => (
                  <tr key={customer.key} className="align-top">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/customers/${encodeCustomerKey(
                          customer.key,
                        )}`}
                        className="text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                      >
                        {customer.company_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-700">
                      {customer.contact_name}
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-700">
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          className="font-medium text-emerald-800 hover:text-emerald-950"
                        >
                          {customer.email}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-700">
                      {customer.phone}
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-700">
                      {customer.address}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase ${statusClass(
                          customer.status,
                        )}`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-zinc-950">
                      {customer.quote_count}
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-700">
                      {formatDateTime(customer.last_quote_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
