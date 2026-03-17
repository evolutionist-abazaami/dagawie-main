# Parameter Definition Manual - Dagawie Intelligence

## Overview
This manual provides comprehensive documentation for all input parameters used in the Dagawie Intelligence geospatial analysis platform. It includes parameter definitions, units, acceptable ranges, and their influence on analysis outputs.

## Core Analysis Parameters

### 1. Event Type (`eventType`)
**Description**: The type of environmental event or change to analyze.

**Acceptable Values**:
- `deforestation` - Forest cover loss analysis
- `flooding` - Water inundation detection
- `drought` - Vegetation stress and moisture deficit
- `urbanization` - Built-up area expansion
- `erosion` - Land degradation and soil loss
- `fire` - Wildfire burn scar detection
- `landslide` - Mass movement detection
- `mining` - Surface mining activity
- `agriculture` - Crop health and land use change

**Units**: Categorical (string)

**Influence on Output**:
- Determines the spectral indices and algorithms applied
- Affects confidence scoring and change detection thresholds
- Influences the interpretation of results in the final report

**Sample Input-Output**:
- Input: `eventType: "deforestation"`
- Output: Analysis using NDVI and NBR indices with forest-specific thresholds

### 2. Start Date (`startDate`)
**Description**: The beginning date for the temporal analysis period.

**Acceptable Range**: 2015-01-01 to current date

**Units**: ISO 8601 date string (YYYY-MM-DD)

**Influence on Output**:
- Defines the baseline period for change detection
- Affects the temporal resolution of satellite imagery used
- Longer periods provide more robust trend analysis

**Sample Input-Output**:
- Input: `startDate: "2020-01-01"`
- Output: Baseline established from 2020 imagery

### 3. End Date (`endDate`)
**Description**: The ending date for the temporal analysis period.

**Acceptable Range**: Start date to current date

**Units**: ISO 8601 date string (YYYY-MM-DD)

**Influence on Output**:
- Defines the comparison period for change detection
- Recent dates may have higher resolution imagery available
- Affects the recency and relevance of findings

**Sample Input-Output**:
- Input: `endDate: "2024-12-31"`
- Output: Change calculated relative to 2024 conditions

### 4. Region/Area of Interest (`region`)
**Description**: Geographic area to analyze.

**Acceptable Values**: Any valid geographic location name or coordinate bounds

**Units**: String (place name) or coordinate array

**Influence on Output**:
- Determines satellite imagery coverage and resolution
- Affects processing time and computational resources
- Influences local environmental context in interpretations

**Sample Input-Output**:
- Input: `region: "Kenya"`
- Output: Analysis focused on Kenyan territory with country-specific insights

### 5. Analysis Area (`area`)
**Description**: Size of the analysis area in square kilometers.

**Acceptable Range**: 1 - 100,000 km²

**Units**: km²

**Influence on Output**:
- Larger areas require more processing time
- Affects statistical significance of results
- Influences the scale of recommendations provided

**Sample Input-Output**:
- Input: `area: 5000`
- Output: Regional-scale analysis with aggregated statistics

### 6. Confidence Level (`confidenceLevel`)
**Description**: Minimum confidence threshold for results.

**Acceptable Range**: 0.1 - 0.99

**Units**: Decimal (0-1 scale)

**Influence on Output**:
- Filters results to only include high-confidence detections
- Higher thresholds reduce false positives but may miss subtle changes
- Affects the completeness of the analysis

**Sample Input-Output**:
- Input: `confidenceLevel: 0.8`
- Output: Only changes with >80% confidence reported

## Spectral Index Parameters

### 7. NDVI Threshold (`ndviThreshold`)
**Description**: Normalized Difference Vegetation Index threshold for vegetation analysis.

**Acceptable Range**: -1.0 - 1.0

**Units**: Unitless index

**Influence on Output**:
- Values > 0.2 indicate healthy vegetation
- Negative values suggest non-vegetated surfaces
- Used in deforestation and drought analysis

### 8. NBR Threshold (`nbrThreshold`)
**Description**: Normalized Burn Ratio threshold for fire damage assessment.

**Acceptable Range**: -1.0 - 1.0

**Units**: Unitless index

**Influence on Output**:
- Values < 0.1 indicate burn scars
- Used in wildfire and vegetation stress analysis

### 9. NDWI Threshold (`ndwiThreshold`)
**Description**: Normalized Difference Water Index threshold for water body detection.

**Acceptable Range**: -1.0 - 1.0

**Units**: Unitless index

**Influence on Output**:
- Values > 0 indicate water presence
- Used in flooding and water resource analysis

## Processing Parameters

### 10. Cloud Cover Threshold (`cloudCoverMax`)
**Description**: Maximum allowable cloud cover in imagery.

**Acceptable Range**: 0 - 100%

**Units**: Percentage

**Influence on Output**:
- Lower thresholds ensure clearer imagery but may limit temporal coverage
- Affects data availability and analysis reliability

### 11. Resolution (`resolution`)
**Description**: Spatial resolution of analysis.

**Acceptable Values**: 10m, 20m, 30m

**Units**: Meters

**Influence on Output**:
- Higher resolution (smaller numbers) detects finer details
- Affects processing time and storage requirements

## Sample Input-Output Cases

### Case 1: Deforestation Analysis
**Input Parameters**:
- eventType: "deforestation"
- startDate: "2019-01-01"
- endDate: "2024-01-01"
- region: "Amazon Rainforest"
- confidenceLevel: 0.75

**Expected Output**:
- Forest loss percentage with confidence intervals
- Spatial distribution of deforestation hotspots
- Temporal trend analysis
- Recommendations for conservation areas

### Case 2: Flood Risk Assessment
**Input Parameters**:
- eventType: "flooding"
- startDate: "2023-06-01"
- endDate: "2024-06-01"
- region: "Bangladesh"
- ndwiThreshold: 0.3

**Expected Output**:
- Flood-prone area mapping
- Water body change detection
- Risk zone classification
- Infrastructure vulnerability assessment

### Case 3: Urban Expansion Monitoring
**Input Parameters**:
- eventType: "urbanization"
- startDate: "2015-01-01"
- endDate: "2024-01-01"
- region: "Nairobi, Kenya"
- area: 500

**Expected Output**:
- Built-up area growth statistics
- Urban sprawl pattern analysis
- Land use change classification
- Development trend projections

## Parameter Validation Rules

1. **Date Validation**: endDate must be after startDate
2. **Spatial Validation**: Region must be recognizable geographic area
3. **Range Validation**: All numeric parameters must be within acceptable ranges
4. **Dependency Validation**: Certain parameters required based on eventType
5. **Resolution Validation**: Higher resolution requires smaller analysis areas

## Performance Considerations

- Analysis time scales with area size and temporal range
- Higher resolution increases computational requirements
- Cloud cover filtering may reduce available imagery
- Confidence thresholds affect result density

## Troubleshooting

**Common Issues**:
- No results: Check date ranges and region validity
- Low confidence: Adjust thresholds or expand temporal range
- Processing errors: Verify parameter formats and ranges
- Incomplete coverage: Reduce cloud cover threshold or expand dates