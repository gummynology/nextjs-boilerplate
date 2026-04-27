export const ADMIN_SESSION_KEY = "gummynology_admin_session";
export const INTERNAL_QUOTE_CUSTOMER_KEY =
  "gummynology_internal_quote_customer";

export type AccessRequestRow = {
  id: string | number;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  company_website?: string | null;
  business_email: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  status: string | null;
  created_at?: string | null;
};

export type QuoteRequestRow = {
  id: string;
  created_at: string | null;
  quotation_number?: string | null;
  source?: string | null;
  dosage_form: string | null;
  customer_email: string | null;
  company_name: string | null;
  contact_name?: string | null;
  phone?: string | null;
  address?: string | null;
  product_name?: string | null;
  project_name?: string | null;
  status: string | null;
  estimated_total_price?: number | null;
  estimated_unit_price_cents?: number | null;
  module_data: Record<string, any> | null;
};

export type InternalQuoteCustomer = {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  quotation_number?: string;
};

export function generateQuotationNumber(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  return `GNQ-${year}${month}${day}-${suffix}`;
}

export function getContactName(row: Partial<AccessRequestRow | QuoteRequestRow>) {
  const record = row as Record<string, unknown>;
  const direct = record.contact_name;
  const first = record.first_name;
  const last = record.last_name;
  const combined = [first, last].filter(Boolean).join(" ").trim();

  return String(direct || combined || "Not provided");
}

export function getCustomerEmail(
  row: Partial<AccessRequestRow | QuoteRequestRow>,
) {
  const record = row as Record<string, unknown>;

  return String(record.business_email || record.customer_email || "");
}

export function getCustomerKeyFromAccess(row: AccessRequestRow) {
  return `access:${row.id}`;
}

export function getCustomerKeyFromQuote(row: QuoteRequestRow) {
  if (row.customer_email) {
    return `email:${row.customer_email.toLowerCase()}`;
  }

  return `company:${(row.company_name || "unknown").toLowerCase()}`;
}

export function encodeCustomerKey(value: string) {
  return encodeURIComponent(value);
}

export function decodeCustomerKey(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeKeyPart(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCents(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Not available";
  }

  return `${value.toFixed(4)} cents`;
}

export function getPricingPreview(moduleData: Record<string, any> | null) {
  return (
    moduleData?.pricing_preview ||
    moduleData?.pricing_engine ||
    moduleData?.feasibility_preview?.pricing_engine ||
    {}
  );
}

export function getFeasibilityPreview(moduleData: Record<string, any> | null) {
  return moduleData?.feasibility_preview || {};
}

export function getQuoteEstimatedTotal(row: QuoteRequestRow) {
  const pricing = getPricingPreview(row.module_data);
  const direct = row.estimated_total_price;

  return direct !== null && direct !== undefined && Number.isFinite(Number(direct))
    ? Number(direct)
    : Number.isFinite(Number(pricing.final_price))
      ? Number(pricing.final_price)
      : Number.isFinite(Number(pricing.estimated_final_price_with_bottle_packaging))
        ? Number(pricing.estimated_final_price_with_bottle_packaging)
        : null;
}

export function getQuoteUnitCents(row: QuoteRequestRow) {
  const pricing = getPricingPreview(row.module_data);
  const direct = row.estimated_unit_price_cents;

  if (
    direct !== null &&
    direct !== undefined &&
    Number.isFinite(Number(direct))
  ) {
    return Number(direct);
  }

  if (Number.isFinite(Number(pricing.final_price_cents_per_gummy))) {
    return Number(pricing.final_price_cents_per_gummy);
  }

  if (Number.isFinite(Number(pricing.estimated_price_per_gummy))) {
    return Number(pricing.estimated_price_per_gummy) * 100;
  }

  return null;
}

export function statusClass(status: string | null | undefined) {
  if (status === "approved" || status === "quoted" || status === "won") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "rejected" || status === "lost") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "reviewing") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}
