"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  findActiveIngredient,
  getUniqueActiveIngredients,
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

type IngredientPrice = {
  name: string;
  price_per_kg_usd: number | null;
  price_confidence: "estimated" | "internal" | "needs_vendor_quote" | string;
  notes: string | null;
};

type IngredientPriceMap = Record<string, IngredientPrice>;

type SupabaseIngredientRow = {
  name: string;
  aliases: string[] | null;
  category: string | null;
  common_dose_min: number | null;
  common_dose_max: number | null;
  unit: IngredientUnit | string | null;
  default_dose: number | null;
  gummy_suitability: string | null;
  taste_risk: string | null;
  heat_sensitivity: string | null;
  oil_soluble: boolean | null;
  mineral_heavy: boolean | null;
  requires_rd_review: boolean | null;
  regulatory_review_required: boolean | null;
  notes: string | null;
};

const createIngredient = (): ActiveIngredient => ({
  id: crypto.randomUUID(),
  ingredient_name: "",
  amount_per_serving: "",
  unit: "mg",
  customer_supplied: "no",
  notes: "",
});

function normalizeSupabaseIngredient(
  row: SupabaseIngredientRow,
): ActiveIngredientDefinition {
  return {
    name: String(row.name),
    aliases: Array.isArray(row.aliases) ? row.aliases.map(String) : [],
    category: row.category || "Uncategorized",
    common_dose_min: Number(row.common_dose_min ?? 0),
    common_dose_max: Number(row.common_dose_max ?? 0),
    unit: (row.unit || "mg") as IngredientUnit,
    default_dose: Number(row.default_dose ?? row.common_dose_min ?? 0),
    gummy_suitability:
      row.gummy_suitability === "low" ||
      row.gummy_suitability === "medium" ||
      row.gummy_suitability === "high" ||
      row.gummy_suitability === "restricted"
        ? row.gummy_suitability
        : "medium",
    taste_risk:
      row.taste_risk === "low" ||
      row.taste_risk === "medium" ||
      row.taste_risk === "high"
        ? row.taste_risk
        : "medium",
    heat_sensitivity:
      row.heat_sensitivity === "low" ||
      row.heat_sensitivity === "medium" ||
      row.heat_sensitivity === "high"
        ? row.heat_sensitivity
        : "medium",
    oil_soluble: row.oil_soluble === true,
    mineral_heavy: row.mineral_heavy === true,
    requires_rd_review: row.requires_rd_review === true,
    regulatory_review_required: row.regulatory_review_required === true,
    notes: row.notes || "",
  };
}

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
const baseSystemEstimates: Record<
  string,
  { multiplier: number; pectin_component_usd_per_kg: number }
> = {
  Pectin: { multiplier: 1, pectin_component_usd_per_kg: 15 },
  "Low Sugar Pectin": { multiplier: 1.08, pectin_component_usd_per_kg: 22 },
  "Sugar Free Pectin": {
    multiplier: 1.15,
    pectin_component_usd_per_kg: 22,
  },
};
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
  required = false,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="sm:col-span-2">
      <p className="text-sm font-semibold text-zinc-800">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </p>
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
  required = true,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <FieldLabel label={label} required={required}>
      <select
        required={required}
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
  ingredientDefinitions,
  selectedNames,
  onCustomChange,
  onSelectIngredient,
}: {
  ingredient: ActiveIngredient;
  ingredientDefinitions: ActiveIngredientDefinition[];
  selectedNames: string[];
  onCustomChange: (value: string) => void;
  onSelectIngredient: (definition: ActiveIngredientDefinition) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const query = ingredient.ingredient_name;
  const uniqueIngredients = getUniqueActiveIngredients(ingredientDefinitions);
  const results = searchActiveIngredients(query, uniqueIngredients);
  const matchedIngredient = findActiveIngredient(query, uniqueIngredients);
  const normalizedSelectedNames = selectedNames.map((name) =>
    findActiveIngredient(name, uniqueIngredients)?.name.toLowerCase(),
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
                  -{definition.common_dose_max} {definition.unit}
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
              Add custom ingredient: {query.trim()}
            </button>
          ) : null}

          {results.length === 0 && !typedValueCanBeCustom ? (
            <div className="px-3 py-3 text-sm text-zinc-500">
              No library match found.
            </div>
          ) : null}

          <div className="sticky bottom-0 border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500">
            Showing {results.length} of {uniqueIngredients.length} ingredients
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

function formatCurrencyWithDecimals(value: number | null, decimals: number) {
  if (value === null) {
    return "Not enough priced mg-based data";
  }

  return `$${value.toFixed(decimals)}`;
}

function formatPerGummyPrice(value: number | null) {
  if (value === null) {
    return "Not enough priced mg-based data";
  }

  return `${(value * 100).toFixed(4)}¢ / gummy`;
}

function formatServingPrice(value: number | null) {
  if (value === null) {
    return "Not enough priced mg-based data";
  }

  return value < 1
    ? formatCurrencyWithDecimals(value, 4)
    : formatCurrencyWithDecimals(value, 2);
}

function formatTotalPrice(value: number | null) {
  return formatCurrencyWithDecimals(value, 2);
}

function getActiveCostFallbackMessage({
  activeCount,
  pricedIngredientCount,
}: {
  activeCount: number;
  pricedIngredientCount: number;
}) {
  if (activeCount === 0) {
    return "$0.00";
  }

  if (pricedIngredientCount === 0) {
    return "Not enough priced mg-based data";
  }

  return "Not enough order data";
}

function formatCurrencyWithFallback(
  value: number | null,
  fallbackMessage: string,
) {
  return value === null ? fallbackMessage : formatCurrency(value);
}

function formatMainPricingValue(value: number | null, activeCount: number) {
  if (activeCount === 0) {
    return "$0.00";
  }

  return formatCurrencyWithFallback(value, "Not enough priced mg-based data");
}

function formatMainPricingValueWith(
  value: number | null,
  activeCount: number,
  formatter: (value: number | null) => string,
) {
  if (activeCount === 0) {
    return formatter(0);
  }

  return formatter(value);
}

function getMainPricingNote(activeCount: number, note: string) {
  if (activeCount === 0) {
    return "Add active ingredients and order quantity to generate estimate.";
  }

  return note;
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "Not enough order data";
  }

  return `${Math.round(value * 100)}%`;
}

function formatKg(value: number | null) {
  if (value === null) {
    return "not enough order data";
  }

  return `${Number(value.toFixed(value >= 100 ? 0 : 2))} kg`;
}

function formatCount(value: number | null) {
  if (value === null) {
    return "Not enough order data";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function parseGummyWeight(value: string) {
  const weight = Number(value.replace("g", ""));

  return Number.isFinite(weight) && weight > 0 ? weight : null;
}

function getMarginForKg(totalKg: number | null) {
  if (totalKg === null) {
    return null;
  }

  if (totalKg >= 3000) {
    return 0.4;
  }

  if (totalKg >= 1500) {
    return 0.5;
  }

  if (totalKg >= 1200) {
    return 0.55;
  }

  if (totalKg >= 900) {
    return 0.6;
  }

  if (totalKg >= 600) {
    return 0.65;
  }

  return 0.7;
}

function getIngredientPrice(
  definition: ActiveIngredientDefinition | null | undefined,
  ingredientPrices: IngredientPriceMap,
) {
  if (!definition) {
    return null;
  }

  return ingredientPrices[definition.name.toLowerCase()] ?? null;
}

function getIngredientCostPerServing(
  ingredient: IngredientCostInput,
  ingredientPrices: IngredientPriceMap,
  ingredientDefinitions: ActiveIngredientDefinition[],
) {
  const definition = findActiveIngredient(
    ingredient.ingredient_name,
    ingredientDefinitions,
  );
  const price = getIngredientPrice(definition, ingredientPrices);
  const amountMg = toMg(ingredient);

  if (!definition || amountMg === null) {
    return null;
  }

  if (ingredient.customer_supplied === "yes") {
    return 0;
  }

  if (
    !price ||
    price.price_confidence === "needs_vendor_quote" ||
    price.price_per_kg_usd === null
  ) {
    return null;
  }

  return (amountMg / 1_000_000) * price.price_per_kg_usd;
}

function getServingDivisor(recommendedServingSize: string) {
  if (recommendedServingSize === "1 gummy") {
    return 1;
  }

  if (recommendedServingSize === "2 gummies") {
    return 2;
  }

  if (recommendedServingSize === "3 gummies") {
    return 3;
  }

  return 4;
}

function formatIngredientPricePerKg(price: number | null | undefined) {
  if (price === null || price === undefined) {
    return null;
  }

  return `$${Number(price.toFixed(price >= 100 ? 0 : 2))}/kg`;
}

function formatIngredientCostPerGummy(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return `${(value * 100).toFixed(4)}¢ / gummy`;
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

function getIngredientReviewData(
  ingredients: ActiveIngredient[],
  ingredientPrices: IngredientPriceMap,
  ingredientDefinitions: ActiveIngredientDefinition[],
) {
  const matches = ingredients
    .map((ingredient) => {
      const definition = findActiveIngredient(
        ingredient.ingredient_name,
        ingredientDefinitions,
      );
      const price = getIngredientPrice(definition, ingredientPrices);

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
        price_per_kg_usd: price?.price_per_kg_usd ?? null,
        price_confidence: price?.price_confidence ?? "needs_vendor_quote",
        vendor_quote_required:
          !price || price.price_confidence === "needs_vendor_quote",
        estimated_raw_cost_per_serving:
          getIngredientCostPerServing(
            ingredient,
            ingredientPrices,
            ingredientDefinitions,
          ),
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

function buildPreview(
  values: GummiesFormValues,
  ingredients: ActiveIngredient[],
  ingredientPrices: IngredientPriceMap,
  ingredientDefinitions: ActiveIngredientDefinition[],
) {
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
  const servingDivisor = getServingDivisor(recommendedServingSize);
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
      const definition = findActiveIngredient(
        ingredient.ingredient_name,
        ingredientDefinitions,
      );
      const price = getIngredientPrice(definition, ingredientPrices);
      const amountMg = toMg(ingredient);
      const costPerServing = getIngredientCostPerServing(
        ingredient,
        ingredientPrices,
        ingredientDefinitions,
      );

      return {
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.ingredient_name.trim(),
        matched_ingredient_name: definition?.name ?? null,
        customer_supplied: ingredient.customer_supplied,
        amount_per_serving: ingredient.amount_per_serving,
        unit: ingredient.unit,
        price_per_kg_usd: price?.price_per_kg_usd ?? null,
        price_confidence: price?.price_confidence ?? "needs_vendor_quote",
        vendor_quote_required:
          !price || price.price_confidence === "needs_vendor_quote",
        amount_mg_equivalent: amountMg,
        estimated_raw_cost_per_serving: costPerServing,
        estimated_raw_cost_per_gummy:
          costPerServing === null ? null : costPerServing / servingDivisor,
        pricing_note:
          ingredient.customer_supplied === "yes"
            ? "Customer-supplied ingredient excluded from raw material cost."
            : !price || price.price_confidence === "needs_vendor_quote"
              ? "Vendor quote required for this ingredient. It is excluded from the active cost estimate until procurement confirms pricing."
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
  const isBulkPackaging = values.packaging_type === "Bulk";
  const countPerUnit = Number(values.count_per_unit);
  const quantity = Number(values.quantity);
  const validQuantity =
    Number.isFinite(quantity) && quantity > 0 ? quantity : null;
  const validCountPerUnit =
    Number.isFinite(countPerUnit) && countPerUnit > 0 ? countPerUnit : null;
  const gummyWeightG = parseGummyWeight(values.gummy_weight);
  const requestedTotalGummies =
    validQuantity === null
      ? null
      : isBulkPackaging
        ? validQuantity
        : validCountPerUnit === null
          ? null
          : validQuantity * validCountPerUnit;
  const estimatedRawActiveCostPerUnit =
    isBulkPackaging
      ? null
      : totalRawActiveCostPerGummy !== null && validCountPerUnit !== null
        ? totalRawActiveCostPerGummy * validCountPerUnit
        : null;
  const estimatedRawActiveCostForOrder =
    totalRawActiveCostPerGummy !== null &&
    requestedTotalGummies !== null
      ? totalRawActiveCostPerGummy * requestedTotalGummies
      : null;
  const hasUnpricedIngredientCosts = ingredientCostLines.some(
    (line) => line.estimated_raw_cost_per_serving === null,
  );
  const vendorQuoteIngredientNames = ingredientCostLines
    .filter((line) => line.vendor_quote_required)
    .map((line) => line.matched_ingredient_name ?? line.ingredient_name)
    .filter((name) => name.trim());
  const hasVendorQuoteIngredientCosts = vendorQuoteIngredientNames.length > 0;
  const isLowOrSugarFree =
    values.base_type === "Low Sugar Pectin" ||
    values.base_type === "Sugar Free Pectin";
  const ingredientReview = getIngredientReviewData(
    ingredients,
    ingredientPrices,
    ingredientDefinitions,
  );
  const activeCount = ingredients.filter(
    (ingredient) =>
      ingredient.ingredient_name.trim() ||
      ingredient.amount_per_serving.trim(),
  ).length;
  const pricedIngredientCount = pricedIngredientCostLines.length;
  const activeCostFallbackMessage = getActiveCostFallbackMessage({
    activeCount,
    pricedIngredientCount,
  });
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
  const overheadPerGram = 0.0048;
  const overheadPerGummy =
    gummyWeightG === null ? null : gummyWeightG * overheadPerGram;
  const baseSystemEstimate = baseSystemEstimates[values.base_type] ?? {
    multiplier: 1,
    pectin_component_usd_per_kg: 15,
  };
  const extraActiveFeePerGummy =
    activeCount > 3 ? (activeCount - 3) * 0.001 : 0;
  const activeCostPerGummyForPricing = totalRawActiveCostPerGummy ?? 0;
  const unadjustedBaseCostPerGummy =
    overheadPerGummy === null
      ? null
      : activeCostPerGummyForPricing +
        overheadPerGummy +
        extraActiveFeePerGummy;
  const baseCostPerGummy =
    unadjustedBaseCostPerGummy === null
      ? null
      : unadjustedBaseCostPerGummy * baseSystemEstimate.multiplier;
  const baseSystemAdjustmentPerGummy =
    unadjustedBaseCostPerGummy === null
      ? null
      : unadjustedBaseCostPerGummy * (baseSystemEstimate.multiplier - 1);
  const requestedTotalKg =
    gummyWeightG !== null && requestedTotalGummies !== null
      ? (gummyWeightG * requestedTotalGummies) / 1000
      : null;
  const appliedTotalKg =
    requestedTotalKg === null ? null : Math.max(requestedTotalKg, 300);
  const moqApplied = requestedTotalKg !== null && requestedTotalKg < 300;
  const pricedTotalGummies =
    gummyWeightG !== null && appliedTotalKg !== null
      ? Math.ceil((appliedTotalKg * 1000) / gummyWeightG)
      : null;
  const margin = getMarginForKg(appliedTotalKg);
  const estimatedTotalCost =
    baseCostPerGummy !== null && pricedTotalGummies !== null
      ? baseCostPerGummy * pricedTotalGummies
      : null;
  const finalPrice =
    estimatedTotalCost !== null && margin !== null
      ? estimatedTotalCost * (1 + margin)
      : null;
  const estimatedPricePerGummy =
    finalPrice !== null && pricedTotalGummies !== null && pricedTotalGummies > 0
      ? finalPrice / pricedTotalGummies
      : null;
  const bottlePackagingLaborPerUnit = isBulkPackaging ? 0 : 1;
  const estimatedPricePerBottle =
    isBulkPackaging
      ? 0
      : estimatedPricePerGummy !== null && validCountPerUnit !== null
        ? estimatedPricePerGummy * validCountPerUnit +
          bottlePackagingLaborPerUnit
        : null;
  const bottleCount =
    !isBulkPackaging &&
    pricedTotalGummies !== null &&
    validCountPerUnit !== null
      ? Math.ceil(pricedTotalGummies / validCountPerUnit)
      : null;
  const estimatedBottlePackagingLaborCost =
    isBulkPackaging
      ? 0
      : bottleCount === null
        ? null
        : bottleCount * bottlePackagingLaborPerUnit;
  const estimatedFinalPriceWithBottles =
    finalPrice !== null && estimatedBottlePackagingLaborCost !== null
      ? finalPrice + estimatedBottlePackagingLaborCost
      : null;
  const overheadCost =
    overheadPerGummy !== null && pricedTotalGummies !== null
      ? overheadPerGummy * pricedTotalGummies
      : null;
  const activeCost =
    activeCount === 0 || pricedIngredientCount === 0
      ? null
      : pricedTotalGummies !== null
      ? activeCostPerGummyForPricing * pricedTotalGummies
      : null;
  const complexityFee =
    pricedTotalGummies !== null
      ? extraActiveFeePerGummy * pricedTotalGummies
      : null;
  const rdFee =
    activeCount > 4 ||
    values.base_type === "Sugar Free Pectin" ||
    ingredientReview.mineral_heavy ||
    ingredientReview.oil_soluble ||
    isHighActiveLoad
      ? 5000
      : 2500;
  const moldCost = values.custom_mold ? 15000 : 0;
  const pricingDataComplete =
    gummyWeightG !== null &&
    requestedTotalGummies !== null &&
    totalActiveMgPerServing !== null;

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
    vendor_quote_required_for_ingredients: hasVendorQuoteIngredientCosts,
    vendor_quote_ingredient_names: vendorQuoteIngredientNames,
    pricing_basis:
      hasVendorQuoteIngredientCosts
        ? "Some ingredients require vendor quote. Estimated pricing uses all currently priced ingredients and excludes vendor-quote items until procurement confirms cost."
        : "Estimated bulk active ingredient cost only. Not a final customer quote and excludes overage, yield loss, freight, testing, labor, packaging, margin, taxes, and current procurement confirmation.",
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
    pricing_engine: {
      label: "Estimated only",
      gummy_weight_g: gummyWeightG,
      base_type: values.base_type,
      base_system_multiplier: baseSystemEstimate.multiplier,
      base_system_pectin_component_usd_per_kg:
        baseSystemEstimate.pectin_component_usd_per_kg,
      overhead_per_gram: overheadPerGram,
      overhead_per_gummy: overheadPerGummy,
      active_count: activeCount,
      priced_ingredient_count: pricedIngredientCount,
      extra_active_fee_per_gummy: extraActiveFeePerGummy,
      active_cost_per_gummy: totalRawActiveCostPerGummy,
      unadjusted_base_cost_per_gummy: unadjustedBaseCostPerGummy,
      base_system_adjustment_per_gummy: baseSystemAdjustmentPerGummy,
      base_cost_per_gummy: baseCostPerGummy,
      requested_total_gummies: requestedTotalGummies,
      requested_total_kg: requestedTotalKg,
      moq_applied: moqApplied,
      applied_total_kg: appliedTotalKg,
      adjusted_total_gummies: pricedTotalGummies,
      margin,
      total_cost: estimatedTotalCost,
      final_price: finalPrice,
      estimated_price_per_gummy: estimatedPricePerGummy,
      order_quantity_units: validQuantity,
      gummies_per_unit: validCountPerUnit,
      count_per_bottle: validCountPerUnit,
      packaging_type: values.packaging_type,
      bulk_packaging_selected: isBulkPackaging,
      bottle_packaging_labor_per_unit: bottlePackagingLaborPerUnit,
      estimated_price_per_bottle: estimatedPricePerBottle,
      estimated_bottle_count: bottleCount,
      estimated_bottle_packaging_labor_cost:
        estimatedBottlePackagingLaborCost,
      estimated_final_price_with_bottle_packaging:
        estimatedFinalPriceWithBottles,
      active_cost: activeCost,
      overhead_cost: overheadCost,
      complexity_fee: complexityFee,
      rd_fee: rdFee,
      mold_cost: moldCost,
      vendor_quote_required: hasVendorQuoteIngredientCosts,
      vendor_quote_ingredient_names: vendorQuoteIngredientNames,
      active_cost_fallback_message: activeCostFallbackMessage,
      pricing_data_complete: pricingDataComplete,
      pricing_note:
        "Estimated only. Not a final commercial quote. Excludes final procurement confirmation, testing, freight, taxes, yield adjustment, and commercial approval.",
    },
    cost_per_gummy: estimatedPricePerGummy,
    cost_per_serving:
      estimatedPricePerGummy === null
        ? null
        : estimatedPricePerGummy * servingDivisor,
    price_per_bottle: estimatedPricePerBottle,
    total_cost: estimatedTotalCost,
    final_price: finalPrice,
    margin,
    rd_fee: rdFee,
    mold_cost: moldCost,
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
  const [ingredientPrices, setIngredientPrices] = useState<IngredientPriceMap>(
    {},
  );
  const [ingredientDefinitions, setIngredientDefinitions] = useState<
    ActiveIngredientDefinition[]
  >(uniqueActiveIngredients);
  const [isLoadingIngredientPrices, setIsLoadingIngredientPrices] =
    useState(true);
  const [ingredientPriceError, setIngredientPriceError] = useState("");
  const [ingredientMetadataNotice, setIngredientMetadataNotice] = useState("");

  const preview = useMemo(
    () =>
      buildPreview(
        values,
        ingredients,
        ingredientPrices,
        ingredientDefinitions,
      ),
    [values, ingredients, ingredientPrices, ingredientDefinitions],
  );
  const availableWeightOptions = values.shape
    ? (weightOptionsByShape[values.shape] ?? ["Custom"])
    : [];

  useEffect(() => {
    let isMounted = true;

    async function loadIngredientData() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        if (isMounted) {
          setIngredientPriceError(
            "Supabase is not configured. Ingredient prices require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
          );
          setIsLoadingIngredientPrices(false);
        }
        return;
      }

      const [ingredientResponse, priceResponse] = await Promise.all([
        supabase
          .from("ingredients")
          .select(
            "name, aliases, category, common_dose_min, common_dose_max, unit, default_dose, gummy_suitability, taste_risk, heat_sensitivity, oil_soluble, mineral_heavy, requires_rd_review, regulatory_review_required, notes",
          )
          .order("name", { ascending: true }),
        supabase
          .from("ingredient_prices")
          .select("name, price_per_kg_usd, price_confidence, notes")
          .order("name", { ascending: true }),
      ]);

      if (!isMounted) {
        return;
      }

      if (!ingredientResponse.error && ingredientResponse.data?.length) {
        setIngredientDefinitions(
          getUniqueActiveIngredients(
            ingredientResponse.data.map((row) =>
              normalizeSupabaseIngredient(row as SupabaseIngredientRow),
            ),
          ),
        );
        setIngredientMetadataNotice("");
      } else if (ingredientResponse.error) {
        setIngredientMetadataNotice(
          `${ingredientResponse.error.message}. Using local ingredient library fallback.`,
        );
      }

      if (priceResponse.error) {
        setIngredientPriceError(
          priceResponse.error.message || "Unable to load ingredient prices.",
        );
        setIsLoadingIngredientPrices(false);
        return;
      }

      const nextPrices = Object.fromEntries(
        (priceResponse.data || []).map((row) => [
          String(row.name).toLowerCase(),
          {
            name: String(row.name),
            price_per_kg_usd:
              row.price_per_kg_usd === null
                ? null
                : Number(row.price_per_kg_usd),
            price_confidence: String(row.price_confidence),
            notes: row.notes === null ? null : String(row.notes),
          },
        ]),
      );

      setIngredientPrices(nextPrices);
      setIsLoadingIngredientPrices(false);
    }

    loadIngredientData();

    return () => {
      isMounted = false;
    };
  }, []);

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

      if (field === "packaging_type" && value === "Bulk") {
        return { ...current, packaging_type: value, count_per_unit: "" };
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
          const definition = findActiveIngredient(value, ingredientDefinitions);

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

    if (values.packaging_type !== "Bulk" && !values.count_per_unit.trim()) {
      return "Please enter gummies per unit for non-bulk packaging.";
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
        findActiveIngredient(
          ingredient.ingredient_name,
          ingredientDefinitions,
        )?.name.toLowerCase(),
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
      .map((ingredient) => ({
        ingredient_name: ingredient.ingredient_name.trim(),
        amount_per_serving: ingredient.amount_per_serving.trim(),
        unit: ingredient.unit,
        customer_supplied: ingredient.customer_supplied,
        notes: ingredient.notes.trim(),
      }))
      .map((ingredient) => {
        const definition = findActiveIngredient(
          ingredient.ingredient_name,
          ingredientDefinitions,
        );
        const price = getIngredientPrice(definition, ingredientPrices);
        const estimatedRawCostPerServing = getIngredientCostPerServing(
          ingredient,
          ingredientPrices,
          ingredientDefinitions,
        );

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
          price_per_kg_usd: price?.price_per_kg_usd ?? null,
          price_confidence: price?.price_confidence ?? "needs_vendor_quote",
          vendor_quote_required:
            !price || price.price_confidence === "needs_vendor_quote",
          estimated_raw_cost_per_serving: estimatedRawCostPerServing,
          estimated_raw_cost_per_gummy:
            estimatedRawCostPerServing === null
              ? null
              : estimatedRawCostPerServing /
                getServingDivisor(preview.recommended_serving_size),
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
        count_per_unit:
          values.packaging_type === "Bulk" ? null : Number(values.count_per_unit),
        gummies_per_unit:
          values.packaging_type === "Bulk" ? null : Number(values.count_per_unit),
        quantity: Number(values.quantity),
        order_quantity_units: Number(values.quantity),
        total_gummies: preview.pricing_engine.requested_total_gummies,
        total_weight_kg: preview.pricing_engine.requested_total_kg,
        cost_per_gummy: preview.cost_per_gummy,
        cost_per_serving: preview.cost_per_serving,
        price_per_bottle: preview.price_per_bottle,
        total_cost: preview.total_cost,
        final_price: preview.final_price,
        margin: preview.margin,
        rd_fee: preview.rd_fee,
        mold_cost: preview.mold_cost,
        active_ingredients: normalizedIngredients,
        active_ingredient_review: getIngredientReviewData(
          ingredients,
          ingredientPrices,
          ingredientDefinitions,
        ),
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
      <section className="mx-auto grid w-full max-w-7xl items-start gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_0.42fr] lg:px-10 lg:py-10">
        <form onSubmit={handleSubmit} className="grid content-start gap-5">
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
            <FieldLabel label="Product Name" required>
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
            <FieldLabel label="Project Name" required>
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
              required
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
                rows={1}
                value={values.special_requests}
                onChange={(event) =>
                  updateField("special_requests", event.target.value)
                }
                className={`${fieldClass} h-11 min-h-11 resize-y`}
                placeholder="Custom flavor profile, color target, texture expectations, allergen considerations, or formula notes."
              />
            </FieldLabel>
          </QuoteSection>

          <QuoteSection title="Active Ingredient Builder">
            <div className="sm:col-span-2">
              <div className="hidden gap-3 border-b border-zinc-200 pb-2 text-xs font-semibold tracking-[0.12em] text-zinc-500 uppercase lg:grid lg:grid-cols-[28fr_12fr_10fr_12fr_22fr_16fr]">
                <span>
                  Ingredient <span className="text-red-600">*</span>
                </span>
                <span>
                  Amount <span className="text-red-600">*</span>
                </span>
                <span>
                  Unit <span className="text-red-600">*</span>
                </span>
                <span>Supplied</span>
                <span>Notes</span>
                <span>Price Info</span>
              </div>
              <div className="mt-3 grid gap-3">
                {ingredients.map((ingredient, index) => {
                  const matchedIngredient = findActiveIngredient(
                    ingredient.ingredient_name,
                    ingredientDefinitions,
                  );
                  const ingredientCostLine = preview.ingredient_cost_lines.find(
                    (line) => line.ingredient_id === ingredient.id,
                  );
                  const pricePerKg = formatIngredientPricePerKg(
                    ingredientCostLine?.price_per_kg_usd,
                  );
                  const costPerGummy = formatIngredientCostPerGummy(
                    ingredientCostLine?.estimated_raw_cost_per_gummy,
                  );
                  const needsVendorQuote =
                    ingredientCostLine?.vendor_quote_required === true;
                  const hasIngredientInput =
                    ingredient.ingredient_name.trim() ||
                    ingredient.amount_per_serving.trim();

                  return (
                    <div
                      key={ingredient.id}
                      className="border border-zinc-200 bg-zinc-50 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
                        <h3 className="text-sm font-semibold text-zinc-950">
                          Ingredient {index + 1}
                        </h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[28fr_12fr_10fr_12fr_22fr_16fr] lg:items-end">
                        <label>
                          <span className="text-xs font-semibold text-zinc-700 lg:hidden">
                            Ingredient
                            <span className="ml-1 text-red-600">*</span>
                          </span>
                          <IngredientSearchField
                            ingredient={ingredient}
                            ingredientDefinitions={ingredientDefinitions}
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
                            <span className="ml-1 text-red-600">*</span>
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
                            <span className="ml-1 text-red-600">*</span>
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
                        <div className="sm:col-span-2 lg:col-span-1">
                          <span className="text-xs font-semibold text-zinc-700 lg:hidden">
                            Price Info
                          </span>
                          <div className="mt-2 min-h-11 rounded-sm border border-zinc-200 bg-white px-3 py-2 text-xs leading-5 text-zinc-600 lg:mt-0">
                            {needsVendorQuote ? (
                              <p className="font-semibold text-amber-800">
                                Warning: Vendor quote required
                              </p>
                            ) : hasIngredientInput && !pricePerKg ? (
                              <p className="font-semibold text-amber-800">
                                Warning: No price available
                              </p>
                            ) : (
                              <>
                                <p className="font-semibold text-zinc-950">
                                  {pricePerKg ?? "$0/kg"}
                                </p>
                                <p>{costPerGummy ?? "0.0000¢ / gummy"}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeIngredient(ingredient.id)}
                          disabled={ingredients.length === 1}
                          className="inline-flex min-h-9 items-center justify-center rounded-sm border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove ingredient
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
            {values.packaging_type !== "Bulk" ? (
              <FieldLabel label="Gummies Per Unit" required>
                <input
                  required
                  min="1"
                  type="number"
                  value={values.count_per_unit}
                  onChange={(event) =>
                    updateField("count_per_unit", event.target.value)
                  }
                  className={fieldClass}
                  placeholder="Example: 60"
                />
              </FieldLabel>
            ) : (
              <div className="flex min-h-12 items-center border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-500">
                Gummies Per Unit is not used for bulk packaging.
              </div>
            )}
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
            <FieldLabel
              label={
                values.packaging_type === "Bulk"
                  ? "Order Quantity (Total Gummies)"
                  : "Order Quantity (Number of Units)"
              }
              required
            >
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
            <FieldLabel label="Target Launch Date" required>
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
                rows={1}
                value={values.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className={`${fieldClass} h-11 min-h-11 resize-y`}
                placeholder="Timeline requirements, known formulation concerns, target market, or technical questions."
              />
            </FieldLabel>
            <div className="sm:col-span-2 grid gap-3 border border-zinc-200 bg-zinc-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="font-semibold text-zinc-500 uppercase tracking-[0.12em] text-xs">
                  Total Gummies
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">
                  {formatCount(preview.pricing_engine.requested_total_gummies)}
                </p>
              </div>
              <div>
                <p className="font-semibold text-zinc-500 uppercase tracking-[0.12em] text-xs">
                  Total Weight (kg)
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-950">
                  {formatKg(preview.pricing_engine.requested_total_kg)}
                </p>
              </div>
            </div>
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
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Estimated pricing only. Final quote requires vendor confirmation
            and technical review.
          </p>
          {isLoadingIngredientPrices ? (
            <p className="mt-3 border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-600">
              Loading Supabase ingredient prices.
            </p>
          ) : null}
          {ingredientPriceError ? (
            <p className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              {ingredientPriceError}
            </p>
          ) : null}
          {ingredientMetadataNotice ? (
            <p className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              {ingredientMetadataNotice}
            </p>
          ) : null}
          <div className="mt-6 grid gap-4">
            <PricingQuoteCard
              label="Estimated Price Per Gummy (¢)"
              value={formatMainPricingValueWith(
                preview.pricing_engine.estimated_price_per_gummy,
                preview.pricing_engine.active_count,
                formatPerGummyPrice,
              )}
              note={getMainPricingNote(
                preview.pricing_engine.active_count,
                "Total price is calculated using precise unit cost × total gummies. Estimated only. Includes active cost, gummy overhead, active complexity fee, and applied margin.",
              )}
            />
            <PricingQuoteCard
              label="Estimated Price Per Bottle"
              value={
                preview.pricing_engine.bulk_packaging_selected
                  ? "N/A for bulk"
                  : formatMainPricingValue(
                      preview.pricing_engine.estimated_price_per_bottle,
                      preview.pricing_engine.active_count,
                    )
              }
              note={
                preview.pricing_engine.bulk_packaging_selected
                  ? "Bulk packaging selected. Bottle, cap, and bottle labor are not added."
                  : getMainPricingNote(
                      preview.pricing_engine.active_count,
                      "Estimated only. Includes gummies per bottle plus $1.00 bottle, cap, and labor charge.",
                    )
              }
            />
            <PreviewItem
              label="Cost Per Serving"
              value={formatMainPricingValueWith(
                preview.cost_per_serving,
                preview.pricing_engine.active_count,
                formatServingPrice,
              )}
              note={getMainPricingNote(
                preview.pricing_engine.active_count,
                "Total price is calculated using precise unit cost × total gummies. Estimated only.",
              )}
            />
            <PreviewItem
              label="Estimated Total Cost"
              value={formatMainPricingValueWith(
                preview.pricing_engine.total_cost,
                preview.pricing_engine.active_count,
                formatTotalPrice,
              )}
              note={
                preview.pricing_engine.active_count === 0
                  ? "Add active ingredients and order quantity to generate estimate."
                  : preview.pricing_engine.moq_applied
                  ? `Estimated only. 300kg MOQ applied from ${formatKg(
                      preview.pricing_engine.requested_total_kg,
                    )}.`
                  : "Estimated only. Uses requested gummy count."
              }
            />
            <PreviewItem
              label="Estimated Total Price"
              value={formatMainPricingValueWith(
                preview.pricing_engine.final_price,
                preview.pricing_engine.active_count,
                formatTotalPrice,
              )}
              note={getMainPricingNote(
                preview.pricing_engine.active_count,
                "Total price is calculated using precise unit cost × total gummies. Estimated only. Commercial quote still requires review.",
              )}
            />
            <PreviewItem
              label="Estimated Bottle-Included Total"
              value={
                preview.pricing_engine.bulk_packaging_selected
                  ? "N/A for bulk"
                  : formatMainPricingValueWith(
                      preview.pricing_engine
                        .estimated_final_price_with_bottle_packaging,
                      preview.pricing_engine.active_count,
                      formatTotalPrice,
                    )
              }
              note={
                preview.pricing_engine.bulk_packaging_selected
                  ? "Bulk packaging selected. No bottle, cap, or bottle labor charge added."
                  : getMainPricingNote(
                      preview.pricing_engine.active_count,
                      "Estimated only. Adds $1.00 per bottle for bottle, cap, and labor.",
                    )
              }
            />
            <PreviewItem
              label="Total Gummies"
              value={formatCount(preview.pricing_engine.requested_total_gummies)}
              note={
                preview.pricing_engine.bulk_packaging_selected
                  ? "Bulk quantity is treated as total gummies."
                  : "Calculated from order quantity units multiplied by gummies per unit."
              }
            />
            <PreviewItem
              label="Total Weight (kg)"
              value={formatKg(preview.pricing_engine.requested_total_kg)}
              note="Calculated from gummy weight and total gummies before MOQ adjustment."
            />
            <PreviewItem
              label="Applied Margin"
              value={formatPercent(preview.pricing_engine.margin)}
              note={`Estimated only. Pricing weight: ${formatKg(
                preview.pricing_engine.applied_total_kg,
              )}.`}
            />
            <PreviewItem
              label="Active Cost"
              value={formatCurrencyWithFallback(
                preview.pricing_engine.active_cost,
                preview.pricing_engine.active_cost_fallback_message,
              )}
              note={
                preview.vendor_quote_required_for_ingredients
                  ? "Some ingredients require vendor quote and are excluded from active cost until confirmed."
                  : "Estimated only. Customer-supplied and unpriced ingredients may be excluded."
              }
            />
            {preview.vendor_quote_required_for_ingredients ? (
              <PreviewItem
                label="Vendor Quote Ingredients"
                value="Some ingredients require vendor quote"
                note={preview.vendor_quote_ingredient_names.join(", ")}
              />
            ) : null}
            <PreviewItem
              label="Overhead Cost"
              value={formatCurrencyWithFallback(
                preview.pricing_engine.overhead_cost,
                "Select gummy weight and quantity to estimate overhead.",
              )}
              note="Estimated only. Uses $0.0048 per gram per gummy."
            />
            <PreviewItem
              label="Base System Adjustment"
              value={`${preview.pricing_engine.base_system_multiplier.toFixed(
                2,
              )}x`}
              note={`Estimated only. ${preview.pricing_engine.base_type || "Pectin"} uses a pectin component estimate of $${preview.pricing_engine.base_system_pectin_component_usd_per_kg}/kg.`}
            />
            <PreviewItem
              label="Complexity Fee"
              value={formatCurrencyWithFallback(
                preview.pricing_engine.complexity_fee,
                "Select gummy weight and quantity to estimate complexity fee.",
              )}
              note={`Estimated only. ${preview.pricing_engine.active_count} active ingredient(s) configured.`}
            />
            <PreviewItem
              label="R&D Fee"
              value={formatCurrencyWithFallback(
                preview.pricing_engine.rd_fee,
                "Not enough configuration data",
              )}
              note="Estimated only. Higher complexity, sugar-free, minerals, oil-soluble actives, or high active load use $5,000."
            />
            <PreviewItem
              label="Mold Cost"
              value={formatCurrencyWithFallback(
                preview.pricing_engine.mold_cost,
                "Not enough configuration data",
              )}
              note="Estimated only. Custom mold projects use $15,000."
            />
            <PreviewItem
              label="Estimated Raw Active Cost Per Gummy"
              value={formatCurrencyWithFallback(
                preview.estimated_raw_active_cost_per_gummy,
                preview.pricing_engine.active_cost_fallback_message,
              )}
              note={
                preview.has_unpriced_ingredient_costs
                  ? preview.pricing_basis
                  : preview.pricing_basis
              }
            />
            <PreviewItem
              label="Estimated Raw Active Cost Per Unit"
              value={formatCurrencyWithFallback(
                preview.estimated_raw_active_cost_per_unit,
                preview.pricing_engine.active_cost_fallback_message,
              )}
              note="Uses count per unit when available. This is active raw material only, not finished goods pricing."
            />
            <PreviewItem
              label="Estimated Raw Active Cost For Order"
              value={formatCurrencyWithFallback(
                preview.estimated_raw_active_cost_for_order,
                preview.pricing_engine.active_cost_fallback_message,
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

function PricingQuoteCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="border border-emerald-800 bg-emerald-950 p-5 text-white">
      <p className="text-xs font-semibold tracking-[0.16em] text-emerald-100 uppercase">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold leading-none sm:text-4xl">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-emerald-50">{note}</p>
    </div>
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
