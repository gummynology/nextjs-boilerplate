"use client";

import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const productInterests = [
  "Gummies",
  "Capsules",
  "Tablets",
  "Powders",
  "Sachets",
  "Liquids",
  "Softgels",
  "Tincture",
  "Multiple formats",
];

const reviewSteps = [
  "Business identity review",
  "Manufacturing scope review",
  "Quote-system access approval",
  "Access code delivery",
];

const initialValues = {
  firstName: "",
  lastName: "",
  companyName: "",
  companyWebsite: "",
  businessEmail: "",
  phoneNumber: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  productInterest: "",
  estimatedAnnualVolume: "",
  message: "",
};

type FormValues = typeof initialValues;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const inputClass =
  "mt-2 w-full rounded-sm border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10";

const errorInputClass =
  "border-red-600 focus:border-red-700 focus:ring-red-700/10";

const labelClass = "text-sm font-semibold text-zinc-800";

function validate(values: FormValues) {
  const errors: FormErrors = {};
  const requiredFields: Array<keyof FormValues> = [
    "firstName",
    "lastName",
    "companyName",
    "companyWebsite",
    "businessEmail",
    "phoneNumber",
    "address",
    "city",
    "state",
    "zipCode",
    "country",
    "productInterest",
    "estimatedAnnualVolume",
    "message",
  ];

  requiredFields.forEach((field) => {
    if (!values[field].trim()) {
      errors[field] = "This field is required.";
    }
  });

  if (
    values.businessEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.businessEmail)
  ) {
    errors.businessEmail = "Enter a valid business email.";
  }

  if (values.companyWebsite) {
    try {
      const url = new URL(values.companyWebsite);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.companyWebsite = "Enter a valid company website URL.";
      }
    } catch {
      errors.companyWebsite = "Enter a valid company website URL.";
    }
  }

  if (
    values.phoneNumber &&
    !/^[0-9()+\-\s.]{7,}$/.test(values.phoneNumber)
  ) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  return errors;
}

function fieldClass(error?: string) {
  return `${inputClass} ${error ? errorInputClass : ""}`;
}

export default function RequestAccessPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitError("");
    setSubmitted(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError("");
    setSubmitted(false);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      setSubmitError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable submissions.",
      );
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("access_requests").insert({
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      company_name: values.companyName.trim(),
      company_website: values.companyWebsite.trim(),
      business_email: values.businessEmail.trim(),
      phone: values.phoneNumber.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      zip_code: values.zipCode.trim(),
      country: values.country.trim(),
      product_interest: values.productInterest,
      estimated_annual_volume: values.estimatedAnnualVolume.trim(),
      message: values.message.trim(),
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(
        error.message ||
          "Unable to submit your access request. Please try again.",
      );
      return;
    }

    setValues(initialValues);
    setSubmitted(true);
  }

  function ErrorMessage({ field }: { field: keyof FormValues }) {
    if (!errors[field]) {
      return null;
    }

    return (
      <p className="mt-2 text-sm font-medium text-red-700">{errors[field]}</p>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <nav className="flex items-center justify-between gap-4">
            <a
              href="/"
              className="text-base font-semibold tracking-[0.18em] text-zinc-950 uppercase"
            >
              Gummynology
            </a>
            <a
              href="/quote/new"
              className="hidden rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800 sm:inline-flex"
            >
              Get Instant Estimate
            </a>
          </nav>

          <div className="max-w-4xl py-8 lg:py-12">
            <p className="text-sm font-semibold tracking-[0.22em] text-emerald-800 uppercase">
              Verified Access Only
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl lg:text-6xl">
              Request access to the Gummynology quote system
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-700">
              Submit your business information for review. Approved supplement
              brands receive controlled access to build verified OEM
              manufacturing quote requests.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.48fr] lg:px-10 lg:py-16">
        <form
          noValidate
          onSubmit={handleSubmit}
          className="border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8"
        >
          <div className="border-b border-zinc-200 pb-6">
            <p className="text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
              Phase 2 Access Request
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-950">
              Company and contact information
            </h2>
          </div>

          {submitted ? (
            <div className="mt-6 border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-base font-semibold text-emerald-950">
                Thank you. Your access request has been submitted for review.
              </p>
            </div>
          ) : null}

          {submitError ? (
            <div className="mt-6 border border-red-200 bg-red-50 p-4">
              <p className="text-base font-semibold text-red-900">
                {submitError}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              First name
              <input
                className={fieldClass(errors.firstName)}
                name="firstName"
                onChange={(event) => updateField("firstName", event.target.value)}
                placeholder="First name"
                type="text"
                value={values.firstName}
              />
              <ErrorMessage field="firstName" />
            </label>

            <label className={labelClass}>
              Last name
              <input
                className={fieldClass(errors.lastName)}
                name="lastName"
                onChange={(event) => updateField("lastName", event.target.value)}
                placeholder="Last name"
                type="text"
                value={values.lastName}
              />
              <ErrorMessage field="lastName" />
            </label>

            <label className={labelClass}>
              Company name
              <input
                className={fieldClass(errors.companyName)}
                name="companyName"
                onChange={(event) =>
                  updateField("companyName", event.target.value)
                }
                placeholder="Company legal name"
                type="text"
                value={values.companyName}
              />
              <ErrorMessage field="companyName" />
            </label>

            <label className={labelClass}>
              Company website
              <input
                className={fieldClass(errors.companyWebsite)}
                name="companyWebsite"
                onChange={(event) =>
                  updateField("companyWebsite", event.target.value)
                }
                placeholder="https://example.com"
                type="url"
                value={values.companyWebsite}
              />
              <ErrorMessage field="companyWebsite" />
            </label>

            <label className={labelClass}>
              Business email
              <input
                className={fieldClass(errors.businessEmail)}
                name="businessEmail"
                onChange={(event) =>
                  updateField("businessEmail", event.target.value)
                }
                placeholder="name@company.com"
                type="email"
                value={values.businessEmail}
              />
              <ErrorMessage field="businessEmail" />
            </label>

            <label className={labelClass}>
              Phone number
              <input
                className={fieldClass(errors.phoneNumber)}
                name="phoneNumber"
                onChange={(event) =>
                  updateField("phoneNumber", event.target.value)
                }
                placeholder="Business phone"
                type="tel"
                value={values.phoneNumber}
              />
              <ErrorMessage field="phoneNumber" />
            </label>
          </div>

          <div className="mt-8 border-t border-zinc-200 pt-6">
            <h2 className="text-2xl font-semibold text-zinc-950">
              Business address
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                Address
                <input
                  className={fieldClass(errors.address)}
                  name="address"
                  onChange={(event) => updateField("address", event.target.value)}
                  placeholder="Street address"
                  type="text"
                  value={values.address}
                />
                <ErrorMessage field="address" />
              </label>

              <label className={labelClass}>
                City
                <input
                  className={fieldClass(errors.city)}
                  name="city"
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="City"
                  type="text"
                  value={values.city}
                />
                <ErrorMessage field="city" />
              </label>

              <label className={labelClass}>
                State
                <input
                  className={fieldClass(errors.state)}
                  name="state"
                  onChange={(event) => updateField("state", event.target.value)}
                  placeholder="State or province"
                  type="text"
                  value={values.state}
                />
                <ErrorMessage field="state" />
              </label>

              <label className={labelClass}>
                Zip code
                <input
                  className={fieldClass(errors.zipCode)}
                  name="zipCode"
                  onChange={(event) => updateField("zipCode", event.target.value)}
                  placeholder="Zip or postal code"
                  type="text"
                  value={values.zipCode}
                />
                <ErrorMessage field="zipCode" />
              </label>

              <label className={labelClass}>
                Country
                <input
                  className={fieldClass(errors.country)}
                  name="country"
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Country"
                  type="text"
                  value={values.country}
                />
                <ErrorMessage field="country" />
              </label>
            </div>
          </div>

          <div className="mt-8 border-t border-zinc-200 pt-6">
            <h2 className="text-2xl font-semibold text-zinc-950">
              Manufacturing request
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                Product interest
                <select
                  className={fieldClass(errors.productInterest)}
                  name="productInterest"
                  onChange={(event) =>
                    updateField("productInterest", event.target.value)
                  }
                  value={values.productInterest}
                >
                  <option value="">Select a format</option>
                  {productInterests.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
                <ErrorMessage field="productInterest" />
              </label>

              <label className={labelClass}>
                Estimated annual volume
                <input
                  className={fieldClass(errors.estimatedAnnualVolume)}
                  name="estimatedAnnualVolume"
                  onChange={(event) =>
                    updateField("estimatedAnnualVolume", event.target.value)
                  }
                  placeholder="Example: 100,000 units"
                  type="text"
                  value={values.estimatedAnnualVolume}
                />
                <ErrorMessage field="estimatedAnnualVolume" />
              </label>
            </div>

            <label className={`${labelClass} mt-5 block`}>
              Message
              <textarea
                className={`${fieldClass(errors.message)} min-h-36 resize-y`}
                name="message"
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Tell us about your product, target launch timing, formula needs, packaging expectations, or quote requirements."
                value={values.message}
              />
              <ErrorMessage field="message" />
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-zinc-600">
              Submissions are saved for review in Supabase with a pending
              status. Login and approval workflow screens can be added next.
            </p>
            <button
              disabled={isSubmitting}
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-sm bg-emerald-800 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSubmitting ? "Submitting..." : "Submit Access Request"}
            </button>
          </div>
        </form>

        <aside className="border border-zinc-200 bg-[#10251d] p-5 text-white sm:p-6 lg:p-8">
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-200 uppercase">
            Review process
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Controlled approval before quote entry
          </h2>
          <ol className="mt-6 space-y-4">
            {reviewSteps.map((step, index) => (
              <li
                key={step}
                className="flex gap-4 border-b border-white/15 pb-4 last:border-b-0 last:pb-0"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-white text-sm font-semibold text-zinc-950">
                  {index + 1}
                </span>
                <span className="pt-1 text-base text-zinc-100">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 border border-white/15 bg-white/5 p-4">
            <p className="text-sm leading-6 text-zinc-100">
              Approved customers receive access to the quote system after
              Gummynology reviews company details, manufacturing fit, and
              product scope.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
