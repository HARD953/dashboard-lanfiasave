import type { TerritoryRow } from "@/lib/types";

/** Localité placée sur la carte, avec la valeur de l'indicateur choisi. */
export type MapPoint = TerritoryRow & { latitude: number; longitude: number; value: number };

/** Du bleu (faible) à l'orange puis au rouge (fort). */
export function heatColor(ratio: number) {
  if (ratio > 0.75) return "#B03318";
  if (ratio > 0.5) return "#D08A00";
  if (ratio > 0.25) return "#1A8FD1";
  return "#4FB3E8";
}
