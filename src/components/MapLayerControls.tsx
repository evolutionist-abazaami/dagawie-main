import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Layers, Mountain, Thermometer, CloudRain, TreePine, X, Satellite, Map, Building, Eye } from "lucide-react";
import { HeatmapLayerType } from "./MapLibreMap";

export type BaseMapType = "satellite" | "aerial" | "streets" | "terrain";

interface MapLayerControlsProps {
  is3DEnabled: boolean;
  onToggle3D: (enabled: boolean) => void;
  activeHeatmapLayer: HeatmapLayerType;
  onHeatmapLayerChange: (layer: HeatmapLayerType) => void;
  baseMap: BaseMapType;
  onBaseMapChange: (mapType: BaseMapType) => void;
  showBuildings: boolean;
  onToggleBuildings: (show: boolean) => void;
  showLabels: boolean;
  onToggleLabels: (show: boolean) => void;
}

const MapLayerControls = ({
  is3DEnabled,
  onToggle3D,
  activeHeatmapLayer,
  onHeatmapLayerChange,
  baseMap,
  onBaseMapChange,
  showBuildings,
  onToggleBuildings,
  showLabels,
  onToggleLabels,
}: MapLayerControlsProps) => {
  const heatmapLayers = [
    { value: "vegetation" as const, label: "Vegetation Density", icon: TreePine, color: "text-green-500" },
    { value: "temperature" as const, label: "Temperature", icon: Thermometer, color: "text-red-500" },
    { value: "rainfall" as const, label: "Rainfall", icon: CloudRain, color: "text-blue-500" },
    { value: "none" as const, label: "No Heatmap", icon: X, color: "text-muted-foreground" },
  ];

  const baseMaps = [
    { value: "satellite" as const, label: "Satellite", icon: Satellite, description: "High-res satellite imagery" },
    { value: "aerial" as const, label: "Aerial", icon: Eye, description: "Aerial photography" },
    { value: "streets" as const, label: "Streets", icon: Map, description: "Street map" },
    { value: "terrain" as const, label: "Terrain", icon: Mountain, description: "Topographic map" },
  ];

  const activeLayer = heatmapLayers.find(l => l.value === activeHeatmapLayer);
  const activeBaseMap = baseMaps.find(m => m.value === baseMap);

  return (
    <Card className="p-1.5 sm:p-2 bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Base Map Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            >
              <activeBaseMap.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{activeBaseMap.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Base Map</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {baseMaps.map((map) => (
              <DropdownMenuItem
                key={map.value}
                onClick={() => onBaseMapChange(map.value)}
                className="flex items-center gap-2"
              >
                <map.icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{map.label}</span>
                  <span className="text-xs text-muted-foreground">{map.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3D Toggle */}
        <Button
          variant={is3DEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => onToggle3D(!is3DEnabled)}
          className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
        >
          <Mountain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">3D</span>
          <span className="hidden sm:inline"> Terrain</span>
        </Button>

        {/* Buildings Toggle */}
        <Button
          variant={showBuildings ? "default" : "outline"}
          size="sm"
          onClick={() => onToggleBuildings(!showBuildings)}
          className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          disabled={!is3DEnabled}
        >
          <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Buildings</span>
        </Button>

        {/* Heatmap Layer Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 ${activeLayer?.color || ""}`}
            >
              {activeLayer && <activeLayer.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span className="hidden sm:inline">{activeLayer?.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Environmental Data</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {heatmapLayers.map((layer) => (
              <DropdownMenuItem
                key={layer.value}
                onClick={() => onHeatmapLayerChange(layer.value)}
                className="flex items-center gap-2"
              >
                <layer.icon className={`h-4 w-4 ${layer.color}`} />
                {layer.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default MapLayerControls;
