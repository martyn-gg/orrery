// Checks the orrery against published figures and against itself.
//
//   npm install --no-save --include=dev playwright   (once; node_modules is gitignored)
//   node tools/check.mjs
//
// Serves the repo on a local port, drives the page in headless Chromium and
// prints one line per check. Exits non-zero if any check fails. Set
// CHROMIUM_PATH to use a particular browser build.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png",
  ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json" };
const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try {
    const body = await readFile(join(ROOT, path === "/" ? "index.html" : path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let failures = 0;
const ok = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`${pass ? "pass" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
};
const J2000 = Date.UTC(2000, 0, 1, 12);
const days = iso => (Date.parse(iso) - J2000) / 86400000;
const isoOf = t => new Date(J2000 + t * 86400000).toISOString();

async function open(opts = {}, hash = "") {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: "Europe/London", ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(BASE + "?test" + hash);
  await page.waitForTimeout(1200);
  return { ctx, page, errors };
}

// 1. The page loads cleanly at desktop and phone sizes.
for (const [label, opts] of [["desktop", {}], ["phone", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
  const { ctx, errors } = await open(opts);
  ok(`loads without errors (${label})`, errors.length === 0, errors.slice(0, 2).join("; "));
  await ctx.close();
}

const { ctx, page } = await open();
const T = (expr, ...args) => page.evaluate(expr, ...args);

// 2. Event dates against published tables (dates in UTC).
const ev = await T(([f]) => {
  const o = window.orreryTest; o.setT(f);
  const r = {};
  for (const [n, max] of [["Mars", true], ["Jupiter", true], ["Saturn", true], ["Venus", true], ["Mars", false]])
    r[n + (max ? "+" : "-")] = o.nextExtreme(o.body(n), max).t;
  r.newMoon = o.nextPhase(0, f - 60);
  return r;
}, [days("2026-10-01T00:00:00Z")]);
const near = (t, iso, mins) => Math.abs(t - days(iso)) * 1440 <= mins;
ok("Saturn opposition 04/10/2026", isoOf(ev["Saturn+"]).startsWith("2026-10-04"), isoOf(ev["Saturn+"]));
ok("Jupiter opposition 11/02/2027 00:21 UTC", near(ev["Jupiter+"], "2027-02-11T00:21:00Z", 90), isoOf(ev["Jupiter+"]));
ok("Mars opposition 19/02/2027 16:10 UTC", near(ev["Mars+"], "2027-02-19T16:10:00Z", 30), isoOf(ev["Mars+"]));
ok("Venus greatest elongation 03/01/2027", isoOf(ev["Venus+"]).startsWith("2027-01-03"), isoOf(ev["Venus+"]));
// The page finds a conjunction as the least elongation, which for Mars falls a few hours
// from the instant of equal longitude that tables publish, so the date is what is checked.
ok("Mars solar conjunction 21/03/2028", isoOf(ev["Mars-"]).startsWith("2028-03-21"), isoOf(ev["Mars-"]));
ok("New moon 12/08/2026", isoOf(ev.newMoon).startsWith("2026-08-12"), isoOf(ev.newMoon));

// 3. Rise and set for London on 02/10/2026 against timeanddate.com (BST shown, compared in UTC).
const rs = await T(([d0]) => {
  const o = window.orreryTest; o.setObserver(51.5072, -0.1276);
  const out = {};
  for (const n of ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"])
    out[n] = o.crossings(n, d0, d0 + 1.5).list.map(c => [c.t, c.up]);
  return out;
}, [days("2026-10-02T00:00:00Z")]);
const at = (n, up, iso) => {
  const c = rs[n].filter(x => x[1] === up).map(x => x[0]);
  return c.length ? Math.min(...c.map(t => Math.abs(t - days(iso)) * 1440)) : Infinity;
};
for (const [n, up, iso, tol, label] of [
  ["Sun", true, "2026-10-02T06:02:00Z", 3, "Sun rises 07:02"], ["Sun", false, "2026-10-02T17:36:00Z", 3, "Sun sets 18:36"],
  ["Moon", false, "2026-10-02T13:45:00Z", 8, "Moon sets 14:45"], ["Moon", true, "2026-10-02T20:30:00Z", 8, "Moon rises 21:30"],
  ["Mercury", false, "2026-10-02T18:03:00Z", 4, "Mercury sets 19:03"], ["Venus", false, "2026-10-02T17:37:00Z", 4, "Venus sets 18:37"],
  ["Mars", true, "2026-10-02T23:38:00Z", 4, "Mars rises 00:38"], ["Jupiter", true, "2026-10-03T01:18:00Z", 4, "Jupiter rises 02:18"],
  ["Saturn", true, "2026-10-02T17:47:00Z", 4, "Saturn rises 18:47"], ["Saturn", false, "2026-10-03T06:12:00Z", 4, "Saturn sets 07:12"]]) {
  const m = at(n, up, iso);
  ok(`London 02/10/2026: ${label}`, m <= tol, isFinite(m) ? m.toFixed(1) + " min out" : "no crossing");
}

// 4. Seen from the north, planets go anticlockwise and Halley clockwise.
const motion = await T(() => {
  const o = window.orreryTest, [cx, cy] = o.centre(), a = o.screen();
  o.setT(o.getT() + 5);
  const b = o.screen();
  return a.map((p, i) => {
    const d = Math.atan2(-(b[i][2] - cy), b[i][1] - cx) - Math.atan2(-(p[2] - cy), p[1] - cx);
    return [p[0], ((d + 3 * Math.PI) % (2 * Math.PI)) - Math.PI];
  });
});
const wrong = motion.filter(([n, d]) => (n === "Halley" ? d > 0 : d < 0)).map(m => m[0]);
ok("planets travel anticlockwise, Halley clockwise", wrong.length === 0, wrong.join(", "));
await ctx.close();

// 5. A link restores the view.
{
  const { ctx, page } = await open({}, "#date=2027-02-19&body=mars&tilt=40&scale=square-root");
  const s = await page.evaluate(() => ({
    date: document.getElementById("datetxt").textContent, tilt: document.getElementById("tilt").value,
    scale: document.getElementById("scale").textContent, play: document.getElementById("play").textContent,
    h2: (document.querySelector("#panel h2") || {}).textContent || "", hash: location.hash }));
  ok("link sets the date", s.date === "19/02/2027", s.date);
  ok("link selects the body", /Mars/.test(s.h2), s.h2);
  ok("link sets tilt and scale", s.tilt === "40" && /square root/.test(s.scale), s.tilt + ", " + s.scale);
  ok("link stops the clock", s.play === "Play", s.play);
  ok("address bar keeps the view", /date=2027-02-19/.test(s.hash) && /body=mars/.test(s.hash), s.hash);
  await ctx.close();
}

// 5b. A link without a hemisphere leaves a visitor's own southern location alone.
{
  const { ctx, page } = await open();
  await page.evaluate(() => localStorage.setItem("orrery-location", JSON.stringify({ lat: -33.87, lon: 151.21 })));
  await page.goto(BASE + "?test&reload#date=2026-10-02"); await page.waitForTimeout(1000);
  await page.evaluate(() => document.getElementById("deselect").click()); await page.waitForTimeout(300);
  const where = await page.locator("p.where").first().textContent();
  const tab = await page.evaluate(() => [...document.querySelectorAll("#tabs button.on")].map(b => b.dataset.tab).join());
  ok("stored southern location survives a link", /33\.9°S/.test(where), where.trim());
  ok("deselecting shows the Tonight tab", tab === "tonight", tab);
  await ctx.close();
}

// 6. The date-range notice.
for (const [d, want] of [["1700-06-01", true], ["2026-10-02", false], ["2100-01-01", true]]) {
  const { ctx, page } = await open({}, "#date=" + d);
  const shown = await page.evaluate(() => !document.getElementById("range").hidden);
  ok(`range notice ${want ? "shows" : "hidden"} for ${d}`, shown === want);
  await ctx.close();
}

// 7. The Tonight panel lists times and events, and an event sets the clock.
{
  const { ctx, page, errors } = await open({}, "#date=2026-10-02");
  await page.click("#deselect", { force: true }).catch(() => {});
  await page.evaluate(() => document.getElementById("deselect").click());
  await page.waitForTimeout(300);
  const rows = await page.locator("table.rs tbody tr").count();
  const evs = await page.locator(".evt").count();
  ok("Tonight shows a rising and setting table", rows === 6, rows + " rows");
  ok("Tonight lists events coming up", evs > 0, evs + " events");
  if (evs) {
    const want = await page.locator(".evt b").first().textContent();
    await page.locator(".evt").first().click();
    await page.waitForTimeout(300);
    const now = await page.evaluate(() => document.getElementById("datetxt").textContent);
    ok("an event sets the clock to its date", now === want, now + " vs " + want);
  }
  ok("no errors in the Tonight panel", errors.length === 0, errors.slice(0, 2).join("; "));
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
