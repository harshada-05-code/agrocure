export interface ChemicalRemedy {
  medicine: string;
  dosage: string;
  safety_interval_days: number;
}

export interface OrganicRemedy {
  solution: string;
}

export interface AgronomicRemedy {
  condition: string;
  chemical: ChemicalRemedy;
  organic: OrganicRemedy;
  cultural: string;
}

export const REMEDIES_DATABASE: Record<string, AgronomicRemedy> = {
  "Caterpillar and Semilooper Pest Attack": {
    condition: "Caterpillar and Semilooper Pest Attack",
    chemical: {
      medicine: "Chlorantraniliprole 18.5% SC (Coragen) or Flubendiamide 39.35% SC",
      dosage: "60 ml per acre dissolved in 200 liters of water",
      safety_interval_days: 14,
    },
    organic: {
      solution: "Neem oil (Azadirachtin 1500 ppm) @ 5ml/L of water or Bacillus thuringiensis (Bt) formulation @ 2g/L.",
    },
    cultural:
      "Install pheromone traps (4-5 per acre) for early monitoring. Handpick visible egg clusters and early-instar larvae. Conserve natural predators such as ladybird beetles, spiders, and Trichogramma wasps. Avoid excess nitrogen fertilizer which promotes succulent foliage attractive to caterpillars.",
  },
  "Healthy_Soyabean": {
    condition: "Healthy_Soyabean",
    chemical: {
      medicine: "None required - Crop foliage is healthy and vigorous.",
      dosage: "N/A",
      safety_interval_days: 0,
    },
    organic: {
      solution: "Apply foliar tonic spray of Panchagavya (3%) or Jeevamrutha to sustain microbial vitality and promote balanced nutrient uptake.",
    },
    cultural:
      "Maintain regular weekly crop scouting. Ensure adequate weed control and balanced irrigation without moisture stress. Adhere to crop rotation with non-legumes (e.g., maize, millets) to preserve soil health.",
  },
  "Soyabean_Frog_Leaf_Eye": {
    condition: "Soyabean_Frog_Leaf_Eye",
    chemical: {
      medicine: "Pyraclostrobin 20% WG or Azoxystrobin 18.2% + Difenoconazole 11.4% SC",
      dosage: "200 ml per acre in 200 liters of water during early pod development (R3 stage)",
      safety_interval_days: 21,
    },
    organic: {
      solution: "Spray bio-fungicide Trichoderma viride or Pseudomonas fluorescens @ 5g/L water at the earliest observation of circular frogeye spots.",
    },
    cultural:
      "Plant certified disease-free, frogeye-resistant seed cultivars. Incorporate or bury infected crop residue post-harvest through deep tillage. Rotate out of soybean for at least 1-2 seasons with corn or grain sorghum to disrupt fungal survival in residue.",
  },
  "Soyabean_Mosaic": {
    condition: "Soyabean_Mosaic",
    chemical: {
      medicine: "Thiamethoxam 25% WG or Acetamiprid 20% SP (controls insect aphid vectors)",
      dosage: "40 grams per acre in 200 liters of water",
      safety_interval_days: 15,
    },
    organic: {
      solution: "Install yellow sticky traps (10-12 per acre) to manage aphid vector populations, supplemented with 2% Neem Seed Kernel Extract (NSKE) foliar spray.",
    },
    cultural:
      "Rogue out and destroy viral-infected stunted plants promptly to prevent vector acquisition. Eliminate alternative weed hosts along field perimeters. Avoid tractor and manual field operations while foliage is damp to prevent mechanical sap transmission. Plant certified virus-indexed seed.",
  },
  "Soyabean_Rust": {
    condition: "Soyabean_Rust",
    chemical: {
      medicine: "Hexaconazole 5% EC or Tebuconazole 25.9% EC",
      dosage: "200 ml per acre in 200 liters of water at initial pustule appearance",
      safety_interval_days: 20,
    },
    organic: {
      solution: "Foliar application of Bordeaux mixture (1%) or Copper Oxychloride @ 2.5g/L water as a preventive protective barrier.",
    },
    cultural:
      "Ensure proper planting density and row spacing (45 cm) to promote air movement and lower canopy humidity. Plant early-maturing rust-tolerant soybean varieties. Monitor fields intensively during overcast, warm, humid weather intervals.",
  },
  "Soyabean_Spectoria_Brown_Spot": {
    condition: "Soyabean_Spectoria_Brown_Spot",
    chemical: {
      medicine: "Mancozeb 75% WP or Carbendazim 12% + Mancozeb 63% WP (Saaf)",
      dosage: "350-400 grams per acre in 200 liters of water",
      safety_interval_days: 14,
    },
    organic: {
      solution: "Spray cow urine dilution (5%) mixed with fermented buttermilk extract or Trichoderma harzianum @ 5g/L of water.",
    },
    cultural:
      "Deep plowing immediately after harvest to bury overwintering Septoria glycines spores. Ensure proper field drainage to prevent prolonged standing moisture. Practice strict crop rotation away from soybeans for at least 2 consecutive seasons.",
  },
};

export const DEFAULT_REMEDY: AgronomicRemedy = {
  condition: "Unknown / Unclassified Foliar Condition",
  chemical: {
    medicine: "Consult local certified Agronomist or Krishi Vigyan Kendra (KVK) officer for targeted chemical diagnosis.",
    dosage: "Follow manufacturer product label strictly",
    safety_interval_days: 14,
  },
  organic: {
    solution: "Apply broad-spectrum organic bio-protective spray of 1% Neem oil or Trichoderma harzianum.",
  },
  cultural:
    "Isolate suspect plant zones, avoid overhead sprinkler irrigation, maintain field hygiene, and submit foliar samples to an agricultural testing lab.",
};

export function getRemedyForCondition(condition: string): AgronomicRemedy {
  return REMEDIES_DATABASE[condition] || DEFAULT_REMEDY;
}
