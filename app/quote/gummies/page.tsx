"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  findActiveIngredient,
  searchActiveIngredients,
  uniqueActiveIngredients,
  type ActiveIngredientDefinition,
  type IngredientUnit,
} from "@/lib/activeIngredients";
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

type ActiveIngredient = {
  id: string;
  ingredient_name: string;
  amount_per_serving: string;
  unit: IngredientUnit;
  customer_supplied: "yes" | "no";
  notes: string;
};

type IngredientCostInput = Omit<ActiveIngredient, "id"> | ActiveIngredient;

const createIngredient = (): ActiveIngredient => ({
  id: crypto.randomUUID(),
  ingredient_name: "",
  amount_per_serving: "",
  unit: "mg",
  customer_supplied: "no",
  notes: "",
});

const initialValues = {
  product_name: "",
  project_name: "",
  shape: "",
  gummy_weight: "",
  base_type: "",
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
const weightOptionsByShape: Record<string, string[]> = {
  Bear: ["2.25g", "3g"],
  Drop: ["2.5g"],
  Square: ["3g", "3.5g", "4g"],
  Berry: ["3g"],
  Coin: ["5g", "5.5g", "6g", "6.5g", "7g"],
  Custom: ["Custom"],
};
const baseTypeOptions = ["Pectin", "Sugar Free Pectin", "Low Sugar Pectin"];
const flavorOptions = [
  "Mixed Berry",
  "Strawberry",
  "Raspberry",
  "Blueberry",
  "Orange",
  "Lemon",
  "Mango",
  "Watermelon",
  "Peach",
  "Green Apple",
  "Custom",
];
const colorOptions = [
  "Natural Red",
  "Natural Orange",
  "Natural Yellow",
  "Green",
  "Blue/Purple",
  "No Color",
  "Custom",
];
const packagingOptions = [
  "Bulk",
  "Bottle",
  "Stand-Up Pouch",
  "Sachet",
  "Stick Pack",
];
const labelOptions = ["Client Supplied", "Need Label Support", "Not Sure"];
const difficultIngredientTerms = [
  "magnesium",
  "calcium",
  "iron",
  "zinc",
  "mineral",
  "oil",
  "dha",
  "epa",
  "omega",
  "probiotic",
  "enzyme",
  "unstable",
  "curcumin",
  "cbd",
  "cannabinoid",
  "fat soluble",
  "oil-soluble",
];

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <p className="text-sm font-semibold text-zinc-800">{label}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const isSelected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`min-h-12 rounded-sm border px-4 py-3 text-left text-sm font-semibold transition ${
                isSelected
                  ? "border-emerald-800 bg-emerald-800 text-white"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-emerald-800 hover:bg-emerald-50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <FieldLabel label={label}>
      <select
        required
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldLabel>
  );
}

function IngredientSearchField({
  ingredient,
  selectedNames,
  onCustomChange,
  onSelectIngredient,
}: {
  ingredient: ActiveIngredient;
  selectedNames: string[];
  onCustomChange: (value: string) => void;
  onSelectIngredient: (definition: ActiveIngredientDefinition) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const query = ingredient.ingredient_name;
  const results = searchActiveIngredients(query);
  const matchedIngredient = findActiveIngredient(query);
  const normalizedSelectedNames = selectedNames.map((name) =>
    findActiveIngredient(name)?.name.toLowerCase(),
  );
  const typedValueCanBeCustom =
    query.trim() && !matchedIngredient && results.length === 0;

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <input
        type="text"
        value={ingredient.ingredient_name}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          onCustomChange(event.target.value);
          setIsOpen(true);
        }}
        className={fieldClass}
        placeholder="Search ingredient, alias, or category"
        autoComplete="off"
      />

      {isOpen ? (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto border border-zinc-300 bg-white shadow-lg">
          {results.map((definition) => {
            const isAlreadyAdded =
              definition.name.toLowerCase() !==
                matchedIngredient?.name.toLowerCase() &&
              normalizedSelectedNames.includes(definition.name.toLowerCase());

            return (
              <button
                key={definition.name}
                type="button"
                disabled={isAlreadyAdded}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (isAlreadyAdded) {
                    return;
                  }

                  onSelectIngredient(definition);
                  setIsOpen(false);
                }}
                className={`block w-full border-b border-zinc-100 px-3 py-3 text-left transition last:border-b-0 ${
                  isAlreadyAdded
                    ? "cursor-not-allowed bg-zinc-50 text-zinc-400"
                    : "bg-white text-zinc-900 hover:bg-emerald-50"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {definition.name}
                  {isAlreadyAdded ? (
                    <span className="ml-2 text-xs font-semibold text-zinc-500">
                      Already added
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {definition.category} | {definition.common_dose_min}
                  -{definition.common_dose_max} {definition.unit} | $
                  {definition.bulk_price_usd_per_kg}/kg est.
                </span>
              </button>
            );
          })}

          {typedValueCanBeCustom ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsOpen(false)}
              className="block w-full border-b border-zinc-100 px-3 py-3 text-left text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
            >
              Add custom ingredient: "{query.trim()}"
            </button>
          ) : null}

          {results.length === 0 && !typedValueCanBeCustom ? (
            <div className="px-3 py-3 text-sm text-zinc-500">
              No library match found.
            </div>
          ) : null}

          <div className="sticky bottom-0 border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500">
            Showing {results.length} of {uniqueActiveIngredients.length}{" "}
            ingredients
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toMg(ingredient: IngredientCostInput) {
  const amount = Number(ingredient.amount_per_serving);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (ingredient.unit === "mg") {
    return amount;
  }

  if (ingredient.unit === "mcg") {
    return amount / 1000;
  }

  if (ingredient.unit === "g") {
    return amount * 1000;
  }

  return null;
}

function formatMg(value: number | null) {
  if (value === null) {
    return "Not enough mg-based data";
  }

  return `${Number(value.toFixed(value >= 10 ? 0 : 2))} mg`;
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Not enough priced mg-based data";
  }

  if (value === 0) {
    return "$0.00";
  }

  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }

  return `$${value.toFixed(2)}`;
}

function getIngredientCostPerServing(ingredient: IngredientCostInput) {
  const definition = findActiveIngredient(ingredient.ingredient_name);
  const amountMg = toMg(ingredient);

  if (!definition || amountMg === null) {
    return null;
  }

  if (ingredient.customer_supplied === "yes") {
    return 0;
  }

  return (amountMg / 1_000_000) * definition.bulk_price_usd_per_kg;
}

function containsDifficultTerms(ingredients: ActiveIngredient[], notes: string) {
  const searchable = [
    ...ingredients.map(
      (ingredient) => `${ingredient.ingredient_name} ${ingredient.notes}`,
    ),
    notes,
  ]
    .join(" ")
    .toLowerCase();

  return difficultIngredientTerms.some((term) => searchable.includes(term));
}

function getIngredientReviewData(ingredients: ActiveIngredient[]) {
  const matches = ingredients
    .map((ingredient) => {
      const definition = findActiveIngredient(ingredient.ingredient_name);

      if (!definition) {
        return null;
      }

      return {
        entered_name: ingredient.ingredient_name.trim(),
        matched_name: definition.name,
        category: definition.category,
        gummy_suitability: definition.gummy_suitability,
        taste_risk: definition.taste_risk,
        heat_sensitivity: definition.heat_sensitivity,
        oil_soluble: definition.oil_soluble,
        mineral_heavy: definition.mineral_heavy,
        requires_rd_review: definition.requires_rd_review,
        regulatory_review_required:
          definition.regulatory_review_required === true,
        bulk_price_usd_per_kg: definition.bulk_price_usd_per_kg,
        estimated_raw_cost_per_serving:
          getIngredientCostPerServing(ingredient),
        notes: definition.notes,
      };
    })
    .filter((match) => match !== null);

  return {
    matched_ingredient_flags: matches,
    requires_rd_review: matches.some((match) => match.requires_rd_review),
    regulatory_review_required: matches.some(
      (match) => match.regulatory_review_required,
    ),
    automatic_quote_approval_eligible: !matches.some(
      (match) => match.regulatory_review_required,
    ),
    mineral_heavy: matches.some((match) => match.mineral_heavy),
    oil_soluble: matches.some((match) => match.oil_soluble),
    high_heat_sensitivity: matches.some(
      (match) => match.heat_sensitivity === "high",
    ),
  };
}

function buildPreview(values: GummiesFormValues, ingredients: ActiveIngredient[]) {
  const convertedAmounts = ingredients.map(toMg).filter((amount) => amount !== null);
  const hasUnconvertedAmounts = ingredients.some(
    (ingredient) => ingredient.amount_per_serving && toMg(ingredient) === null,
  );
  const totalActiveMgPerServing =
    convertedAmounts.length > 0
      ? convertedAmounts.reduce((total, amount) => total + amount, 0)
      : null;
  const recommendedServingSize =
    totalActiveMgPerServing === null
      ? "1 gummy"
      : totalActiveMgPerServing <= 250
        ? "1 gummy"
        : totalActiveMgPerServing <= 500
          ? "2 gummies"
          : totalActiveMgPerServing <= 750
            ? "3 gummies"
            : "4+ gummies";
  const servingDivisor =
    recommendedServingSize === "1 gummy"
      ? 1
      : recommendedServingSize === "2 gummies"
        ? 2
        : recommendedServingSize === "3 gummies"
          ? 3
          : 4;
  const activeMgPerGummy =
    totalActiveMgPerServing === null
      ? null
      : totalActiveMgPerServing / servingDivisor;
  const ingredientCostLines = ingredients
    .filter(
      (ingredient) =>
        ingredient.ingredient_name.trim() ||
        ingredient.amount_per_serving.trim(),
    )
    .map((ingredient) => {
      const definition = findActiveIngredient(ingredient.ingredient_name);
      const amountMg = toMg(ingredient);
      const costPerServing = getIngredientCostPerServing(ingredient);

      return {
        ingredient_name: ingredient.ingredient_name.trim(),
        matched_ingredient_name: definition?.name ?? null,
        customer_supplied: ingredient.customer_supplied,
        amount_per_serving: ingredient.amount_per_serving,
        unit: ingredient.unit,
        bulk_price_usd_per_kg: definition?.bulk_price_usd_per_kg ?? null,
        amount_mg_equivalent: amountMg,
        estimated_raw_cost_per_serving: costPerServing,
        estimated_raw_cost_per_gummy:
          costPerServing === null ? null : costPerServing / servingDivisor,
        pricing_note:
          ingredient.customer_supplied === "yes"
            ? "Customer-supplied ingredient excluded from raw material cost."
            : definition && amountMg !== null
              ? "Estimated bulk ingredient cost only. Does not include overage, waste, freight, testing, labor, packaging, margin, or final procurement pricing."
              : "Cost not calculated because the ingredient is custom, unmatched, IU-based, CFU-based, or missing mg-equivalent data.",
      };
    });
  const pricedIngredientCostLines = ingredientCostLines.filter(
    (line) => line.estimated_raw_cost_per_serving !== null,
  );
  const totalRawActiveCostPerServing =
    pricedIngredientCostLines.length > 0
      ? pricedIngredientCostLines.reduce(
          (total, line) =>
            total + (line.estimated_raw_cost_per_serving ?? 0),
          0,
        )
      : null;
  const totalRawActiveCostPerGummy =
    totalRawActiveCostPerServing === null
      ? null
      : totalRawActiveCostPerServing / servingDivisor;
  const countPerUnit = Number(values.count_per_unit);
  const quantity = Number(values.quantity);
  const estimatedRawActiveCostPerUnit =
    totalRawActiveCostPerGummy !== null &&
    Number.isFinite(countPerUnit) &&
    countPerUnit > 0
      ? totalRawActiveCostPerGummy * countPerUnit
      : null;
  const estimatedRawActiveCostForOrder =
    estimatedRawActiveCostPerUnit !== null &&
    Number.isFinite(quantity) &&
    quantity > 0
      ? estimatedRawActiveCostPerUnit * quantity
      : null;
  const hasUnpricedIngredientCosts = ingredientCostLines.some(
    (line) => line.estimated_raw_cost_per_serving === null,
  );
  const isLowOrSugarFree =
    values.base_type === "Low Sugar Pectin" ||
    values.base_type === "Sugar Free Pectin";
  const ingredientReview = getIngredientReviewData(ingredients);
  const hasDifficultActives =
    containsDifficultTerms(ingredients, values.notes) ||
    ingredientReview.requires_rd_review ||
    ingredientReview.mineral_heavy ||
    ingredientReview.oil_soluble ||
    ingredientReview.high_heat_sensitivity;
  const isHighActiveLoad =
    activeMgPerGummy !== null ? activeMgPerGummy > 250 : false;
  const isVeryHighActiveLoad =
    totalActiveMgPerServing !== null ? totalActiveMgPerServing > 750 : false;
  const hasCustomSelections =
    values.shape === "Custom" ||
    values.gummy_weight === "Custom" ||
    values.flavor === "Custom" ||
    values.color === "Custom" ||
    values.custom_mold;

  const pectinRecommendation =
    isVeryHighActiveLoad ||
    hasDifficultActives ||
    (activeMgPerGummy !== null && activeMgPerGummy > 500)
      ? "LMA Pectin / R&D review"
      : isLowOrSugarFree || isHighActiveLoad
        ? "LM Pectin"
        : "HM Pectin";
  const pectinReason =
    pectinRecommendation === "HM Pectin"
      ? "Standard sugar gummy profile with lower active load."
      : pectinRecommendation === "LM Pectin"
        ? "Recommended for low sugar, sugar-free, or moderate active-load systems."
        : "Recommended for high complexity, mineral-sensitive, calcium-sensitive, or sugar-free systems requiring R&D review.";

  const rdRequired =
    ingredientReview.regulatory_review_required ||
    isVeryHighActiveLoad ||
    hasDifficultActives ||
    values.special_requests.toLowerCase().includes("custom formulation");
  const rdReviewLikely =
    !rdRequired &&
    (hasCustomSelections ||
      isLowOrSugarFree ||
      isHighActiveLoad ||
      ingredients.some((ingredient) => ingredient.customer_supplied === "yes"));
  const rdRequirement = rdRequired
    ? "R&D required"
    : rdReviewLikely
      ? "R&D review likely"
      : "No R&D likely";
  const rdReason =
    ingredientReview.regulatory_review_required
      ? "Manual regulatory review required. Not eligible for automatic quote approval."
      : rdRequirement === "No R&D likely"
        ? "Standard flavor, color, pectin base, and low active load appear feasible for standard review."
        : rdRequirement === "R&D review likely"
          ? "Custom selections, sugar profile, customer-supplied actives, or moderate active load should be reviewed before quote finalization."
          : "Very high load, mineral-heavy, oil-soluble, unstable, difficult, or custom-formulation inputs require technical review.";
  const leadTimeNote = values.custom_mold
    ? "Custom mold projects may add 8+ weeks before production timing can be finalized."
    : rdRequired || rdReviewLikely
      ? "R&D review may extend development timing before production scheduling."
      : "Standard gummy projects can move to quote review after formula and packaging confirmation.";
  const rushSurchargeNote = values.rush
    ? "Rush production may add a 10% surcharge and requires schedule approval."
    : "Rush production not selected.";
  const customMoldLeadTimeNote = values.custom_mold
    ? "Custom mold selected. Add 8+ weeks for mold development and approval."
    : "Standard shape or existing mold selected.";

  return {
    recommended_serving_size: recommendedServingSize,
    total_active_mg_per_serving: totalActiveMgPerServing,
    has_unconverted_active_amounts: hasUnconvertedAmounts,
    active_mg_per_gummy: activeMgPerGummy,
    ingredient_cost_lines: ingredientCostLines,
    total_raw_active_cost_per_serving: totalRawActiveCostPerServing,
    estimated_raw_active_cost_per_gummy: totalRawActiveCostPerGummy,
    estimated_raw_active_cost_per_unit: estimatedRawActiveCostPerUnit,
    estimated_raw_active_cost_for_order: estimatedRawActiveCostForOrder,
    has_unpriced_ingredient_costs: hasUnpricedIngredientCosts,
    pricing_basis:
      "Estimated bulk active ingredient cost only. Not a final customer quote and excludes overage, yield loss, freight, testing, labor, packaging, margin, taxes, and current procurement confirmation.",
    pectin_recommendation: pectinRecommendation,
    pectin_reason: pectinReason,
    rd_requirement: rdRequirement,
    rd_reason: rdReason,
    estimated_lead_time_note: leadTimeNote,
    rush_surcharge_note: rushSurchargeNote,
    custom_mold_lead_time_note: customMoldLeadTimeNote,
    regulatory_review_required: ingredientReview.regulatory_review_required,
    regulatory_review_note: ingredientReview.regulatory_review_required
      ? "Manual regulatory review required. Not eligible for automatic quote approval."
      : "No restricted ingredient match detected.",
    automatic_quote_approval_eligible:
      ingredientReview.automatic_quote_approval_eligible,
    matched_ingredient_flags: ingredientReview.matched_ingredient_flags,
    technical_review_required:
      rdRequired || recommendedServingSize === "4+ gummies",
  };
}

export default function GummiesQuotePage() {
  const [values, setValues] = useState<GummiesFormValues>(initialValues);
  const [ingredients, setIngredients] = useState<ActiveIngredient[]>([
    createIngredient(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const preview = useMemo(
    () => buildPreview(values, ingredients),
    [values, ingredients],
  );
  const availableWeightOptions = values.shape
    ? (weightOptionsByShape[values.shape] ?? ["Custom"])
    : [];

  function updateField<Key extends keyof GummiesFormValues>(
    field: Key,
    value: GummiesFormValues[Key],
  ) {
    setValues((current) => {
      if (field === "shape" && typeof value === "string") {
        const nextWeights = weightOptionsByShape[value] ?? ["Custom"];
        const nextWeight = nextWeights.includes(current.gummy_weight)
          ? current.gummy_weight
          : "";

        return { ...current, shape: value, gummy_weight: nextWeight };
      }

      return { ...current, [field]: value };
    });
    setSubmitError("");
    setSubmitted(false);
  }

  function updateIngredient<Key extends keyof ActiveIngredient>(
    id: string,
    field: Key,
    value: ActiveIngredient[Key],
  ) {
    setIngredients((current) =>
      current.map((ingredient) => {
        if (ingredient.id !== id) {
          return ingredient;
        }

        if (field === "ingredient_name" && typeof value === "string") {
          const definition = findActiveIngredient(value);

          if (definition) {
            return {
              ...ingredient,
              ingredient_name: definition.name,
              amount_per_serving:
                ingredient.amount_per_serving ||
                String(definition.default_dose),
              unit: definition.unit,
              notes: ingredient.notes || definition.notes,
            };
          }
        }

        return { ...ingredient, [field]: value };
      }),
    );
    setSubmitError("");
    setSubmitted(false);
  }

  function addIngredient() {
    setIngredients((current) => [...current, createIngredient()]);
  }

  function removeIngredient(id: string) {
    setIngredients((current) =>
      current.length === 1
        ? current
        : current.filter((ingredient) => ingredient.id !== id),
    );
  }

  function validate() {
    const requiredFields: Array<keyof GummiesFormValues> = [
      "product_name",
      "project_name",
      "shape",
      "gummy_weight",
      "base_type",
      "flavor",
      "color",
      "packaging_type",
      "count_per_unit",
      "label_type",
      "quantity",
      "target_launch_date",
    ];

    const missingField = requiredFields.find((field) => {
      const value = values[field];
      return typeof value === "string" && !value.trim();
    });

    if (missingField) {
      return "Please complete all required product, packaging, and timeline fields.";
    }

    const hasIngredient = ingredients.some(
      (ingredient) =>
        ingredient.ingredient_name.trim() &&
        ingredient.amount_per_serving.trim(),
    );

    if (!hasIngredient) {
      return "Add at least one active ingredient with an amount per serving.";
    }

    const canonicalIngredientNames = ingredients
      .map((ingredient) =>
        findActiveIngredient(ingredient.ingredient_name)?.name.toLowerCase(),
      )
      .filter((name): name is string => Boolean(name));

    if (
      new Set(canonicalIngredientNames).size !== canonicalIngredientNames.length
    ) {
      return "Each active ingredient can only be added once.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmitted(false);

    const validationError = validate();

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      setSubmitError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable quote requests.",
      );
      return;
    }

    const { customerCompany, customerEmail } = getStoredCustomerContext();
    setIsSubmitting(true);

    const normalizedIngredients = ingredients
      .filter(
        (ingredient) =>
          ingredient.ingredient_name.trim() ||
          ingredient.amount_per_serving.trim() ||
          ingredient.notes.trim(),
      )
      .map(({ id: _id, ...ingredient }) => ({
        ...ingredient,
        ingredient_name: ingredient.ingredient_name.trim(),
        amount_per_serving: ingredient.amount_per_serving.trim(),
        notes: ingredient.notes.trim(),
      }))
      .map((ingredient) => {
        const definition = findActiveIngredient(ingredient.ingredient_name);

        return {
          ...ingredient,
          matched_ingredient_name: definition?.name ?? null,
          category: definition?.category ?? null,
          gummy_suitability: definition?.gummy_suitability ?? null,
          taste_risk: definition?.taste_risk ?? null,
          heat_sensitivity: definition?.heat_sensitivity ?? null,
          oil_soluble: definition?.oil_soluble ?? false,
          mineral_heavy: definition?.mineral_heavy ?? false,
          requires_rd_review: definition?.requires_rd_review ?? false,
          regulatory_review_required:
            definition?.regulatory_review_required === true,
          bulk_price_usd_per_kg: definition?.bulk_price_usd_per_kg ?? null,
          estimated_raw_cost_per_serving:
            getIngredientCostPerServing(ingredient),
          estimated_raw_cost_per_gummy:
            getIngredientCostPerServing(ingredient) === null
              ? null
              : getIngredientCostPerServing(ingredient)! /
                (preview.recommended_serving_size === "1 gummy"
                  ? 1
                  : preview.recommended_serving_size === "2 gummies"
                    ? 2
                    : preview.recommended_serving_size === "3 gummies"
                      ? 3
                      : 4),
          ingredient_library_notes: definition?.notes ?? null,
        };
      });

    const { error } = await supabase.from("quote_requests").insert({
      dosage_form: "gummies",
      product_name: values.product_name.trim(),
      project_name: values.project_name.trim(),
      customer_email: customerEmail,
      company_name: customerCompany,
      status: "new",
      module_data: {
        ...values,
        product_name: values.product_name.trim(),
        project_name: values.project_name.trim(),
        count_per_unit: Number(values.count_per_unit),
        quantity: Number(values.quantity),
        active_ingredients: normalizedIngredients,
        active_ingredient_review: getIngredientReviewData(ingredients),
        feasibility_preview: preview,
      },
      created_at: new Date().toISOString(),
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setValues(initialValues);
    setIngredients([createIngredient()]);
    setSubmitted(true);
  }

  return (
    <QuoteAccessShell
      eyebrow="Gummy Configurator v2"
      title="Configure a gummy quote request"
      description="Build a structured gummy concept, review feasibility signals, and submit the configuration for technical and commercial review."
    >
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_0.42fr] lg:px-10 lg:py-14">
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
            <FieldLabel label="Product Name">
              <input
                required
                type="text"
                value={values.product_name}
                onChange={(event) =>
                  updateField("product_name", event.target.value)
                }
                className={fieldClass}
                placeholder="Example: Sleep Support Gummy"
              />
            </FieldLabel>
            <FieldLabel label="Project Name">
              <input
                required
                type="text"
                value={values.project_name}
                onChange={(event) =>
                  updateField("project_name", event.target.value)
                }
                className={fieldClass}
                placeholder="Internal launch or customer project name"
              />
            </FieldLabel>
            <SelectField
              label="Shape"
              value={values.shape}
              options={shapeOptions}
              onChange={(value) => updateField("shape", value)}
            />
            <SelectField
              label="Gummy Weight"
              value={values.gummy_weight}
              options={availableWeightOptions}
              disabled={!values.shape}
              placeholder={
                values.shape ? "Select gummy weight" : "Select shape first"
              }
              onChange={(value) => updateField("gummy_weight", value)}
            />
            <OptionGroup
              label="Base Type"
              value={values.base_type}
              options={baseTypeOptions}
              onChange={(value) => updateField("base_type", value)}
            />
          </QuoteSection>

          <QuoteSection title="Flavor and Color">
            <SelectField
              label="Flavor"
              value={values.flavor}
              options={flavorOptions}
              onChange={(value) => updateField("flavor", value)}
            />
            <SelectField
              label="Color"
              value={values.color}
              options={colorOptions}
              onChange={(value) => updateField("color", value)}
            />
            <FieldLabel label="Special Requests" fullWidth>
              <textarea
                value={values.special_requests}
                onChange={(event) =>
                  updateField("special_requests", event.target.value)
                }
                className={`${fieldClass} min-h-28`}
                placeholder="Custom flavor profile, color target, texture expectations, allergen considerations, or formula notes."
              />
            </FieldLabel>
          </QuoteSection>

          <QuoteSection title="Active Ingredient Builder">
            <div className="sm:col-span-2">
              <div className="hidden gap-3 border-b border-zinc-200 pb-2 text-xs font-semibold tracking-[0.12em] text-zinc-500 uppercase lg:grid lg:grid-cols-[1.25fr_0.72fr_0.52fr_0.72fr_1.35fr_0.45fr]">
                <span>Ingredient</span>
                <span>Amount</span>
                <span>Unit</span>
                <span>Supplied</span>
                <span>Notes</span>
                <span>Action</span>
              </div>
              <div className="mt-3 grid gap-3">
                {ingredients.map((ingredient, index) => {
                  const matchedIngredient = findActiveIngredient(
                    ingredient.ingredient_name,
                  );

                  return (
                    <div
                      key={ingredient.id}
                      className="border border-zinc-200 bg-zinc-50 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
                        <h3 className="text-sm font-semibold text-zinc-950">
                          Ingredient {index + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeIngredient(ingredient.id)}
                          disabled={ingredients.length === 1}
                          className="inline-flex min-h-10 items-center justify-center rounded-sm border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.72fr_0.52fr_0.72fr_1.35fr_0.45fr] lg:items-end">
                        <label>
                          <span className="text-xs font-semibold text-zinc-700 lg:hidden">
                            Ingredient
                          </span>
                          <IngredientSearchField
                            ingredient={ingredient}
                            selectedNames={ingredients
                              .filter((item) => item.id !== ingredient.id)
                              .map((item) => item.ingredient_name)}
                            onCustomChange={(value) =>
                              updateIngredient(
                                ingredient.id,
                                "ingredient_name",
                                value,
                              )
                            }
                            onSelectIngredient={(definition) => {
                              setIngredients((current) =>
                                current.map((item) =>
                                  item.id === ingredient.id
                                    ? {
                                        ...item,
                                        ingredient_name: definition.name,
                                        amount_per_serving:
                                          item.amount_per_serving ||
                                          String(definition.default_dose),
                                        unit: definition.unit,
                                        notes: item.notes || definition.notes,
                                      }
                                    : item,
                                ),
                              );
                              setSubmitError("");
                              setSubmitted(false);
                            }}
                          />
                        </label>
                        <label>
                          <span className="text-xs font-semibold text-zinc-700 lg:hidden">
                            Amount
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={ingredient.amount_per_serving}
                            onChange={(event) =>
                              updateIngredient(
                                ingredient.id,
                                "amount_per_serving",
                                event.target.value,
                              )
                            }
                            className={fieldClass}
                            placeholder="100"
                          />
                        </label>
                        <label>
                          <span className="text-xs font-semibold text-zinc-700 lg:hidden">
                            Unit
                          </span>
                          <select
                            value={ingredient.unit}
                            onChange={(event) =>
                              updateIngredient(
                                ingredient.id,
                                "unit",
                                event.target.value as ActiveIngredient["unit"],
                              )
                            }
                            className={fieldClass}
                          >
                            <option value="mg">mg</option>
                            <option value="mcg">mcg</option>
                            <option value="g">g</option>
                            <option value="IU">IU</option>
                            <option value="billion CFU">billion CFU</option>
                          </select>
                        </label>
                        <label>
                          <span className="text-xs font-semibold text-zinc-700 lg:hidden">
                            Supplied
                          </span>
                          <select
                            value={ingredient.customer_supplied}
                            onChange={(event) =>
                              updateIngredient(
                                ingredient.id,
                                "customer_supplied",
                                event.target
                                  .value as ActiveIngredient["customer_supplied"],
                              )
                            }
                            className={fieldClass}
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </label>
                        <label className="sm:col-span-2 lg:col-span-1">
                          <span className="text-xs font-semibold text-zinc-700 lg:hidden">
                            Notes
                          </span>
                          <input
                            type="text"
                            value={ingredient.notes}
                            onChange={(event) =>
                              updateIngredient(
                                ingredient.id,
                                "notes",
                                event.target.value,
                              )
                            }
                            className={fieldClass}
                            placeholder="Source, taste, solubility, stability"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeIngredient(ingredient.id)}
                          disabled={ingredients.length === 1}
                          className="hidden min-h-12 items-center justify-center rounded-sm border border-zinc-300 bg-white px-3 py-3 text-sm font-semibold text-zinc-800 transition hover:border-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40 lg:inline-flex"
                        >
                          Remove
                        </button>
                      </div>
                      {matchedIngredient ? (
                        <div
                          className={`mt-3 border p-3 text-xs leading-5 ${
                            matchedIngredient.regulatory_review_required
                              ? "border-red-200 bg-red-50 text-red-900"
                              : "border-zinc-200 bg-white text-zinc-600"
                          }`}
                        >
                          <span className="font-semibold text-zinc-900">
                            {matchedIngredient.name}
                          </span>
                          {" | "}
                          {matchedIngredient.category}
                          {" | "}
                          {matchedIngredient.notes}
                          {matchedIngredient.regulatory_review_required ? (
                            <span className="mt-1 block font-semibold">
                              Manual regulatory review required. Not eligible
                              for automatic quote approval.
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-sm border border-emerald-800 bg-white px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
              >
                Add Active Ingredient
              </button>
            </div>
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

          <QuoteSection title="Order and Timeline">
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
                placeholder="Timeline requirements, known formulation concerns, target market, or technical questions."
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

        <aside className="h-fit border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6 lg:p-8">
          <p className="text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
            Feasibility Preview
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-zinc-950">
            Technical signals
          </h2>
          <div className="mt-6 grid gap-4">
            <PreviewItem
              label="Estimated Raw Active Cost Per Gummy"
              value={formatCurrency(
                preview.estimated_raw_active_cost_per_gummy,
              )}
              note={
                preview.has_unpriced_ingredient_costs
                  ? "Some custom, IU-based, CFU-based, unmatched, or customer-supplied ingredients are not included."
                  : preview.pricing_basis
              }
            />
            <PreviewItem
              label="Estimated Raw Active Cost Per Unit"
              value={formatCurrency(preview.estimated_raw_active_cost_per_unit)}
              note="Uses count per unit when available. This is active raw material only, not finished goods pricing."
            />
            <PreviewItem
              label="Estimated Raw Active Cost For Order"
              value={formatCurrency(
                preview.estimated_raw_active_cost_for_order,
              )}
              note="Uses quantity and count per unit when available. Final quote still requires purchasing and production review."
            />
            <PreviewItem
              label="Recommended Serving Size"
              value={preview.recommended_serving_size}
            />
            <PreviewItem
              label="Total Active Load Per Serving"
              value={formatMg(preview.total_active_mg_per_serving)}
              note={
                preview.has_unconverted_active_amounts
                  ? "Some IU-based values are not converted into mg."
                  : undefined
              }
            />
            <PreviewItem
              label="Estimated Active Load Per Gummy"
              value={formatMg(preview.active_mg_per_gummy)}
            />
            <PreviewItem
              label="Pectin Recommendation"
              value={preview.pectin_recommendation}
              note={preview.pectin_reason}
            />
            <PreviewItem
              label="R&D Requirement"
              value={preview.rd_requirement}
              note={preview.rd_reason}
            />
            <PreviewItem
              label="Regulatory Review"
              value={
                preview.regulatory_review_required
                  ? "Required"
                  : "No restricted ingredient match"
              }
              note={preview.regulatory_review_note}
            />
            <PreviewItem
              label="Estimated Lead Time Note"
              value={preview.estimated_lead_time_note}
            />
            <PreviewItem
              label="Rush Surcharge Note"
              value={preview.rush_surcharge_note}
            />
            <PreviewItem
              label="Custom Mold Lead Time Note"
              value={preview.custom_mold_lead_time_note}
            />
          </div>
        </aside>
      </section>
    </QuoteAccessShell>
  );
}

function PreviewItem({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold leading-6 text-zinc-950">
        {value}
      </p>
      {note ? <p className="mt-2 text-sm leading-6 text-zinc-600">{note}</p> : null}
    </div>
  );
}
