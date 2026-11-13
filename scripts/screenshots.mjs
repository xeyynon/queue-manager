// Screenshots of every screen at phone/tablet/desktop widths, light and dark.
// Needs the app running (npm run dev) and the demo account seeded.
//   node scripts/screenshots.mjs [baseUrl] [outDir]
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "MD/ux_audit/2026-11-14";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const WIDTHS = [
  [390, 844],
  [820, 1180],
  [1280, 800],
  [1920, 1080],
];
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${OUT}/login-1280-${scheme}.png` });
  await page.getByLabel("Email").fill(env.DEMO_EMAIL);
  await page.getByLabel("Password").fill(env.DEMO_PASSWORD);
  await page.locator("main form").getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/queues$/);
  const firstQueue = await page.locator("main ul a").first().getAttribute("href");

  const pages = [
    ["queues", "/queues"],
    ["queue", firstQueue],
    ["dashboard-today", "/dashboard?range=today"],
    ["dashboard-7d", "/dashboard?range=7d"],
    ["dashboard-30d", "/dashboard?range=30d"],
  ];
  for (const [w, h] of WIDTHS) {
    await page.setViewportSize({ width: w, height: h });
    for (const [name, path] of pages) {
      await page.goto(BASE + path);
      if (name.startsWith("dashboard")) await page.getByRole("region", { name: "Key figures" }).waitFor();
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) errors.push(`${name} @${w}: horizontal overflow ${overflow}px`);
      await page.screenshot({ path: `${OUT}/${name}-${w}-${scheme}.png`, fullPage: true });
    }
  }
  console.log(`${scheme}: ${errors.length ? errors.join("\n  ") : "no console errors, no horizontal overflow"}`);
  await ctx.close();
}
await browser.close();
