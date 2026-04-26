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
  shape: "",
  weight: "",
  base_type: "",
  active_ingredients: "",
  flavor: "",
  color: "",
  special_requests: "",
  packaging_type: "",
  count_per_unit: "",
  label_type: "",
  packaging_supplied_by_client: false,
  quantity: "",
  rush: false,
  custom_mold: false,
  target_launch_date: "",
  notes: "",
};

type GummiesFormValues = typeof initialValues;

const shapeOptions = ["Bear", "Drop", "Square", "Berry", "Coin", "Custom"];
const weightOptions = ["2.25g", "3g", "5g", "Custom"];
const baseTypeOptions = [
  "Pectin",
  "Gelatin",
  "Sugar Free",
  "Low Sugar",
  "Standard Sugar",
];
const packagingOptions = [
  "Bulk",
  "Bottle",
  "Stand-Up Pouch",
  "Sachet",
  "Stick Pack",
];
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

export default function GummiesQuotePage() {
  const [values, setValues] = useState<GummiesFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function updateField<Key extends keyof GummiesFormValues>(
    field: Key,
    value: GummiesFormValues[Key],
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
      dosage_form: "gummies",
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
      eyebrow="Gummies Quote Request"
      title="Gummy manufacturing details"
      description="Submit structured product, formula, packaging, order, and timeline details for team review."
    >
      <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <form onSubmit={handleSubmit} className="grid gap-6">
          {submitted ? (
            <div className="border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-base font-semibold text-emerald-950">
                Your gummy quote request has been submitted. Our team will
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
              label="Shape"
              value={values.shape}
              options={shapeOptions}
              onChange={(value) => updateField("shape", value)}
            />
            <SelectField
              label="Weight"
              value={values.weight}
              options={weightOptions}
              onChange={(value) => updateField("weight", value)}
            />
            <SelectField
              label="Base Type"
              value={values.base_type}
              options={baseTypeOptions}
              onChange={(value) => updateField("base_type", value)}
            />
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
            <FieldLabel label="Flavor">
              <input
                required
                type="text"
                value={values.flavor}
                onChange={(event) => updateField("flavor", event.target.value)}
                className={fieldClass}
              />
            </FieldLabel>
            <FieldLabel label="Color">
              <input
                required
                type="text"
                value={values.color}
                onChange={(event) => updateField("color", event.target.value)}
                className={fieldClass}
              />
            </FieldLabel>
            <FieldLabel label="Special Requests" fullWidth>
              <textarea
                value={values.special_requests}
                onChange={(event) =>
                  updateField("special_requests", event.target.value)
                }
                className={`${fieldClass} min-h-28`}
              />
            </FieldLabel>
          </QuoteSection>

          <QuoteSection title="Packaging">
            <SelectField
              label="Packaging Type"
              value={values.packaging_type}
              options={packagingOptions}
              onChange={(value) => updateField("packaging_type", value)}
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
            <CheckboxField
              label="Packaging Supplied by Client"
              checked={values.packaging_supplied_by_client}
              onChange={(checked) =>
                updateField("packaging_supplied_by_client", checked)
              }
            />
          </QuoteSection>

          <QuoteSection title="Order & Timeline">
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
              label="Rush Production"
              checked={values.rush}
              onChange={(checked) => updateField("rush", checked)}
              note="Rush production may add 10% surcharge and requires approval."
            />
            <CheckboxField
              label="Custom Mold"
              checked={values.custom_mold}
              onChange={(checked) => updateField("custom_mold", checked)}
              note="Custom mold may add 8+ weeks."
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
            {isSubmitting ? "Submitting..." : "Submit Gummy Quote Request"}
          </button>
        </form>
      </section>
    </QuoteAccessShell>
  );
}
