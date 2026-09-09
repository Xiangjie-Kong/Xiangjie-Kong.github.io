/* Leaflet / OpenStreetMap display; real visits and aggregates from FeedPulse.
 * API paths follow FeedPulse's traffic-feed.js and hit-counter.js widgets.
 * Country centers: https://github.com/mledoze/countries (ODbL 1.0).
 * Snapshot: 2026-09-10. Markers represent countries, not precise visitor coordinates.
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
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://github.com/mledoze/countries">Country data</a>'
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
    const started = Date.now();
    try {
      const response = await fetch(`${api}/track/${site}`, {
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
      if (!response.ok) throw new Error(`FeedPulse tracking returned HTTP ${response.status}`);
      console.info("[Visitor map] Tracking response", Date.now() - started, await response.json());
    } catch (error) {
      console.warn("[Visitor map] Tracking failed", Date.now() - started, error);
      // A failed or uncertain write is not retried; the read below stays useful.
    }
  }

  async function read(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Visitor statistics unavailable");
    return response.json();
  }

  const [totals, locations, centers] = await Promise.allSettled([
    read(`${api}/widget/hits/${site}?base=0&reset_at=0&reset_to=0`),
    read(`${api}/widget/traffic/${site}?limit=400&include_bots=0`),
    read("/assets/data/visitor-countries.json")
  ]);
  if (totals.status === "fulfilled" && Number.isSafeInteger(totals.value?.total) && totals.value.total >= 0) {
    count.textContent = totals.value.total.toLocaleString("en-US");
  } else {
    count.parentElement.textContent = "Visitor statistics are temporarily unavailable.";
  }
  if (locations.status !== "fulfilled" || !Array.isArray(locations.value?.visits) ||
      centers.status !== "fulfilled" || !centers.value || typeof centers.value !== "object") {
    status.textContent = "Visitor locations are temporarily unavailable.";
    return;
  }
  const countries = new Map();
  const now = Date.now();
  // ponytail: show the latest 400 visits within 24 hours; add archival storage if needed.
  locations.value.visits.forEach(visit => {
    if (!visit || visit.is_bot || !/^[A-Z]{2}$/.test(visit.country_code)) return;
    const age = now - Date.parse(visit.created_at);
    const point = centers.value[visit.country_code];
    if (!Number.isFinite(age) || age < 0 || age > 86400000 || !Array.isArray(point) ||
        !Number.isFinite(point[0]) || Math.abs(point[0]) > 90 ||
        !Number.isFinite(point[1]) || Math.abs(point[1]) > 180 || typeof point[2] !== "string") return;
    countries.set(visit.country_code, point);
  });
  status.textContent = countries.size ? "Past 24 hours · approximate country/region locations." : "No recent visitor locations yet.";
  if (!map) return;
  const icon = L.divIcon({ className: "visitor-map__dot", iconSize: [8, 8] });
  countries.forEach(point => {
    const label = document.createElement("span");
    label.textContent = `${point[2]} — approximate country/region location`;
    L.marker([point[0], point[1]], { icon, title: label.textContent })
      .addTo(map).bindPopup(label, { maxWidth: 220 });
  });
})();
