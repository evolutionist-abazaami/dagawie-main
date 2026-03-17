import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  color?: string;
}

interface MapPolygon {
  coordinates: [number, number][];
  label: string;
  color?: string;
  fillOpacity?: number;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export type HeatmapLayerType = "vegetation" | "temperature" | "rainfall" | "none";
export type BaseMapType = "satellite" | "aerial" | "streets" | "terrain";

interface MapLibreMapProps {
  center: [number, number];
  zoom: number;
  className?: string;
  markers?: MapMarker[];
  polygons?: MapPolygon[];
  heatmapData?: HeatmapPoint[];
  onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void;
  selectionMode?: boolean;
  selectedArea?: { lat: number; lng: number; radius?: number } | null;
  is3DEnabled?: boolean;
  activeHeatmapLayer?: HeatmapLayerType;
  showFullscreenControl?: boolean;
  showGeolocateControl?: boolean;
  baseMap?: BaseMapType;
  showBuildings?: boolean;
  showLabels?: boolean;
}

const MapLibreMap = ({
  center,
  zoom,
  className = "",
  markers = [],
  polygons = [],
  onLocationSelect,
  selectionMode = false,
  selectedArea = null,
  is3DEnabled = false,
  activeHeatmapLayer = "none",
  showFullscreenControl = false,
  showGeolocateControl = false,
  baseMap = "satellite",
  showBuildings = true,
  showLabels = true,
}: MapLibreMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const clickHandlerRef = useRef<((e: maplibregl.MapMouseEvent) => void) | null>(null);

  // Determine the MapLibre style based on the selected base map.
  const getMapStyle = useCallback(() => {
    const baseStyles: Record<BaseMapType, maplibregl.Style> = {
      satellite: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            ],
            tileSize: 256,
            attribution: '© <a href="https://www.arcgis.com/">Esri</a>',
          },
        },
        layers: [
          {
            id: "satellite-tiles",
            type: "raster",
            source: "satellite",
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      aerial: {
        version: 8,
        sources: {
          aerial: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            ],
            tileSize: 256,
            attribution: '© <a href="https://www.arcgis.com/">Esri</a>',
          },
        },
        layers: [
          {
            id: "aerial-tiles",
            type: "raster",
            source: "aerial",
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      streets: {
        version: 8,
        sources: {
          streets: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: "streets-tiles",
            type: "raster",
            source: "streets",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      terrain: {
        version: 8,
        sources: {
          terrain: {
            type: "raster",
            tiles: ["https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
          },
        },
        layers: [
          {
            id: "terrain-tiles",
            type: "raster",
            source: "terrain",
            minzoom: 0,
            maxzoom: 18,
          },
        ],
      },
    };

    return baseStyles[baseMap];
  }, [baseMap]);

  // Generate simulated environmental data for Africa
  const generateEnvironmentalData = useCallback((type: HeatmapLayerType): HeatmapPoint[] => {
    if (type === "none") return [];
    
    const africaPoints: HeatmapPoint[] = [];
    
    // Generate data points across Africa
    const regions = [
      // West Africa - high vegetation
      { lat: 6.5, lng: -1.5, baseIntensity: { vegetation: 0.85, temperature: 0.6, rainfall: 0.75 } },
      { lat: 7.5, lng: 4.0, baseIntensity: { vegetation: 0.75, temperature: 0.65, rainfall: 0.7 } },
      { lat: 10.0, lng: -8.0, baseIntensity: { vegetation: 0.6, temperature: 0.7, rainfall: 0.55 } },
      { lat: 5.5, lng: -5.0, baseIntensity: { vegetation: 0.8, temperature: 0.55, rainfall: 0.8 } },
      // Central Africa - rainforest
      { lat: 0.5, lng: 18.0, baseIntensity: { vegetation: 0.95, temperature: 0.55, rainfall: 0.9 } },
      { lat: -4.0, lng: 15.0, baseIntensity: { vegetation: 0.9, temperature: 0.5, rainfall: 0.85 } },
      { lat: 2.0, lng: 12.0, baseIntensity: { vegetation: 0.88, temperature: 0.52, rainfall: 0.82 } },
      // East Africa
      { lat: -1.3, lng: 36.8, baseIntensity: { vegetation: 0.5, temperature: 0.65, rainfall: 0.45 } },
      { lat: 9.0, lng: 38.7, baseIntensity: { vegetation: 0.35, temperature: 0.75, rainfall: 0.3 } },
      { lat: -6.0, lng: 35.0, baseIntensity: { vegetation: 0.55, temperature: 0.6, rainfall: 0.5 } },
      // Southern Africa
      { lat: -26.0, lng: 28.0, baseIntensity: { vegetation: 0.45, temperature: 0.55, rainfall: 0.4 } },
      { lat: -19.0, lng: 25.0, baseIntensity: { vegetation: 0.3, temperature: 0.8, rainfall: 0.2 } },
      { lat: -22.0, lng: 17.0, baseIntensity: { vegetation: 0.15, temperature: 0.85, rainfall: 0.1 } },
      // North Africa - Sahara
      { lat: 25.0, lng: 10.0, baseIntensity: { vegetation: 0.05, temperature: 0.95, rainfall: 0.05 } },
      { lat: 28.0, lng: 3.0, baseIntensity: { vegetation: 0.08, temperature: 0.9, rainfall: 0.08 } },
      { lat: 22.0, lng: 25.0, baseIntensity: { vegetation: 0.03, temperature: 0.92, rainfall: 0.03 } },
      { lat: 30.0, lng: 0.0, baseIntensity: { vegetation: 0.1, temperature: 0.88, rainfall: 0.12 } },
    ];

    regions.forEach(region => {
      // Add main point
      africaPoints.push({
        lat: region.lat,
        lng: region.lng,
        intensity: region.baseIntensity[type],
      });
      
      // Add surrounding points with variation for density
      for (let i = 0; i < 8; i++) {
        const latOffset = (Math.random() - 0.5) * 6;
        const lngOffset = (Math.random() - 0.5) * 6;
        const intensityVariation = (Math.random() - 0.5) * 0.3;
        
        africaPoints.push({
          lat: region.lat + latOffset,
          lng: region.lng + lngOffset,
          intensity: Math.max(0, Math.min(1, region.baseIntensity[type] + intensityVariation)),
        });
      }
    });

    return africaPoints;
  }, []);

  // Reverse geocode to get location name
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "GeoPulse Environmental Analysis App",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.display_name?.split(",").slice(0, 3).join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log("Initializing MapLibre map", { center, zoom, baseMap, container: mapRef.current });

    // Add a small delay to ensure container is fully laid out
    const timer = setTimeout(() => {
      try {
        const map = new maplibregl.Map({
          container: mapRef.current,
          style: getMapStyle(),
          center: [center[1], center[0]], // MapLibre uses [lng, lat]
          zoom: zoom,
        });

        map.on("load", () => {
          console.log("MapLibre map loaded successfully (baseMap=", baseMap, ")");
          setMapLoaded(true);
        });

        map.on("error", (e) => {
          console.error("MapLibre error:", e);
          console.error("Error details:", e.error);
        });

        mapInstanceRef.current = map;
      } catch (error) {
        console.error("Error creating map:", error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapLoaded(false);
      }
    };
  }, [center, zoom, baseMap, getMapStyle]);

  // Update style when baseMap changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    map.setStyle(getMapStyle());
  }, [baseMap, getMapStyle, mapLoaded]);

  // Handle 3D mode toggle - add/remove terrain dynamically with enhanced sources
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    const enable3D = async () => {
      try {
        // Add multiple terrain sources for better coverage
        if (!map.getSource("terrainSource")) {
          map.addSource("terrainSource", {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
              "https://api.mapbox.com/raster/v1/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example"
            ],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 15, // Increased max zoom for better detail
          });
        }

        // Add hillshade with multiple illumination directions
        if (!map.getSource("hillshadeSource")) {
          map.addSource("hillshadeSource", {
            type: "raster-dem",
            tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 15,
          });
        }

        // Add hillshade layer with enhanced styling
        if (!map.getLayer("hillshade")) {
          map.addLayer({
            id: "hillshade",
            type: "hillshade",
            source: "hillshadeSource",
            paint: {
              "hillshade-shadow-color": "#473B24",
              "hillshade-highlight-color": "#ffffff",
              "hillshade-illumination-anchor": "viewport",
              "hillshade-exaggeration": 0.8, // Slightly reduced for more realistic look
            },
          });
        }

        // Add contour lines for elevation visualization
        if (!map.getLayer("contours")) {
          map.addLayer({
            id: "contours",
            type: "line",
            source: "hillshadeSource",
            paint: {
              "line-color": "#8B4513",
              "line-width": 1,
              "line-opacity": 0.5,
            },
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
          });
        }

        // Wait for terrain tiles to load
        await new Promise(resolve => setTimeout(resolve, 200));

        // Enable terrain with enhanced settings
        try {
          map.setTerrain({
            source: "terrainSource",
            exaggeration: 2.0 // Increased exaggeration for more dramatic 3D effect
          });
        } catch (terrainError) {
          console.warn("Terrain setup failed, continuing without 3D:", terrainError);
          return;
        }

        // Smooth transition to 3D view
        map.easeTo({
          pitch: 75, // Higher pitch for better 3D perspective
          bearing: -30, // Slight rotation for more natural view
          duration: 2000,
          easing: (t) => t * (2 - t), // Smooth easing function
        });

        // Add atmospheric fog for depth
        map.setFog({
          color: '#87CEEB', // Sky blue
          'high-color': '#ffffff', // White at high altitude
          'horizon-blend': 0.4,
          'space-color': '#000000',
          'star-intensity': 0.0
        });

      } catch (error) {
        console.error("Error enabling 3D terrain:", error);
      }
    };

    const disable3D = () => {
      try {
        // Remove fog
        map.setFog(null);

        // Disable terrain
        map.setTerrain(null);

        // Remove contour lines
        if (map.getLayer("contours")) {
          map.removeLayer("contours");
        }

        // Remove hillshade layer
        if (map.getLayer("hillshade")) {
          map.removeLayer("hillshade");
        }

        // Smooth transition back to 2D
        map.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 1500,
          easing: (t) => t * (2 - t),
        });
      } catch (error) {
        console.error("Error disabling 3D terrain:", error);
      }
    };

    if (is3DEnabled) {
      enable3D();
    } else {
      disable3D();
    }
  }, [is3DEnabled, mapLoaded]);

  // Handle base map switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    const baseMapSources = {
      satellite: "satellite",
      aerial: "aerial",
      streets: "streets",
      terrain: "terrain",
    };

    const sourceId = baseMapSources[baseMap];
    const satelliteLayer = map.getLayer("satellite-tiles");
    const aerialLayer = map.getLayer("aerial-tiles");
    const streetsLayer = map.getLayer("streets-tiles");
    const terrainLayer = map.getLayer("terrain-tiles");

    // Hide all base layers first
    if (satelliteLayer) map.setLayoutProperty("satellite-tiles", "visibility", "none");
    if (aerialLayer) map.setLayoutProperty("aerial-tiles", "visibility", "none");
    if (streetsLayer) map.setLayoutProperty("streets-tiles", "visibility", "none");
    if (terrainLayer) map.setLayoutProperty("terrain-tiles", "visibility", "none");

    // Show the selected base layer
    const layerId = baseMap === "satellite" ? "satellite-tiles" :
                   baseMap === "aerial" ? "aerial-tiles" :
                   baseMap === "streets" ? "streets-tiles" : "terrain-tiles";

    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", "visible");
    }
  }, [baseMap, mapLoaded]);

  // Handle building visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    const buildingsLayer = map.getLayer("buildings");
    if (buildingsLayer) {
      map.setLayoutProperty("buildings", "visibility", showBuildings ? "visible" : "none");
    }
  }, [showBuildings, mapLoaded]);

  // Handle label visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Control visibility of text layers
    const textLayers = ["place-labels", "poi-labels", "road-labels"];
    textLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", showLabels ? "visible" : "none");
      }
    });
  }, [showLabels, mapLoaded]);

  // Update center and zoom with DEM-safe handling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    try {
      // Temporarily disable terrain during navigation to avoid DEM range errors
      const hadTerrain = !!map.getTerrain();
      if (hadTerrain) {
        map.setTerrain(null);
      }
      
      map.easeTo({
        center: [center[1], center[0]],
        zoom: zoom,
        duration: 500,
      });
      
      // Re-enable terrain after navigation completes
      if (hadTerrain && is3DEnabled) {
        setTimeout(() => {
          try {
            if (map.getSource("terrainSource")) {
              map.setTerrain({ source: "terrainSource", exaggeration: 1.5 });
            }
          } catch (e) {
            console.warn("Could not re-enable terrain:", e);
          }
        }, 600);
      }
    } catch (error) {
      console.warn("Error updating map center:", error);
    }
  }, [center, zoom, is3DEnabled]);

  // Handle selection mode clicks
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous handler if exists
    if (clickHandlerRef.current) {
      map.off("click", clickHandlerRef.current);
      clickHandlerRef.current = null;
    }

    if (selectionMode && onLocationSelect) {
      const handleClick = async (e: maplibregl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        const locationName = await reverseGeocode(lat, lng);
        onLocationSelect({ lat, lng, name: locationName });
      };

      clickHandlerRef.current = handleClick;
      map.on("click", handleClick);
      map.getCanvas().style.cursor = "crosshair";
    } else {
      map.getCanvas().style.cursor = "";
    }

    return () => {
      if (clickHandlerRef.current && map) {
        map.off("click", clickHandlerRef.current);
      }
    };
  }, [selectionMode, onLocationSelect]);

  // Update heatmap layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Remove existing heatmap layer
    if (map.getLayer("heatmap-layer")) {
      map.removeLayer("heatmap-layer");
    }
    if (map.getSource("heatmap-source")) {
      map.removeSource("heatmap-source");
    }

    if (activeHeatmapLayer === "none") return;

    const environmentalData = generateEnvironmentalData(activeHeatmapLayer);
    
    // Color schemes for different layers
    const colorSchemes: Record<string, string[]> = {
      vegetation: ["#f7fcb9", "#addd8e", "#31a354", "#006837"],
      temperature: ["#ffffb2", "#fecc5c", "#fd8d3c", "#e31a1c"],
      rainfall: ["#f1eef6", "#bdc9e1", "#74a9cf", "#0570b0"],
    };

    const colors = colorSchemes[activeHeatmapLayer] || colorSchemes.vegetation;

    // Add heatmap source and layer
    map.addSource("heatmap-source", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: environmentalData.map(point => ({
          type: "Feature" as const,
          properties: { intensity: point.intensity },
          geometry: {
            type: "Point" as const,
            coordinates: [point.lng, point.lat],
          },
        })),
      },
    });

    map.addLayer({
      id: "heatmap-layer",
      type: "heatmap",
      source: "heatmap-source",
      paint: {
        "heatmap-weight": ["get", "intensity"],
        "heatmap-intensity": 1.2,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(0,0,0,0)",
          0.1, colors[0],
          0.3, colors[1],
          0.5, colors[2],
          0.7, colors[3],
          1, colors[3],
        ],
        "heatmap-radius": 40,
        "heatmap-opacity": 0.75,
      },
    });
    
    console.log(`Heatmap layer "${activeHeatmapLayer}" added with ${environmentalData.length} points`);
  }, [activeHeatmapLayer, mapLoaded, generateEnvironmentalData]);

  // Update markers
  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const map = mapInstanceRef.current;
    if (!map) return;

    // Add new markers with error handling for DEM issues
    markers.forEach(marker => {
      try {
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.innerHTML = `
          <div style="
            background: linear-gradient(135deg, ${marker.color || "#0891b2"}, ${marker.color || "#0891b2"}dd);
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <strong style="font-size: 14px;">${marker.label}</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
              ${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}
            </p>
          </div>
        `);

        const mapMarker = new maplibregl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(mapMarker);
      } catch (error) {
        console.warn("Error adding marker:", error);
      }
    });

    // Fit bounds if markers exist - with DEM-safe handling
    if (markers.length > 0 && markers.length < 10) {
      try {
        // Temporarily disable terrain during fitBounds to avoid DEM range errors
        const hadTerrain = !!map.getTerrain();
        if (hadTerrain) {
          map.setTerrain(null);
        }
        
        const bounds = new maplibregl.LngLatBounds();
        markers.forEach(m => bounds.extend([m.lng, m.lat]));
        map.fitBounds(bounds, { padding: 50, maxZoom: 12 });
        
        // Re-enable terrain after fitBounds completes
        if (hadTerrain) {
          setTimeout(() => {
            try {
              if (map.getSource("terrainSource")) {
                map.setTerrain({ source: "terrainSource", exaggeration: 1.5 });
              }
            } catch (e) {
              console.warn("Could not re-enable terrain after fitBounds:", e);
            }
          }, 500);
        }
      } catch (error) {
        console.warn("Error fitting bounds:", error);
      }
    }
  }, [markers]);

  // Update selected area visualization
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    try {
      // Remove existing selection layer
      if (map.getLayer("selection-circle")) {
        map.removeLayer("selection-circle");
      }
      if (map.getLayer("selection-outline")) {
        map.removeLayer("selection-outline");
      }
      if (map.getSource("selection-source")) {
        map.removeSource("selection-source");
      }

      if (!selectedArea) return;

      // Create circle geometry
      const radius = (selectedArea.radius || 5000) / 1000; // Convert to km
      const points = 64;
      const coords: [number, number][] = [];
      
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const dx = radius * Math.cos(angle) / 111; // Approximate degrees
        const dy = radius * Math.sin(angle) / (111 * Math.cos(selectedArea.lat * Math.PI / 180));
        coords.push([selectedArea.lng + dy, selectedArea.lat + dx]);
      }
      coords.push(coords[0]); // Close the circle

      map.addSource("selection-source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [coords],
          },
        },
      });

      map.addLayer({
        id: "selection-circle",
        type: "fill",
        source: "selection-source",
        paint: {
          "fill-color": "#0891b2",
          "fill-opacity": 0.15,
        },
      });

      map.addLayer({
        id: "selection-outline",
        type: "line",
        source: "selection-source",
        paint: {
          "line-color": "#0891b2",
          "line-width": 2,
        },
      });

      // Add center marker
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="position: relative;">
          <div style="
            position: absolute;
            width: 40px;
            height: 40px;
            background: rgba(8, 145, 178, 0.3);
            border-radius: 50%;
            animation: pulse 1.5s ease-out infinite;
            left: -8px;
            top: -8px;
          "></div>
          <div style="
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #0891b2, #0e7490);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          "></div>
        </div>
      `;

      const selectionMarker = new maplibregl.Marker(el)
        .setLngLat([selectedArea.lng, selectedArea.lat])
        .addTo(map);

      markersRef.current.push(selectionMarker);
    } catch (error) {
      console.warn("Error updating selected area:", error);
    }
  }, [selectedArea, mapLoaded]);

  // Update polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    try {
      // Remove existing polygon layers
      for (let i = 0; i < 20; i++) {
        if (map.getLayer(`polygon-${i}`)) {
          map.removeLayer(`polygon-${i}`);
        }
        if (map.getLayer(`polygon-outline-${i}`)) {
          map.removeLayer(`polygon-outline-${i}`);
        }
        if (map.getSource(`polygon-source-${i}`)) {
          map.removeSource(`polygon-source-${i}`);
        }
      }

      if (polygons.length === 0) return;

      console.log("Adding polygons:", polygons);

      // Add new polygons
      polygons.forEach((polygon, index) => {
        if (!polygon.coordinates || polygon.coordinates.length < 3) {
          console.warn(`Polygon ${index} has insufficient coordinates`);
          return;
        }

        // Coordinates should already be in [lng, lat] format for MapLibre GeoJSON
        const coordinates = polygon.coordinates.map(coord => {
          // coord is [lng, lat] - use as is
          return [coord[0], coord[1]] as [number, number];
        });

        console.log(`Polygon ${index} coordinates:`, coordinates);
        
        map.addSource(`polygon-source-${index}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: { label: polygon.label },
            geometry: {
              type: "Polygon",
              coordinates: [coordinates],
            },
          },
        });

        map.addLayer({
          id: `polygon-${index}`,
          type: "fill",
          source: `polygon-source-${index}`,
          paint: {
            "fill-color": polygon.color || "#0891b2",
            "fill-opacity": polygon.fillOpacity || 0.3,
          },
        });

        map.addLayer({
          id: `polygon-outline-${index}`,
          type: "line",
          source: `polygon-source-${index}`,
          paint: {
            "line-color": polygon.color || "#0891b2",
            "line-width": 3,
            "line-dasharray": [2, 1],
          },
        });

        // Add label popup at center
        const centerLng = coordinates.reduce((sum, c) => sum + c[0], 0) / coordinates.length;
        const centerLat = coordinates.reduce((sum, c) => sum + c[1], 0) / coordinates.length;
        
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "polygon-label-popup",
        })
          .setLngLat([centerLng, centerLat])
          .setHTML(`<div style="padding: 4px 8px; font-weight: bold; font-size: 12px;">${polygon.label}</div>`)
          .addTo(map);
      });
    } catch (error) {
      console.error("Error updating polygons:", error);
    }
  }, [polygons, mapLoaded]);

  return (
    <div className={`relative ${className}`} style={{ height: "100%", width: "100%" }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .maplibregl-ctrl-group {
          background: hsl(var(--background)) !important;
          border: 1px solid hsl(var(--border)) !important;
        }
        .maplibregl-ctrl-group button {
          background-color: transparent !important;
        }
        .maplibregl-ctrl-group button:hover {
          background-color: hsl(var(--muted)) !important;
        }
        .maplibregl-ctrl-group button span {
          filter: invert(0.5);
        }
        .polygon-label-popup .maplibregl-popup-content {
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 0;
        }
        .polygon-label-popup .maplibregl-popup-tip {
          border-top-color: hsl(var(--card));
        }
        .maplibregl-popup-content {
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default MapLibreMap;
