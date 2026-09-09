// Run: node .github/tests/visitor-map.cjs (no dependencies or network requests).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../../assets/js/visitor-map.js"), "utf8");
const coordinates = JSON.parse(fs.readFileSync(path.join(__dirname, "../../assets/data/visitor-countries.json"), "utf8"));
const recent = new Date(Date.now() - 60000).toISOString();

async function run({ hostname = "localhost", totals = { total: 7 }, visits = [], fail = false, leaflet = true } = {}) {
  const calls = [], markers = [], popups = [];
  const nodes = {
    "visitor-map": { dataset: { siteId: "test-site" }, clientWidth: 494 },
    "visitor-map-count": { textContent: "—", parentElement: {} },
    "visitor-map-status": {}
  };
  const map = { invalidateSize() {}, setView() {} };
  await vm.runInNewContext(source, {
    document: { title: "Home", referrer: "", getElementById: id => nodes[id], createElement: () => ({}) },
    location: { hostname, host: hostname, pathname: "/" },
    crypto: { randomUUID: () => "test-session" }, AbortSignal,
    ResizeObserver: class { observe() {} },
    L: leaflet ? {
      map: () => map, tileLayer: () => ({ addTo() {} }), divIcon: options => options,
      marker: coords => ({ addTo() { markers.push(Array.from(coords)); return this; }, bindPopup: node => popups.push(node) })
    } : undefined,
    fetch: async (url, options = {}) => {
      calls.push({ url, options });
      if (fail) throw new Error("Offline");
      return { ok: true, json: async () => url.includes("widget/hits") ? totals :
        url.includes("widget/traffic") ? { visits } : coordinates };
    }
  });
  return { calls, markers, popups, nodes };
}

(async () => {
  const local = await run({ visits: [
    { country_code: "SG", created_at: recent, country_name: "<img src=x onerror=alert(1)>" },
    { country_code: "SG", created_at: recent },
    { country_code: "US", created_at: "2020-01-01T00:00:00Z" },
    { country_code: "US", created_at: recent, is_bot: true },
    { country_code: "US", created_at: "invalid" },
    { country_code: "ZZ", created_at: recent },
    { country_code: "__proto__", created_at: recent }, null
  ] });
  assert.equal(local.calls.length, 3, "Previews must only read statistics and country data");
  assert.ok(local.calls.every(c => !c.options.method), "Previews must not track visits");
  assert.equal(local.nodes["visitor-map-count"].textContent, "7");
  assert.deepEqual(local.markers, [[1.36666666, 103.8]], "Deduplicate countries; reject bots, old visits and unknown locations");
  assert.equal(local.popups[0].textContent, "Singapore — approximate country/region location");

  const live = await run({ hostname: "xiangjie-kong.github.io", totals: { total: 0 } });
  assert.equal(live.calls.filter(c => c.options.method === "POST").length, 1);
  assert.equal(JSON.parse(live.calls[0].options.body).host, "xiangjie-kong.github.io");
  assert.equal(live.nodes["visitor-map-count"].textContent, "0", "A verified zero is valid");

  const offline = await run({ hostname: "xiangjie-kong.github.io", fail: true });
  assert.equal(offline.calls.length, 4, "An uncertain tracking write must not be retried");
  assert.match(offline.nodes["visitor-map-count"].parentElement.textContent, /unavailable/);
  assert.match(offline.nodes["visitor-map-status"].textContent, /unavailable/);

  const malformed = await run({ totals: null, visits: null });
  assert.match(malformed.nodes["visitor-map-count"].parentElement.textContent, /unavailable/);
  const noMap = await run({ leaflet: false });
  assert.match(noMap.nodes["visitor-map"].textContent, /could not load/);
  assert.equal(noMap.nodes["visitor-map-count"].textContent, "7", "Statistics should work without Leaflet");
  for (const [code, point] of Object.entries(coordinates)) {
    if (code.startsWith("_")) continue;
    assert.match(code, /^[A-Z]{2}$/);
    assert.ok(Number.isFinite(point[0]) && Math.abs(point[0]) <= 90);
    assert.ok(Number.isFinite(point[1]) && Math.abs(point[1]) <= 180);
  }
  console.log("PASS: real counts, recent country locations, bot filtering, preview isolation, graceful failures, no write retries.");
})().catch(error => { console.error(error); process.exitCode = 1; });
