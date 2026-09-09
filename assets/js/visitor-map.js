/* Leaflet / OpenStreetMap display; real visits and aggregates from FeedPulse.
 * Public dashboard: https://feed-pulse.com/dashboard?site=bc8eec62-85f7-44af-98dd-4e4e894105ab
 * API paths follow FeedPulse's visitor-globe.js and hit-counter.js widgets.
 */
(async function () {
  "use strict";
  const container = document.getElementById("visitor-map");
  if (!container) return;
  const count = document.getElementById("visitor-map-count");
  const status = document.getElementById("visitor-map-status");
  const api = "https://feed-pulse.com/api";
  const site = encodeURIComponent(container.dataset.siteId);
  let map;

  if (typeof L !== "undefined") {
    container.textContent = "";
    map = L.map(container, { scrollWheelZoom: false, zoomSnap: 0, minZoom: 0, maxZoom: 6 });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      noWrap: true,
      bounds: [[-85.0511, -180], [85.0511, 180]],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    const fit = () => {
      map.invalidateSize();
      map.setView([20, 0], Math.max(0, Math.log2(container.clientWidth / 256)), { animate: false });
    };
    fit();
    new ResizeObserver(fit).observe(container);
  } else {
    container.textContent = "The map could not load. Please try again later.";
  }

  // Count only the public homepage; local previews and tests must not add visits.
  if (location.hostname === "xiangjie-kong.github.io") {
    try {
      await fetch(`${api}/track/${site}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: location.host,
          landing_page: location.pathname,
          title: document.title,
          referrer: document.referrer || "direct",
          session_id: crypto.randomUUID()
        }),
        signal: AbortSignal.timeout(8000)
      });
    } catch (_) {
      // A failed or uncertain write is not retried; the read below stays useful.
    }
  }

  async function read(path) {
    const response = await fetch(`${api}/${path}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Visitor statistics unavailable");
    return response.json();
  }

  const [totals, locations] = await Promise.allSettled([
    read(`widget/hits/${site}?base=0&reset_at=0&reset_to=0`),
    read(`visitor-map/${site}?hours=24&limit=400`)
  ]);
  if (totals.status === "fulfilled" && Number.isSafeInteger(totals.value?.total) && totals.value.total >= 0) {
    count.textContent = totals.value.total.toLocaleString("en-US");
  } else {
    count.parentElement.textContent = "Visitor statistics are temporarily unavailable.";
  }
  if (locations.status !== "fulfilled" || !Array.isArray(locations.value?.points)) {
    status.textContent = "Visitor locations are temporarily unavailable.";
    return;
  }
  const points = locations.value.points.filter(p => p &&
    Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 &&
    Number.isFinite(p.lng) && Math.abs(p.lng) <= 180);
  // ponytail: use the provider's recent 400-point window; add archival storage only if needed.
  status.textContent = points.length ? "Recent locations (past 24 hours)." : "No recent visitor locations yet.";
  if (!map) return;
  const icon = L.divIcon({ className: "visitor-map__dot", iconSize: [8, 8] });
  points.forEach(point => {
    const label = document.createElement("span");
    label.textContent = [point.city, point.country].filter(v => typeof v === "string" && v).join(", ") || "Visitor location";
    L.marker([point.lat, point.lng], { icon, title: label.textContent })
      .addTo(map).bindPopup(label);
  });
})();
