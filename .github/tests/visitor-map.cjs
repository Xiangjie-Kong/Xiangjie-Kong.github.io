// Run: node .github/tests/visitor-map.cjs (no dependencies or network requests).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../../assets/js/visitor-map.js"), "utf8");
const coordinates = JSON.parse(fs.readFileSync(path.join(__dirname, "../../assets/data/visitor-countries.json"), "utf8"));
async function run({ hostname = "localhost", countryStats = { countries: [] }, leaflet = true, geoStatus = 200, hitFailure = "" } = {}) {
  const calls = [], markers = [], popups = [], timers = [], warnings = [];
  const state = { value: 13, readFailure: false };
  const nodes = {
    "visitor-map": { dataset: { siteId: "test-site" }, clientWidth: 494 },
    "visitor-map-count": { textContent: "—" },
    "visitor-count-label": {}, "visitor-map-status": {}
  };
  const document = { hidden: false, title: "Home", referrer: "", getElementById: id => nodes[id], createElement: () => ({}) };
  const map = { invalidateSize() {}, setView() {} };
  await vm.runInNewContext(source, {
    document, location: { hostname, host: hostname, pathname: "/" },
    crypto: { randomUUID: () => "test-session" }, AbortSignal,
    console: { warn: (...args) => warnings.push(args) },
    setInterval: (fn, ms) => timers.push({ fn, ms }),
    ResizeObserver: class { observe() {} },
    L: leaflet ? {
      map: () => map, tileLayer: () => ({ addTo() {} }), divIcon: options => options,
      marker: coords => ({ addTo() { markers.push(Array.from(coords)); return this; }, bindPopup: node => popups.push(node) })
    } : undefined,
    fetch: async (url, options = {}) => {
      calls.push({ url, options });
      if (url.includes("abacus.jasoncameron.dev")) {
        if (url.includes("/hit/")) {
          if (hitFailure === "before") throw new Error("Network unavailable");
          state.value++;
          if (hitFailure === "after") throw new Error("Response lost after server committed");
        } else if (state.readFailure) throw new Error("Read unavailable");
        return { ok: true, json: async () => ({ value: state.value }) };
      }
      return { ok: geoStatus === 200, status: geoStatus,
        json: async () => url.includes("widget/flags") ? countryStats : coordinates };
    }
  });
  return { calls, markers, popups, nodes, timers, warnings, state, document };
}
const hits = result => result.calls.filter(c => c.url.includes("/hit/"));

(async () => {
  const local = await run({ countryStats: { countries: [
    { country_code: "SG", count: 32, country_name: "<img src=x onerror=alert(1)>" },
    { country_code: "SG", count: 32 },
    { country_code: "US", count: 35 },
    { country_code: "CN", count: 0 }, { country_code: "MO", count: -1 },
    { country_code: "JP", count: "9" }, { country_code: "HK", count: 1.5 },
    { country_code: "ZZ", count: 1 }, { country_code: "XX", count: 50 },
    { country_code: "__proto__", count: 1 }, null
  ] } });
  assert.equal(hits(local).length, 0, "Local previews must not increment");
  assert.ok(local.calls.every(c => c.options.method !== "POST"));
  assert.deepEqual(local.markers, [[1.36666666, 103.8], [38, -97]]);
  assert.equal(local.popups[0].textContent, "Singapore — approximate country/region location");
  assert.match(local.nodes["visitor-map-status"].textContent, /All time/);
  assert.ok(local.calls.some(c => c.url === "https://feed-pulse.com/api/widget/flags/test-site?include_bots=0"));
  assert.ok(local.calls.every(c => !c.url.includes("widget/traffic")), "Recent traffic cannot recover historical countries");

  // Verified all-time FeedPulse country totals on 2026-10-21, including older locations.
  const history = await run({ countryStats: { all_time: 155, countries:
    [["XX", 50], ["US", 35], ["SG", 32], ["MO", 15], ["CN", 10],
     ["JP", 9], ["HK", 1], ["IN", 1], ["CA", 1], ["NL", 1]]
      .map(([country_code, count]) => ({ country_code, count }))
  } });
  assert.deepEqual(history.markers, ["US", "SG", "MO", "CN", "JP", "HK", "IN", "CA", "NL"]
    .map(code => coordinates[code].slice(0, 2)), "Restore all nine known locations, skip unknown XX");
  assert.equal(history.nodes["visitor-map-count"].textContent, "13", "Location totals must not replace the independent page-view counter");
  const manyCountries = Object.keys(coordinates).filter(code => /^[A-Z]{2}$/.test(code)).slice(0, 50);
  const fullMap = await run({ countryStats: { countries: manyCountries.map(country_code => ({ country_code, count: 1 })) } });
  assert.equal(fullMap.markers.length, 50, "Do not impose a top-country display limit");
  const malformed = await run({ countryStats: { visits: [] } });
  assert.match(malformed.nodes["visitor-map-status"].textContent, /unavailable/);
  assert.match((await run()).nodes["visitor-map-status"].textContent, /No visitor locations recorded/);

  const live = await run({ hostname: "xiangjie-kong.github.io", geoStatus: 403 });
  assert.equal(live.nodes["visitor-map-count"].textContent, "14", "FeedPulse rejection must not freeze the counter at 13");
  assert.equal(hits(live).length, 1);
  assert.match(live.nodes["visitor-map-status"].textContent, /unavailable/);
  assert.equal(live.timers[0].ms, 30000);
  live.state.value = 15; // A different visitor arrived.
  await live.timers[0].fn();
  await live.timers[0].fn();
  assert.equal(live.nodes["visitor-map-count"].textContent, "15");
  assert.equal(hits(live).length, 1, "Refreshing the display must not inflate visits");
  assert.ok(live.calls.every(c => c.options.cache === "no-store"));
  live.document.hidden = true;
  const before = live.calls.length;
  await live.timers[0].fn();
  assert.equal(live.calls.length, before, "Pause reads while the tab is hidden");
  live.document.hidden = false;
  live.state.readFailure = true;
  await live.timers[0].fn();
  assert.equal(live.nodes["visitor-map-count"].textContent, "15", "Keep the last confirmed value on read failure");
  assert.match(live.nodes["visitor-count-label"].textContent, /unavailable/);
  live.state.readFailure = false;
  live.state.value = 16;
  await live.timers[0].fn();
  assert.equal(live.nodes["visitor-map-count"].textContent, "16");
  assert.doesNotMatch(live.nodes["visitor-count-label"].textContent, /unavailable/);
  live.state.value = "invalid";
  await live.timers[0].fn();
  assert.equal(live.nodes["visitor-map-count"].textContent, "16");
  assert.match(live.nodes["visitor-count-label"].textContent, /unavailable/);

  for (const hitFailure of ["before", "after"]) {
    const uncertain = await run({ hostname: "xiangjie-kong.github.io", hitFailure });
    assert.equal(hits(uncertain).length, 1, "An uncertain write must never be retried");
    assert.equal(uncertain.nodes["visitor-map-count"].textContent, hitFailure === "after" ? "14" : "13");
    assert.match(uncertain.nodes["visitor-count-label"].textContent, /unconfirmed/);
  }
  const noMap = await run({ leaflet: false });
  assert.equal(noMap.nodes["visitor-map-count"].textContent, "13");
  assert.match(noMap.nodes["visitor-map"].textContent, /could not load/);
  console.log("PASS: all-time historical countries without display limits; safe map locations; FeedPulse 403 isolation; one increment per load; read-only polling; failure recovery; no uncertain write retries.");
})().catch(error => { console.error(error); process.exitCode = 1; });
