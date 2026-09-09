// Run: node .github/tests/visitor-map.cjs (no dependencies or network requests).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../../assets/js/visitor-map.js"), "utf8");

async function run({ hostname = "localhost", totals = { total: 7 }, points = [], fail = false, leaflet = true } = {}) {
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
      return { ok: true, json: async () => url.includes("widget/hits") ? totals : { points } };
    }
  });
  return { calls, markers, popups, nodes };
}

(async () => {
  const local = await run({ points: [
    { lat: 22.3, lng: 113.5, city: "<img src=x onerror=alert(1)>" },
    { lat: null, lng: 0 }, { lat: 91, lng: 0 }, { lat: 0, lng: 181 }, null
  ] });
  assert.equal(local.calls.length, 2, "Previews must only read statistics");
  assert.equal(local.nodes["visitor-map-count"].textContent, "7");
  assert.deepEqual(local.markers, [[22.3, 113.5]], "Reject invalid coordinates");
  assert.equal(local.popups[0].textContent, "<img src=x onerror=alert(1)>", "Popup content must remain text");

  const live = await run({ hostname: "xiangjie-kong.github.io", totals: { total: 0 } });
  assert.equal(live.calls.filter(c => c.options.method === "POST").length, 1);
  assert.equal(JSON.parse(live.calls[0].options.body).host, "xiangjie-kong.github.io");
  assert.equal(live.nodes["visitor-map-count"].textContent, "0", "A verified zero is valid");

  const offline = await run({ hostname: "xiangjie-kong.github.io", fail: true });
  assert.equal(offline.calls.length, 3, "An uncertain tracking write must not be retried");
  assert.match(offline.nodes["visitor-map-count"].parentElement.textContent, /unavailable/);
  assert.match(offline.nodes["visitor-map-status"].textContent, /unavailable/);

  const malformed = await run({ totals: null, points: null });
  assert.match(malformed.nodes["visitor-map-count"].parentElement.textContent, /unavailable/);
  const noMap = await run({ leaflet: false });
  assert.match(noMap.nodes["visitor-map"].textContent, /could not load/);
  assert.equal(noMap.nodes["visitor-map-count"].textContent, "7", "Statistics should work without Leaflet");
  console.log("PASS: real counts, safe coordinates and popup text, preview isolation, graceful failures, no write retries.");
})().catch(error => { console.error(error); process.exitCode = 1; });
