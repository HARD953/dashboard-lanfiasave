"use client";

/**
 * Carte géographique des localités (comme la carte des ventes de LanfiaLink) : un cercle par localité, placé au centre
 * de la localité. Sa taille et sa couleur suivent l'indicateur choisi ; un clic ouvre le détail.
 * Jamais la position d'un ménage : seulement des centres de localité et des chiffres agrégés.
 */
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { formatMoney, formatNumber } from "@/lib/format";
import { heatColor } from "@/lib/heat";

import type { MapPoint } from "@/lib/heat";


function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const key = points.map((p) => `${p.latitude},${p.longitude}`).join(";");
  useEffect(() => {
    if (!points.length) return;
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const sw: [number, number] = [Math.min(...lats), Math.min(...lngs)];
    const ne: [number, number] = [Math.max(...lats), Math.max(...lngs)];
    if (sw[0] === ne[0] && sw[1] === ne[1]) map.setView(sw, 11);
    else map.fitBounds([sw, ne], { padding: [40, 40], maxZoom: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recadrer seulement quand les positions changent
  }, [map, key]);
  return null;
}

export default function TerritoryMap({
  points,
  metricLabel,
  format,
}: {
  points: MapPoint[];
  metricLabel: string;
  format: (p: MapPoint) => string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <MapContainer center={[7.54, -5.55]} zoom={7} scrollWheelZoom className="size-full rounded-xl" style={{ background: "#EDF5FA" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitBounds points={points} />
      {[...points]
        .sort((a, b) => b.value - a.value)
        .map((p) => {
          const ratio = p.value / max;
          return (
            <CircleMarker
              key={p.territory ?? p.name}
              center={[p.latitude, p.longitude]}
              radius={7 + 22 * Math.sqrt(ratio)}
              pathOptions={{ color: "#fff", weight: 2, fillColor: heatColor(ratio), fillOpacity: 0.78 }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <b>{p.name}</b> · {format(p)}
              </Tooltip>
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.6, minWidth: 190 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1E2E" }}>{p.name}</div>
                  <div style={{ color: "#1A8FD1", fontWeight: 700, marginBottom: 4 }}>
                    {metricLabel} : {format(p)}
                  </div>
                  Ménages : <b>{formatNumber(p.households)}</b>
                  <br />
                  Personnes : <b>{p.suppressed ? "masqué" : formatNumber(p.persons)}</b>
                  <br />
                  Vulnérables : <b>{p.suppressed ? "masqué" : formatNumber(p.vulnerable_persons)}</b>
                  {p.vulnerability_rate !== null && ` (${p.vulnerability_rate} %)`}
                  <br />
                  Aides remises : <b>{formatNumber(p.aids_delivered)}</b> · {formatMoney(p.aid_amount)}
                  <br />
                  Dossiers ouverts : <b>{formatNumber(p.open_cases)}</b> · Plaintes : <b>{formatNumber(p.open_grievances)}</b>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
}
