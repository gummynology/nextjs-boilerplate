"use client";

import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import QuoteAccessShell, {
  getStoredCustomerContext,
} from "../_components/QuoteAccessShell";
import {
  CheckboxField,
  FieldLabel,
  QuoteSection,
  fieldClass,
} from "../_components/QuoteField";

const initialValues = {
  extract_type: "",
  solvent_type: "",
  alcohol_content: "",
  active_ingredients: "",
  concentration: "",
  flavoring: "",
  flavor_notes: "",
  bottle_type: "",
  bottle_size: "",
  count_per_unit: "",
  label_type: "",
  quantity: "",
  custom_formula: false,
  target_launch_date: "",
  notes: "",
};

type TinctureFormValues = typeof initialValues;

const extractOptions = ["Herbal", "Functional", "Custom"];
const solventOptions = ["Alcohol", "Glycerin", "Water", "Mixed"];
const flavoringOptions = ["Yes", "No", "Not Sure"];
const bottleTypeOptions = [
  "Dropper",
  "Pump",
  "Spray",
  "Standard Bottle",
  "Custom",
];
const bottleSizeOptions = ["30ml", "60ml", "120ml", "Custom"];
const labelOptions = ["Client Supplied", "Need Label Support", "Not Sure"];

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
    <FieldLabel label={label}>
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldLabel>
  );
}

export default function TinctureQuotePage() {
  const [values, setValues] = useState<TinctureFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function updateField<Key extends keyof TinctureFormValues>(
    field: Key,
    value: TinctureFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitError("");
    setSubmitted(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmitted(false);

    const supabase = getSupabaseClient();

    if (!supabase) {
      setSubmitError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable quote requests.",
      );
      return;
    }

    const { customerCompany, customerEmail } = getStoredCustomerContext();
    setIsSubmitting(true);

    const { error } = await supabase.from("quote_requests").insert({
      dosage_form: "tincture",
      customer_email: customerEmail,
      company_name: customerCompany,
      status: "new",
      module_data: {
        ...values,
        count_per_unit: Number(values.count_per_unit),
        quantity: Number(values.quantity),
      },
      created_at: new Date().toISOString(),
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setValues(initialValues);
    setSubmitted(true);
  }

  return (
    <QuoteAccessShell
      eyebrow="Tincture Quote Request"
      title="Tincture manufacturing details"
      description="Submit structured extract, formula, packaging, order, and timeline details for team review."
    >
      <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <form onSubmit={handleSubmit} className="grid gap-6">
          {submitted ? (
            <div className="border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-base font-semibold text-emerald-950">
                Your tincture quote request has been submitted. Our team will
                review and respond.
              </p>
            </div>
          ) : null}

          {submitError ? (
            <div className="border border-red-200 bg-red-50 p-4">
              <p className="text-base font-semibold text-red-900">
                {submitError}
              </p>
            </div>
          ) : null}

          <QuoteSection title="Product Basics">
            <SelectField
              label="Extract Type"
              value={values.extract_type}
              options={extractOptions}
              onChange={(value) => updateField("extract_type", value)}
            />
            <SelectField
              label="Solvent Type"
              value={values.solvent_type}
              options={solventOptions}
              onChange={(value) => updateField("solvent_type", value)}
            />
            <FieldLabel label="Alcohol Content">
              <input
                required
                type="text"
                value={values.alcohol_content}
                onChange={(event) =>
                  updateField("alcohol_content", event.target.value)
                }
                className={fieldClass}
              />
            </FieldLabel>
          </QuoteSection>

          <QuoteSection title="Formula">
            <FieldLabel label="Active Ingredients" fullWidth>
              <textarea
                required
                value={values.active_ingredients}
                onChange={(event) =>
                  updateField("active_ingredients", event.target.value)
                }
                className={`${fieldClass} min-h-32`}
              />
            </FieldLabel>
            <FieldLabel label="Concentration">
              <input
                required
                type="text"
                placeholder="1:2, 1:5, 500mg per serving"
                value={values.concentration}
                onChange={(event) =>
                  updateField("concentration", event.target.value)
                }
                className={fieldClass}
              />
            </FieldLabel>
            <SelectField
              label="Flavoring"
              value={values.flavoring}
              options={flavoringOptions}
              onChange={(value) => updateField("flavoring", value)}
            />
            <FieldLabel label="Flavor Notes" fullWidth>
              <textarea
                value={values.flavor_notes}
                onChange={(event) =>
                  updateField("flavor_notes", event.target.value)
                }
                className={`${fieldClass} min-h-28`}
              />
            </FieldLabel>
          </QuoteSection>

          <QuoteSection title="Packaging">
            <SelectField
              label="Bottle Type"
              value={values.bottle_type}
              options={bottleTypeOptions}
              onChange={(value) => updateField("bottle_type", value)}
            />
            <SelectField
              label="Bottle Size"
              value={values.bottle_size}
              options={bottleSizeOptions}
              onChange={(value) => updateField("bottle_size", value)}
            />
            <FieldLabel label="Count Per Unit">
              <input
                required
                min="1"
                type="number"
                value={values.count_per_unit}
                onChange={(event) =>
                  updateField("count_per_unit", event.target.value)
                }
                className={fieldClass}
              />
            </FieldLabel>
            <SelectField
              label="Label Type"
              value={values.label_type}
              options={labelOptions}
              onChange={(value) => updateField("label_type", value)}
            />
          </QuoteSection>

          <QuoteSection title="Order">
            <FieldLabel label="Quantity">
              <input
                required
                min="1"
                type="number"
                value={values.quantity}
                onChange={(event) =>
                  updateField("quantity", event.target.value)
                }
                className={fieldClass}
              />
            </FieldLabel>
            <FieldLabel label="Target Launch Date">
              <input
                required
                type="date"
                value={values.target_launch_date}
                onChange={(event) =>
                  updateField("target_launch_date", event.target.value)
                }
                className={fieldClass}
              />
            </FieldLabel>
            <CheckboxField
              label="Custom Formula"
              checked={values.custom_formula}
              onChange={(checked) => updateField("custom_formula", checked)}
            />
            <FieldLabel label="Notes" fullWidth>
              <textarea
                value={values.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className={`${fieldClass} min-h-28`}
              />
            </FieldLabel>
          </QuoteSection>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-14 w-full items-center justify-center rounded-sm bg-emerald-800 px-6 py-4 text-base font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-zinc-300 sm:w-auto"
          >
            {isSubmitting ? "Submitting..." : "Submit Tincture Quote Request"}
          </button>
        </form>
      </section>
    </QuoteAccessShell>
  );
}
