export interface ChemicalRemedy {
  medicine: string;
  dosage: string;
  safety_interval_days: number;
  safety_notice: string;
}

export interface OrganicRemedy {
  solution: string;
}

export interface AgronomicRemedy {
  condition: string;
  category: "disease" | "pest" | "healthy" | "unknown";
  chemical: ChemicalRemedy;
  organic: OrganicRemedy;
  cultural: string;
}

const MANDATORY_SAFETY_NOTICE =
  "Always follow product label instructions, wear protective gear (gloves, mask, eye protection), and confirm with your local Agriculture Office or Krishi Vigyan Kendra (KVK) before purchasing or spraying.";

export const REMEDIES_DATABASE: Record<string, AgronomicRemedy> = {
  "Caterpillar and Semilooper Pest Attack": {
    condition: "Caterpillar and Semilooper Pest Attack",
    category: "pest",
    chemical: {
      medicine: "Chlorantraniliprole 18.5% SC or Flubendiamide 39.35% SC",
      dosage: "Follow manufacturer product label strictly. Never apply without reading instructions.",
      safety_interval_days: 14,
      safety_notice: MANDATORY_SAFETY_NOTICE,
    },
    organic: {
      solution: "Neem oil (Azadirachtin formulation) or Bacillus thuringiensis (Bt) bio-spray following package instructions.",
    },
    cultural:
      "Install pheromone traps (4-5 per acre) for early monitoring. Handpick visible egg clusters and early-stage larvae where practical. Conserve natural predators such as ladybird beetles and spiders. Avoid excess nitrogenous fertilizer which attracts defoliators.",
  },
  "Healthy_Soyabean": {
    condition: "Healthy_Soyabean",
    category: "healthy",
    chemical: {
      medicine: "No chemical treatment needed - No disease detected in this photo.",
      dosage: "Not applicable",
      safety_interval_days: 0,
      safety_notice: "Continue inspecting your crop regularly across different parts of the field.",
    },
    organic: {
      solution: "Maintain natural plant health with balanced organic compost, Panchagavya, or Jeevamrutha as preventive soil nutrition.",
    },
    cultural:
      "Keep scouting your crop weekly. Maintain good weed management, proper plant spacing, and ensure no standing water in the root zone.",
  },
  "Soyabean_Frog_Leaf_Eye": {
    condition: "Soyabean_Frog_Leaf_Eye",
    category: "disease",
    chemical: {
      medicine: "Pyraclostrobin 20% WG or Azoxystrobin + Difenoconazole formulation",
      dosage: "Follow manufacturer product label strictly. Consult local KVK officer for approved spray timing.",
      safety_interval_days: 21,
      safety_notice: MANDATORY_SAFETY_NOTICE,
    },
    organic: {
      solution: "Trichoderma viride or Pseudomonas fluorescens bio-fungicide spray at first appearance of circular spots.",
    },
    cultural:
      "Plant certified resistant seed varieties. Incorporate crop residues after harvest via deep tillage. Practice crop rotation with corn or sorghum for at least 1-2 seasons to break fungal cycle.",
  },
  "Soyabean_Mosaic": {
    condition: "Soyabean_Mosaic",
    category: "disease",
    chemical: {
      medicine: "Thiamethoxam 25% WG or Acetamiprid 20% SP (targets vector aphids only; virus cannot be cured by chemical spray)",
      dosage: "Follow manufacturer product label strictly for aphid control.",
      safety_interval_days: 15,
      safety_notice: MANDATORY_SAFETY_NOTICE,
    },
    organic: {
      solution: "Install yellow sticky traps (10-12 per acre) to manage aphid vector populations, supplemented with approved neem formulation.",
    },
    cultural:
      "Promptly rogue out and destroy viral-infected stunted plants so aphids do not spread the virus to neighbors. Control broadleaf weeds on field edges. Avoid tractor passes through wet foliage to prevent mechanical sap spread.",
  },
  "Soyabean_Rust": {
    condition: "Soyabean_Rust",
    category: "disease",
    chemical: {
      medicine: "Hexaconazole 5% EC or Tebuconazole 25.9% EC",
      dosage: "Follow manufacturer product label strictly. Spray at initial observation of rust pustules.",
      safety_interval_days: 20,
      safety_notice: MANDATORY_SAFETY_NOTICE,
    },
    organic: {
      solution: "Copper-based approved bio-fungicide or Bordeaux mixture following label directions as a preventive barrier.",
    },
    cultural:
      "Ensure proper planting density to promote air circulation through canopy. Plant rust-tolerant early varieties if available. Monitor fields intensively during humid, warm, cloudy periods.",
  },
  "Soyabean_Spectoria_Brown_Spot": {
    condition: "Soyabean_Spectoria_Brown_Spot",
    category: "disease",
    chemical: {
      medicine: "Mancozeb 75% WP or Carbendazim + Mancozeb combination",
      dosage: "Follow manufacturer product label strictly. Apply only when lower canopy lesions begin spreading.",
      safety_interval_days: 14,
      safety_notice: MANDATORY_SAFETY_NOTICE,
    },
    organic: {
      solution: "Trichoderma harzianum or approved bio-formulation sprayed according to instructions.",
    },
    cultural:
      "Deep plowing after harvest to bury residue harboring fungal spores. Improve field drainage to reduce splash dispersal from soil onto lower leaves. Practice 2-year crop rotation away from soybean.",
  },
};

export const DEFAULT_REMEDY: AgronomicRemedy = {
  condition: "Unknown / Unclassified Foliar Condition",
  category: "unknown",
  chemical: {
    medicine: "Do not spray unknown chemicals. Consult your local Agricultural Extension Officer or KVK.",
    dosage: "Follow manufacturer product label strictly after expert confirmation.",
    safety_interval_days: 14,
    safety_notice: MANDATORY_SAFETY_NOTICE,
  },
  organic: {
    solution: "Take a fresh leaf sample to your nearest Krishi Vigyan Kendra (KVK) for positive identification.",
  },
  cultural:
    "Isolate suspicious plants. Avoid touching healthy plants after handling symptomatic leaves until your hands and tools are washed.",
};

export function getRemedyForCondition(condition: string): AgronomicRemedy {
  return REMEDIES_DATABASE[condition] || DEFAULT_REMEDY;
}
