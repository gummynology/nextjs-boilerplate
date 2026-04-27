"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  AccessRequestRow,
  INTERNAL_QUOTE_CUSTOMER_KEY,
  generateQuotationNumber,
  getContactName,
} from "@/lib/quoteManagement";
import {
  AdminNavButton,
  AdminPageShell,
} from "../_components/AdminAccessGate";

const emptyCustomer = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
};

export default function InternalQuotePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<AccessRequestRow[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [dosageForm, setDosageForm] = useState("gummies");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadCustomers() {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setErrorMessage("Supabase is not configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("access_requests")
      .select(
        "id, first_name, last_name, company_name, business_email, phone, address, city, state, zip_code, country, status, created_at",
      )
      .order("company_name", { ascending: true });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setCustomers((data || []) as AccessRequestRow[]);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const selectedCustomer = useMemo(
    () =>
      customers.find((row) => String(row.id) === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  useEffect(() => {
    if (!selectedCustomer) {
      return;
    }

    setCustomer({
      company_name: selectedCustomer.company_name || "",
      contact_name: getContactName(selectedCustomer),
      email: selectedCustomer.business_email || "",
      phone: selectedCustomer.phone || "",
      address: [
        selectedCustomer.address,
        selectedCustomer.city,
        selectedCustomer.state,
        selectedCustomer.zip_code,
        selectedCustomer.country,
      ]
        .filter(Boolean)
        .join(", "),
    });
  }, [selectedCustomer]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextCustomer = {
      ...customer,
      quotation_number: generateQuotationNumber(),
    };

    window.localStorage.setItem(
      INTERNAL_QUOTE_CUSTOMER_KEY,
      JSON.stringify(nextCustomer),
    );

    if (dosageForm === "gummies") {
      router.push("/admin/internal-quote/gummies");
      return;
    }

    setErrorMessage("Only the internal gummies quote builder is available now.");
  }

  return (
    <AdminPageShell
      eyebrow="Internal Quote"
      title="Create internal quote"
      description="Start a sales-created quote request for an existing or manually entered customer."
      actions={
        <>
          <AdminNavButton href="/admin/customers">Customer List</AdminNavButton>
          <AdminNavButton href="/admin">Access Requests</AdminNavButton>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="grid gap-6 border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
      >
        {errorMessage ? (
          <div className="border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">{errorMessage}</p>
          </div>
        ) : null}

        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            Customer selection
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Select an approved customer or enter customer details manually.
          </p>
        </div>

        <label>
          <span className="text-sm font-semibold text-zinc-800">
            Existing Customer
          </span>
          <select
            value={selectedCustomerId}
            onChange={(event) => setSelectedCustomerId(event.target.value)}
            className="mt-2 w-full rounded-sm border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-950 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
          >
            <option value="">
              {isLoading ? "Loading customers..." : "Manual entry"}
            </option>
            {customers.map((row) => (
              <option key={row.id} value={row.id}>
                {row.company_name || "Unnamed company"} -{" "}
                {row.business_email || "No email"}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Customer Company Name", "company_name"],
            ["Contact Name", "contact_name"],
            ["Email", "email"],
            ["Phone", "phone"],
          ].map(([label, key]) => (
            <label key={key}>
              <span className="text-sm font-semibold text-zinc-800">
                {label}
              </span>
              <input
                required={key === "company_name" || key === "email"}
                value={customer[key as keyof typeof customer]}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-sm border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-950 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
              />
            </label>
          ))}
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-zinc-800">
              Address
            </span>
            <input
              value={customer.address}
              onChange={(event) =>
                setCustomer((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-sm border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-950 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
            />
          </label>
        </div>

        <label>
          <span className="text-sm font-semibold text-zinc-800">
            Dosage Form
          </span>
          <select
            value={dosageForm}
            onChange={(event) => setDosageForm(event.target.value)}
            className="mt-2 w-full rounded-sm border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-950 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10"
          >
            <option value="gummies">Gummies</option>
          </select>
        </label>

        <div>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-sm bg-emerald-800 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-900"
          >
            Continue to Internal Gummies Quote
          </button>
        </div>
      </form>
    </AdminPageShell>
  );
}
