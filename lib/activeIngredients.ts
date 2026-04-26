export type IngredientUnit = "mg" | "mcg" | "g" | "IU" | "billion CFU";

export type GummySuitability = "low" | "medium" | "high" | "restricted";

export type IngredientRisk = "low" | "medium" | "high";

export type ActiveIngredientDefinition = {
  name: string;
  aliases?: string[];
  category: string;
  common_dose_min: number;
  common_dose_max: number;
  unit: IngredientUnit;
  default_dose: number;
  gummy_suitability: GummySuitability;
  taste_risk: IngredientRisk;
  heat_sensitivity: IngredientRisk;
  oil_soluble: boolean;
  mineral_heavy: boolean;
  requires_rd_review: boolean;
  regulatory_review_required?: boolean;
  notes: string;
};

export const activeIngredients: ActiveIngredientDefinition[] = [
  {
    name: "Bamboo Extract",
    aliases: ["Bambusa Vulgaris", "Bambusa Vulgaris / Bamboo Extract"],
    category: "Beauty / Joint / Mineral Support",
    common_dose_min: 100,
    common_dose_max: 500,
    unit: "mg",
    default_dose: 250,
    gummy_suitability: "medium",
    taste_risk: "medium",
    heat_sensitivity: "low",
    oil_soluble: false,
    mineral_heavy: false,
    requires_rd_review: false,
    notes: "Often standardized for silica. Verify extract ratio and silica content.",
  },
  {
    name: "Turmeric Root Extract 4:1",
    category: "Joint / Inflammation Support",
    common_dose_min: 250,
    common_dose_max: 1000,
    unit: "mg",
    default_dose: 500,
    gummy_suitability: "medium",
    taste_risk: "high",
    heat_sensitivity: "medium",
    oil_soluble: false,
    mineral_heavy: false,
    requires_rd_review: true,
    notes: "Strong taste/color. Verify curcuminoid standardization if applicable.",
  },
  {
    name: "Sea Moss Extract 20:1",
    category: "Mineral / Wellness",
    common_dose_min: 100,
    common_dose_max: 500,
    unit: "mg",
    default_dose: 250,
    gummy_suitability: "medium",
    taste_risk: "medium",
    heat_sensitivity: "medium",
    oil_soluble: false,
    mineral_heavy: true,
    requires_rd_review: true,
    notes: "Mineral content and iodine variability require review.",
  },
  {
    name: "Algae-based Omega-3 DHA",
    category: "Heart / Brain / Eye Health",
    common_dose_min: 100,
    common_dose_max: 500,
    unit: "mg",
    default_dose: 250,
    gummy_suitability: "low",
    taste_risk: "high",
    heat_sensitivity: "high",
    oil_soluble: true,
    mineral_heavy: false,
    requires_rd_review: true,
    notes: "Oil-soluble, oxidation and off-taste risk. May need emulsification.",
  },
  {
    name: "Probiotics",
    aliases: ["Probiotic"],
    category: "Digestive",
    common_dose_min: 1,
    common_dose_max: 10,
    unit: "billion CFU",
    default_dose: 2,
    gummy_suitability: "low",
    taste_risk: "low",
    heat_sensitivity: "high",
    oil_soluble: false,
    mineral_heavy: false,
    requires_rd_review: true,
    notes: "CFU should not be counted as mg active load. Heat stability and overage required.",
  },
  {
    name: "Beta Carotene",
    category: "Vitamin / Eye Health",
    common_dose_min: 1,
    common_dose_max: 6,
    unit: "mg",
    default_dose: 3,
    gummy_suitability: "medium",
    taste_risk: "low",
    heat_sensitivity: "medium",
    oil_soluble: true,
    mineral_heavy: false,
    requires_rd_review: true,
    notes: "Oil-soluble carotenoid. May require dispersion system.",
  },
  {
    name: "Creatine Monohydrate",
    aliases: ["Creatine"],
    category: "Sports",
    common_dose_min: 1000,
    common_dose_max: 5000,
    unit: "mg",
    default_dose: 1000,
    gummy_suitability: "medium",
    taste_risk: "medium",
    heat_sensitivity: "medium",
    oil_soluble: false,
    mineral_heavy: false,
    requires_rd_review: true,
    notes: "High-dose active. Serving size often needs multiple gummies.",
  },
  {
    name: "Maca Root",
    aliases: ["Maca"],
    category: "Men's Health / Energy",
    common_dose_min: 500,
    common_dose_max: 1500,
    unit: "mg",
    default_dose: 500,
    gummy_suitability: "medium",
    taste_risk: "medium",
    heat_sensitivity: "medium",
    oil_soluble: false,
    mineral_heavy: false,
    requires_rd_review: true,
    notes: "Earthy taste. Extract ratio should be verified.",
  },
  {
    name: "Zinc Citrate",
    category: "Mineral / Immune",
    common_dose_min: 5,
    common_dose_max: 15,
    unit: "mg",
    default_dose: 10,
    gummy_suitability: "medium",
    taste_risk: "high",
    heat_sensitivity: "low",
    oil_soluble: false,
    mineral_heavy: true,
    requires_rd_review: true,
    notes: "Use elemental zinc basis. Metallic taste and pectin/mineral interaction risk.",
  },
  {
    name: "NMN",
    category: "Healthy Aging / NAD Support",
    common_dose_min: 125,
    common_dose_max: 500,
    unit: "mg",
    default_dose: 250,
    gummy_suitability: "medium",
    taste_risk: "medium",
    heat_sensitivity: "medium",
    oil_soluble: false,
    mineral_heavy: false,
    requires_rd_review: true,
    notes: "Regulatory and stability review recommended.",
  },
  {
    name: "N-Acetyl Cysteine",
    aliases: ["NAC", "NAC / N-Acetyl Cysteine"],
    category: "Antioxidant / Respiratory Support",
    common_dose_min: 300,
    common_dose_max: 600,
    unit: "mg",
    default_dose: 300,
    gummy_suitability: "low",
    taste_risk: "high",
    heat_sensitivity: "medium",
    oil_soluble: false,
    mineral_heavy: false,
    requires_rd_review: true,
    notes: "Strong sulfur odor/taste. Requires formulation review.",
  },
  {
    name: "CBD",
    category: "Restricted Cannabinoid",
    common_dose_min: 5,
    common_dose_max: 50,
    unit: "mg",
    default_dose: 10,
    gummy_suitability: "restricted",
    taste_risk: "high",
    heat_sensitivity: "medium",
    oil_soluble: true,
    mineral_heavy: false,
    requires_rd_review: true,
    regulatory_review_required: true,
    notes: "Restricted/high compliance risk. Not standard dietary supplement flow.",
  },
  {
    name: "D8 / Delta-8 THC",
    aliases: ["D8", "Delta-8 THC"],
    category: "Restricted Cannabinoid",
    common_dose_min: 2.5,
    common_dose_max: 25,
    unit: "mg",
    default_dose: 5,
    gummy_suitability: "restricted",
    taste_risk: "high",
    heat_sensitivity: "medium",
    oil_soluble: true,
    mineral_heavy: false,
    requires_rd_review: true,
    regulatory_review_required: true,
    notes: "Restricted/high compliance risk. Must not auto-approve.",
  },
  {
    name: "D9 / Delta-9 THC",
    aliases: ["D9", "Delta-9 THC"],
    category: "Restricted Cannabinoid",
    common_dose_min: 1,
    common_dose_max: 10,
    unit: "mg",
    default_dose: 2.5,
    gummy_suitability: "restricted",
    taste_risk: "high",
    heat_sensitivity: "medium",
    oil_soluble: true,
    mineral_heavy: false,
    requires_rd_review: true,
    regulatory_review_required: true,
    notes: "Restricted/high compliance risk. Must not auto-approve.",
  },
  {
    name: "CBD Full Spectrum",
    category: "Restricted Cannabinoid",
    common_dose_min: 5,
    common_dose_max: 50,
    unit: "mg",
    default_dose: 10,
    gummy_suitability: "restricted",
    taste_risk: "high",
    heat_sensitivity: "medium",
    oil_soluble: true,
    mineral_heavy: false,
    requires_rd_review: true,
    regulatory_review_required: true,
    notes: "May contain THC and other cannabinoids. Restricted/high compliance risk.",
  },
];

function normalizeIngredientName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ");
}

const ingredientLookup = new Map<string, ActiveIngredientDefinition>();

activeIngredients.forEach((ingredient) => {
  ingredientLookup.set(normalizeIngredientName(ingredient.name), ingredient);
  ingredient.aliases?.forEach((alias) => {
    ingredientLookup.set(normalizeIngredientName(alias), ingredient);
  });
});

export const uniqueActiveIngredients = Array.from(
  new Map(activeIngredients.map((ingredient) => [ingredient.name, ingredient]))
    .values(),
);

export function findActiveIngredient(value: string) {
  return ingredientLookup.get(normalizeIngredientName(value)) ?? null;
}

export function searchActiveIngredients(query: string) {
  const normalizedQuery = normalizeIngredientName(query);

  if (!normalizedQuery) {
    return uniqueActiveIngredients;
  }

  return uniqueActiveIngredients.filter((ingredient) => {
    const searchableValues = [
      ingredient.name,
      ingredient.category,
      ...(ingredient.aliases ?? []),
    ].map(normalizeIngredientName);

    return searchableValues.some((value) => value.includes(normalizedQuery));
  });
}
