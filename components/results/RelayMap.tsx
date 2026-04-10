"use client";

import { useEffect, useRef } from "react";
import type { IPResult } from "@/types";

interface Props {
  ipResults: IPResult[];
}

// This component is only ever loaded via dynamic import with ssr:false
export default function RelayMap({ ipResults }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || ipResults.length === 0) return;

    let cancelled = false;

    // Dynamic imports to avoid SSR issues
    import("leaflet").then((L) => {
      // Bail if the effect was cleaned up while the import was in-flight
      if (cancelled || !mapRef.current) return;

      // Bail if another render already created the instance
      if (mapInstanceRef.current) return;

      // Safety: if a prior Leaflet instance is still attached to the DOM node
      // (e.g. StrictMode cleanup didn't fully remove it), tear it down first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).L?.map(mapRef.current)?.remove?.();
      }

      // Fix default marker icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const validIps = ipResults.filter((ip) => ip.lat !== 0 || ip.lon !== 0);
      if (validIps.length === 0 || !mapRef.current) return;

      // Create map
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      });
      mapInstanceRef.current = map;

      // Dark OSM tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        className: "map-tiles-dark",
      }).addTo(map);

      // Add markers + polyline
      const points: [number, number][] = [];

      validIps.forEach((ip) => {
        const color = ip.riskLevel === "CLEAN" ? "var(--color-hawk-green)" : ip.riskLevel === "MALICIOUS" ? "#ff4444" : "#ffaa00";
        const point: [number, number] = [ip.lat, ip.lon];
        points.push(point);

        // Custom circle marker
        const circle = L.circleMarker(point, {
          radius: 10,
          fillColor: color,
          color: "var(--color-hawk-bg)",
          fillOpacity: 0.85,
          weight: 2,
        }).addTo(map);

        // Popup
        circle.bindPopup(
          `<div style="background:var(--hawk-bg);color:#e0e0e0;padding:10px;border-radius:8px;font-family:monospace;font-size:11px;min-width:180px">
            <div style="color:${color};font-weight:bold;margin-bottom:6px">Hop #${ip.hopNumber}</div>
            <div><span style="color:#555566">IP: </span>${ip.ip}</div>
            <div><span style="color:#555566">Location: </span>${ip.city}, ${ip.country}</div>
            <div><span style="color:#555566">ISP: </span>${ip.isp || "—"}</div>
            <div><span style="color:#555566">Abuse Score: </span><span style="color:${color}">${ip.abuseScore}/100</span></div>
            ${ip.isTor ? '<div style="color:#ff4444;margin-top:4px">⚠ Tor Node</div>' : ""}
            ${ip.isProxy ? '<div style="color:#ffaa00;margin-top:4px">⚠ Proxy Detected</div>' : ""}
          </div>`,
          { className: "leaflet-popup-dark" }
        );
      });

      // Connecting polyline
      if (points.length > 1) {
        L.polyline(points, {
          color: "var(--color-hawk-green)",
          weight: 2,
          opacity: 0.6,
          dashArray: "5, 8",
        }).addTo(map);
      }

      // Fit bounds
      if (points.length === 1) {
        map.setView(points[0], 5);
      } else if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      }
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ipResults]);

  if (ipResults.filter(ip => ip.lat !== 0 || ip.lon !== 0).length === 0) {
    return (
      <div className="card-hawk p-6">
        <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase mb-4">Relay Map</h2>
        <div className="h-48 flex items-center justify-center text-sm text-hawk-muted font-mono">
          No geolocation data available for relay IPs
        </div>
      </div>
    );
  }

  return (
    <div className="card-hawk overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-0">
        <h2 className="text-xs font-mono font-bold text-hawk-muted tracking-widest uppercase mb-4">
          Relay Map
        </h2>
        <div className="flex items-center gap-4 text-[10px] font-mono pb-4">
          {[["var(--color-hawk-green)","Clean"],["#ffaa00","Suspicious"],["#ff4444","Malicious"]].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-hawk-muted">{l}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="border-t-2 border-dashed w-4" style={{ borderColor: "var(--color-hawk-green)" }} />
            <span className="text-hawk-muted">Route</span>
          </span>
        </div>
      </div>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={mapRef}
        className="w-full"
        style={{ height: 420 }}
        id="relay-map"
      />
    </div>
  );
}
