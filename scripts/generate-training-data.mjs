#!/usr/bin/env node
/**
 * Generate training examples for all supported event types.
 *
 * Outputs:
 * - training-data/<event>.json          (one example per event)
 * - training-data/satellite-analysis-training.jsonl (combined)
 *
 * Format matches OpenAI chat fine-tuning JSONL: { messages: [...] }
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const OUT_DIR = path.join(repoRoot, "training-data");
const OUT_JSONL = path.join(OUT_DIR, "satellite-analysis-training.jsonl");

const SYSTEM_PROMPT =
  "You are an expert remote sensing scientist specializing in Landsat multispectral satellite imagery analysis. " +
  "You provide highly accurate, standardized analysis results based on real satellite data patterns and spectral analysis methodologies. " +
  "Always use realistic values based on actual Landsat 8/9 OLI data characteristics.";

/**
 * IMPORTANT:
 * This list should match the `eventTypes` supported by `src/pages/DagaWitness.tsx`.
 * Keep values lowercase snake_case.
 */
const EVENTS = [
  // Vegetation & Forest
  "deforestation",
  "forest_degradation",
  "reforestation",
  "vegetation_loss",
  "mangrove_loss",
  // Water-related
  "flood",
  "drought",
  "rainfall",
  "water_scarcity",
  "lake_drying",
  "river_changes",
  "wetland_loss",
  "coastal_erosion",
  // Fire-related
  "wildfire",
  "bushfire",
  "agricultural_burning",
  // Climate & Weather
  "climate_change",
  "temperature_anomaly",
  "heatwave",
  "cyclone",
  "storm",
  // Land Degradation
  "desertification",
  "soil_erosion",
  "land_degradation",
  "salinization",
  // Agriculture
  "agriculture",
  "crop_health",
  "irrigation_change",
  "livestock_impact",
  // Urban & Infrastructure
  "urbanization",
  "urban_sprawl",
  "infrastructure",
  "mining",
  // Biodiversity & Ecosystems
  "habitat_loss",
  "ecosystem_change",
  "wildlife_migration",
  // Air Quality
  "air_pollution",
  "dust_storms",
  // Pollution & Contamination
  "heavy_metal_pollution",
  "water_contamination",
  "soil_contamination",
  "industrial_pollution",
  "oil_spill",
  "acid_mine_drainage",
  // Other
  "snow_ice",
  "glacier_melt",
  "volcanic_activity",
];

const SCENARIOS = {
  deforestation: { place: "Congo Basin, Africa", lat: -0.5, lng: 15.0, start: "2023-01-01", end: "2024-01-01" },
  forest_degradation: { place: "Congo Basin (Periphery), Africa", lat: 1.2, lng: 16.8, start: "2022-06-01", end: "2023-06-01" },
  reforestation: { place: "Mau Forest Complex, Kenya", lat: -0.2, lng: 35.5, start: "2021-01-01", end: "2024-01-01" },
  vegetation_loss: { place: "Miombo Woodlands, Zambia", lat: -13.1, lng: 28.2, start: "2022-01-01", end: "2023-01-01" },
  mangrove_loss: { place: "Niger Delta, Nigeria", lat: 5.2, lng: 6.5, start: "2022-01-01", end: "2024-01-01" },
  flood: { place: "Niger Delta, Nigeria", lat: 5.2, lng: 6.5, start: "2023-08-01", end: "2023-10-01" },
  drought: { place: "Sahel Region, Mali", lat: 15.8, lng: -3.2, start: "2022-01-01", end: "2023-01-01" },
  rainfall: { place: "Accra Region, Ghana", lat: 5.6, lng: -0.2, start: "2023-04-01", end: "2023-07-01" },
  water_scarcity: { place: "Northern Kenya (Arid Lands)", lat: 2.5, lng: 37.9, start: "2022-01-01", end: "2023-01-01" },
  lake_drying: { place: "Lake Chad Basin", lat: 13.3, lng: 14.2, start: "2019-01-01", end: "2024-01-01" },
  river_changes: { place: "Lower Niger River, Nigeria", lat: 7.8, lng: 6.7, start: "2020-01-01", end: "2024-01-01" },
  wetland_loss: { place: "Sudd Wetlands, South Sudan", lat: 7.0, lng: 30.3, start: "2020-01-01", end: "2024-01-01" },
  coastal_erosion: { place: "Lagos Coastline, Nigeria", lat: 6.4, lng: 3.5, start: "2018-01-01", end: "2024-01-01" },
  wildfire: { place: "Kruger National Park, South Africa", lat: -24.0, lng: 31.5, start: "2023-06-01", end: "2023-09-01" },
  bushfire: { place: "Northern Australia (Savanna analogue)", lat: -12.5, lng: 131.0, start: "2023-06-01", end: "2023-08-01" },
  agricultural_burning: { place: "Northern Ghana (Croplands)", lat: 9.4, lng: -1.0, start: "2023-11-01", end: "2024-01-01" },
  climate_change: { place: "Horn of Africa", lat: 6.0, lng: 43.0, start: "2015-01-01", end: "2024-01-01" },
  temperature_anomaly: { place: "Khartoum, Sudan", lat: 15.5, lng: 32.5, start: "2023-03-01", end: "2023-06-01" },
  heatwave: { place: "N'Djamena, Chad", lat: 12.1, lng: 15.0, start: "2024-03-01", end: "2024-05-01" },
  cyclone: { place: "Beira, Mozambique", lat: -19.8, lng: 34.9, start: "2023-02-01", end: "2023-04-01" },
  storm: { place: "Dar es Salaam, Tanzania", lat: -6.8, lng: 39.3, start: "2023-03-01", end: "2023-05-01" },
  desertification: { place: "Sahel (Niger)", lat: 14.5, lng: 8.0, start: "2018-01-01", end: "2024-01-01" },
  soil_erosion: { place: "Ethiopian Highlands", lat: 10.5, lng: 38.5, start: "2021-01-01", end: "2024-01-01" },
  land_degradation: { place: "Rift Valley, Kenya", lat: -0.8, lng: 36.0, start: "2020-01-01", end: "2024-01-01" },
  salinization: { place: "Nile Delta, Egypt", lat: 30.9, lng: 31.3, start: "2020-01-01", end: "2024-01-01" },
  agriculture: { place: "Kano Plains, Nigeria", lat: 12.0, lng: 8.5, start: "2023-01-01", end: "2023-12-31" },
  crop_health: { place: "Central Rift, Ethiopia", lat: 8.0, lng: 38.7, start: "2023-05-01", end: "2023-09-01" },
  irrigation_change: { place: "Office du Niger, Mali", lat: 14.5, lng: -5.9, start: "2020-01-01", end: "2024-01-01" },
  livestock_impact: { place: "Northern Kenya (Pastoral zone)", lat: 3.0, lng: 38.0, start: "2022-01-01", end: "2024-01-01" },
  urbanization: { place: "Nairobi, Kenya", lat: -1.29, lng: 36.82, start: "2015-01-01", end: "2024-01-01" },
  urban_sprawl: { place: "Lagos, Nigeria", lat: 6.52, lng: 3.38, start: "2010-01-01", end: "2024-01-01" },
  infrastructure: { place: "Addis Ababa Corridor, Ethiopia", lat: 9.0, lng: 38.8, start: "2018-01-01", end: "2024-01-01" },
  mining: { place: "Witwatersrand, South Africa", lat: -26.2, lng: 28.0, start: "2019-01-01", end: "2024-01-01" },
  habitat_loss: { place: "Cross River, Nigeria", lat: 5.9, lng: 8.6, start: "2019-01-01", end: "2024-01-01" },
  ecosystem_change: { place: "Okavango Delta, Botswana", lat: -19.3, lng: 23.3, start: "2018-01-01", end: "2024-01-01" },
  wildlife_migration: { place: "Serengeti-Mara", lat: -2.3, lng: 34.8, start: "2022-01-01", end: "2024-01-01" },
  air_pollution: { place: "Cairo, Egypt", lat: 30.0, lng: 31.2, start: "2023-10-01", end: "2024-02-01" },
  dust_storms: { place: "Bodélé Depression, Chad", lat: 16.8, lng: 18.5, start: "2023-12-01", end: "2024-03-01" },
  heavy_metal_pollution: { place: "Kabwe, Zambia", lat: -14.45, lng: 28.45, start: "2020-01-01", end: "2024-01-01" },
  water_contamination: { place: "Lake Victoria (Near Kampala)", lat: 0.3, lng: 32.6, start: "2022-01-01", end: "2024-01-01" },
  soil_contamination: { place: "Industrial Zone, Tema, Ghana", lat: 5.67, lng: -0.02, start: "2020-01-01", end: "2024-01-01" },
  industrial_pollution: { place: "Port Harcourt, Nigeria", lat: 4.8, lng: 7.0, start: "2021-01-01", end: "2024-01-01" },
  oil_spill: { place: "Niger Delta (Coastal)", lat: 4.6, lng: 6.4, start: "2021-01-01", end: "2024-01-01" },
  acid_mine_drainage: { place: "Johannesburg Basin, South Africa", lat: -26.2, lng: 28.0, start: "2020-01-01", end: "2024-01-01" },
  snow_ice: { place: "Kilimanjaro, Tanzania", lat: -3.07, lng: 37.35, start: "2015-01-01", end: "2024-01-01" },
  glacier_melt: { place: "Rwenzori Mountains, Uganda", lat: 0.4, lng: 29.9, start: "2010-01-01", end: "2024-01-01" },
  volcanic_activity: { place: "Nyiragongo, DRC", lat: -1.52, lng: 29.25, start: "2021-01-01", end: "2024-01-01" },
};

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function baseIndicesByEvent(event) {
  // Rough, realistic-ish index ranges to keep outputs plausible.
  // Values are intentionally conservative and meant for training-format completeness, not ground truth.
  if (["deforestation", "forest_degradation", "vegetation_loss", "mangrove_loss", "habitat_loss"].includes(event)) {
    return { ndvi: { min: 0.05, max: 0.78, mean: 0.52, std: 0.18 }, ndwi: { min: -0.35, max: 0.35, mean: 0.05 }, nbr: { min: 0.10, max: 0.80, mean: 0.50 }, ndbi: { min: -0.40, max: 0.30, mean: -0.10 } };
  }
  if (["reforestation", "crop_health", "agriculture"].includes(event)) {
    return { ndvi: { min: 0.12, max: 0.85, mean: 0.60, std: 0.16 }, ndwi: { min: -0.25, max: 0.40, mean: 0.10 }, nbr: { min: 0.12, max: 0.75, mean: 0.52 }, ndbi: { min: -0.45, max: 0.20, mean: -0.15 } };
  }
  if (["flood", "lake_drying", "river_changes", "wetland_loss", "water_scarcity", "water_contamination", "oil_spill"].includes(event)) {
    return { ndvi: { min: -0.20, max: 0.65, mean: 0.30, std: 0.22 }, ndwi: { min: -0.55, max: 0.85, mean: 0.35 }, nbr: { min: 0.05, max: 0.70, mean: 0.40 }, ndbi: { min: -0.35, max: 0.45, mean: 0.10 } };
  }
  if (["wildfire", "bushfire", "agricultural_burning"].includes(event)) {
    return { ndvi: { min: -0.10, max: 0.65, mean: 0.28, std: 0.24 }, ndwi: { min: -0.50, max: 0.45, mean: -0.05 }, nbr: { min: -0.25, max: 0.65, mean: 0.20 }, ndbi: { min: -0.30, max: 0.40, mean: 0.05 } };
  }
  if (["urbanization", "urban_sprawl", "infrastructure", "mining", "industrial_pollution", "acid_mine_drainage"].includes(event)) {
    return { ndvi: { min: -0.10, max: 0.55, mean: 0.22, std: 0.20 }, ndwi: { min: -0.55, max: 0.35, mean: -0.10 }, nbr: { min: 0.00, max: 0.65, mean: 0.30 }, ndbi: { min: -0.15, max: 0.65, mean: 0.28 } };
  }
  // Default
  return { ndvi: { min: 0.00, max: 0.70, mean: 0.40, std: 0.18 }, ndwi: { min: -0.50, max: 0.50, mean: 0.00 }, nbr: { min: 0.00, max: 0.70, mean: 0.35 }, ndbi: { min: -0.40, max: 0.50, mean: 0.00 } };
}

function severityFromChange(changePercent) {
  const a = Math.abs(changePercent);
  if (a >= 20) return "critical";
  if (a >= 12) return "high";
  if (a >= 6) return "medium";
  return "low";
}

function buildAssistantJson(event, scenario) {
  // Event-specific bias for change percent to keep examples distinct.
  const changeBias = {
    drought: 22.4,
    flood: 15.6,
    deforestation: 8.3,
    wildfire: 18.2,
    urban_sprawl: 12.9,
    urbanization: 10.8,
    mining: 9.6,
    lake_drying: 14.1,
    coastal_erosion: 11.4,
    reforestation: -6.8,
    crop_health: 7.2,
    rainfall: 9.1,
    temperature_anomaly: 8.4,
    heatwave: 13.7,
    dust_storms: 9.8,
    oil_spill: 7.9,
  };

  const change = clamp(changeBias[event] ?? (6 + (event.length % 9)), -28, 28);
  const severity = severityFromChange(change);
  const indices = baseIndicesByEvent(event);

  const cloudPct = clamp(6 + (scenario.lat * scenario.lng) % 14, 1.5, 38.0);
  const conf = clamp(92 - cloudPct * 0.4, 60, 96);
  const quality = clamp(95 - cloudPct * 0.3, 55, 96);

  const sensor = (event.length % 2 === 0) ? "Landsat 8 OLI" : "Landsat 9 OLI";
  const acquisitionDates = [
    scenario.start,
    scenario.end,
  ].map(d => d);

  const summary = `${event.replace(/_/g, " ")} analysis indicates ${Math.abs(change).toFixed(1)}% change over the study period in ${scenario.place}`;

  const detailed = (() => {
    if (["deforestation", "forest_degradation", "vegetation_loss", "mangrove_loss", "habitat_loss"].includes(event)) {
      return "NDVI time-series shows reduced NIR reflectance (Band 5) and increased SWIR (Bands 6/7), consistent with canopy loss and exposed soil. Multi-date differencing identifies clustered hotspots and edge expansion near access corridors.";
    }
    if (["reforestation"].includes(event)) {
      return "NDVI increases and reduced bare-soil signatures indicate vegetation recovery. Temporal composites reduce phenology effects, suggesting sustained regrowth rather than seasonal greening.";
    }
    if (["flood", "wetland_loss", "river_changes", "lake_drying", "water_scarcity"].includes(event)) {
      return "NDWI thresholding and multi-temporal comparison indicate changes in surface water extent. Green-NIR separation is consistent with open water detection; transitions in wetland margins suggest hydrological regime shifts.";
    }
    if (["wildfire", "bushfire", "agricultural_burning"].includes(event)) {
      return "NBR decreases and SWIR increases indicate burn scars and post-fire ash/soil exposure. Change detection between pre- and post-event dates highlights severity gradients and impacted perimeter.";
    }
    if (["urbanization", "urban_sprawl", "infrastructure"].includes(event)) {
      return "NDBI increases and NDVI decreases are consistent with expansion of built-up surfaces. Spatial patterns align with radial growth and corridor development.";
    }
    if (["mining", "acid_mine_drainage"].includes(event)) {
      return "Spectral signatures show increased exposed substrate and disturbed ground. SWIR response and NDBI shifts indicate surface alteration consistent with extractive activity footprint expansion.";
    }
    if (["air_pollution", "industrial_pollution", "dust_storms"].includes(event)) {
      return "Indirect inference: land surface and haze-related artifacts can reduce contrast; analysis focuses on land surface proxies and temporal anomalies while noting limitations for atmospheric pollutants with Landsat-only optical data.";
    }
    if (["water_contamination", "soil_contamination", "heavy_metal_pollution", "oil_spill"].includes(event)) {
      return "Indirect inference: optical indices can indicate turbidity/film anomalies and shoreline changes, but contamination is best validated with in-situ sampling. The model reports probabilistic signals and uncertainty bounds.";
    }
    return "Multi-temporal Landsat analysis computed key spectral indices (NDVI, NDWI, NBR, NDBI) and applied change detection to quantify magnitude and spatial distribution of change across the study area.";
  })();

  const recs = (() => {
    const common = [
      "Cross-validate results with higher-resolution imagery where available",
      "Prioritize field verification for critical decisions",
      "Repeat analysis with additional dates to reduce temporal sampling bias",
    ];
    if (severity === "critical") return ["Initiate immediate stakeholder response and mitigation planning", ...common];
    if (severity === "high") return ["Increase monitoring frequency and coordinate with local agencies", ...common];
    if (severity === "medium") return ["Maintain monitoring and investigate drivers in hotspot areas", ...common];
    return ["Continue baseline monitoring and archive results for trend analysis", ...common];
  })();

  return {
    area_km2: Number((600 + Math.abs(scenario.lat * scenario.lng) * 18).toFixed(1)),
    change_percent: Number(change.toFixed(1)),
    summary,
    detailed_analysis: `Using Landsat 8/9 OLI multispectral imagery, ${detailed}`,
    severity,
    recommendations: recs,
    data_sources: ["Landsat 8 OLI", "Landsat 9 OLI"],
    cloud_coverage: {
      percentage: Number(cloudPct.toFixed(1)),
      detection_accuracy: Number(clamp(98 - cloudPct * 0.12, 80, 98).toFixed(1)),
      impact: cloudPct > 25 ? "high" : cloudPct > 12 ? "moderate" : "minimal",
      affected_areas: cloudPct > 20 ? "Patchy cloud contamination in parts of the AOI" : "Minimal cloud contamination",
      qa_band_quality: cloudPct > 25 ? "fair" : cloudPct > 12 ? "good" : "excellent",
    },
    data_quality: {
      overall_score: Math.round(quality),
      radiometric_quality: Math.round(clamp(96 - cloudPct * 0.2, 55, 98)),
      geometric_accuracy: Math.round(clamp(95 - cloudPct * 0.15, 55, 98)),
      temporal_coverage: Math.round(clamp(92 - (event.length % 8) * 2, 55, 96)),
      atmospheric_correction: "applied",
      reflectance_type: "SR",
    },
    analysis_confidence: Math.round(conf),
    landsat_info: {
      sensor,
      path_row: "000/000",
      acquisition_dates: acquisitionDates,
      spatial_resolution: "30m",
      bands_used: ["B2", "B3", "B4", "B5", "B6", "B7"],
      processing_level: "Level-2",
    },
    spectral_indices: indices,
    predictive_modeling: {
      trend_direction: change > 0 ? "increasing" : change < 0 ? "declining" : "stable",
      projected_change_6mo: Number(clamp(change * 0.55, -18, 18).toFixed(1)),
      projected_change_12mo: Number(clamp(change * 1.05, -28, 28).toFixed(1)),
      confidence: Math.round(clamp(84 - cloudPct * 0.4, 55, 90)),
      methodology: "time_series",
    },
    methodology_transparency: {
      percentage_derivation:
        "Change percentage estimated from multi-temporal spectral index differencing and classification proxies; values represent modeled approximations rather than direct ground-truth measurements.",
      uncertainty_range: {
        lower: Number((Math.abs(change) - 0.8).toFixed(1)),
        upper: Number((Math.abs(change) + 0.8).toFixed(1)),
      },
      confidence_interval: "95%",
      validation_notes:
        "For rigorous validation, compare with USGS EarthExplorer scene inspection, higher-resolution commercial imagery, and in-situ measurements when available.",
      known_limitations: [
        "Cloud cover and haze can reduce effective observation quality",
        "30m resolution may miss fine-scale change features",
        "AI interpretations are probabilistic and require corroboration",
      ],
    },
  };
}

function buildExample(event) {
  const scenario = SCENARIOS[event] ?? {
    place: "Africa (General AOI)",
    lat: 5.5,
    lng: 20.0,
    start: "2023-01-01",
    end: "2024-01-01",
  };

  const user = `Analyze Landsat multispectral satellite imagery for ${event.replace(/_/g, " ")} in ${scenario.place}. ` +
    `Time period: ${scenario.start} to ${scenario.end}. Coordinates: ${JSON.stringify({ lat: scenario.lat, lng: scenario.lng })}`;

  const assistantObj = buildAssistantJson(event, scenario);
  return {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
      { role: "assistant", content: JSON.stringify(assistantObj, null, 2) },
    ],
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const examples = EVENTS.map((event) => ({ event, example: buildExample(event) }));

  // Write per-event json
  for (const { event, example } of examples) {
    const outPath = path.join(OUT_DIR, `training-data-${event}.json`);
    fs.writeFileSync(outPath, JSON.stringify(example, null, 2) + "\n", "utf8");
  }

  // Write combined jsonl
  const lines = examples.map(({ example }) => JSON.stringify(example));
  fs.writeFileSync(OUT_JSONL, lines.join("\n") + "\n", "utf8");

  console.log(`Wrote ${examples.length} event files to ${OUT_DIR}`);
  console.log(`Wrote combined JSONL: ${OUT_JSONL}`);
}

main();

