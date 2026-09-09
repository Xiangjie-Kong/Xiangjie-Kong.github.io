/* Counts: https://abacus.jasoncameron.dev — /hit writes once; /get only reads.
 * Migrated the verified FeedPulse total of 13 on 2026-09-10; no synthetic visits.
 * FeedPulse remains an independent source of approximate visitor locations.
 * Country centers: https://github.com/mledoze/countries (ODbL 1.0), 2026-09-10.
 */
(async function () {
  "use strict";
  const container = document.getElementById("visitor-map");
  if (!container) return;
  const count = document.getElementById("visitor-map-count");
  const countLabel = document.getElementById("visitor-count-label");
  const status = document.getElementById("visitor-map-status");
  const publicHomepage = location.hostname === "xiangjie-kong.github.io";
  const counter = "https://abacus.jasoncameron.dev";
  const counterKey = "xiangjie-kong.github.io/homepage-20260910";
  let visitUnconfirmed = false;

  async function read(url, options = {}) {
    const response = await fetch(url, {
      cache: "no-store", ...options, signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(`Visitor service returned HTTP ${response.status}`);
    return response.json();
  }

  async function updateCount(increment = false) {
    try {
      const result = await read(`${counter}/${increment ? "hit" : "get"}/${counterKey}`, { keepalive: increment });
      if (!Number.isSafeInteger(result?.value) || result.value < 0) throw new Error("Invalid visitor count");
      count.textContent = result.value.toLocaleString("en-US");
      countLabel.textContent = visitUnconfirmed ? "page views · this visit is unconfirmed" : "page views since September 2026";
    } catch (error) {
      console.warn("[Visitor map] Counter unavailable", error);
      if (increment) {
        // An uncertain increment is never retried: reconcile with a read instead.
        visitUnconfirmed = true;
        await updateCount();
      } else {
        countLabel.textContent = "page views · count temporarily unavailable";
      }
    }
  }

  async function startCount() {
    // Local previews only read. Polls never add page views.
    await updateCount(publicHomepage);
    setInterval(() => {
      if (!document.hidden) return updateCount();
    }, 30000);
  }

  async function showLocations() {
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

    let locationUnconfirmed = false;
    if (publicHomepage) {
      try {
        await read(`${api}/track/${site}`, {
          method: "POST", keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: location.host, landing_page: location.pathname,
            title: document.title, referrer: document.referrer || "direct",
            session_id: crypto.randomUUID()
          })
        });
      } catch (error) {
        locationUnconfirmed = true;
        console.warn("[Visitor map] Location tracking unavailable; visit count is independent", error);
      }
    }

    const [locations, centers] = await Promise.allSettled([
      read(`${api}/widget/traffic/${site}?limit=400&include_bots=0`),
      read("/assets/data/visitor-countries.json")
    ]);
    if (locations.status !== "fulfilled" || !Array.isArray(locations.value?.visits) ||
        centers.status !== "fulfilled" || !centers.value || typeof centers.value !== "object") {
      status.textContent = "Visitor locations are temporarily unavailable.";
      return;
    }
    const countries = new Map();
    const now = Date.now();
    // ponytail: latest 400 visits within 24 hours; add archival storage if needed.
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
    if (locationUnconfirmed) status.textContent += " Some locations are unavailable.";
    if (!map) return;
    const icon = L.divIcon({ className: "visitor-map__dot", iconSize: [8, 8] });
    countries.forEach(point => {
      const label = document.createElement("span");
      label.textContent = `${point[2]} — approximate country/region location`;
      L.marker([point[0], point[1]], { icon, title: label.textContent })
        .addTo(map).bindPopup(label, { maxWidth: 220 });
    });
  }

  // Location-service failures must never stop the independent page-view counter.
  await Promise.allSettled([startCount(), showLocations()]);
})();
