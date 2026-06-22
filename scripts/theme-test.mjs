/**
 * Verifies the theme system end-to-end in real Chrome:
 * default theme, header toggle, settings segmented control, persistence,
 * theme-color meta sync, and zero console errors.
 *
 *   node scripts/theme-test.mjs
 */
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const consoleErrors = [];
const pageErrors = [];

const state = (page) =>
  page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    bg: getComputedStyle(document.body).backgroundColor,
    themeColor:
      document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ||
      null,
    stored: localStorage.getItem("budget-buckets:theme"),
  }));

async function clickText(page, sel, t) {
  const ok = await page.evaluate(
    (s, x) => {
      const els = [...document.querySelectorAll(s)];
      const el = x ? els.find((e) => e.textContent.trim().includes(x)) : els[0];
      if (!el) return false;
      el.click();
      return true;
    },
    sel,
    t
  );
  if (!ok) throw new Error(`No <${sel}> "${t}"`);
}

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT: " + msg);
  console.log("  ✓ " + msg);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 412, height: 880, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  // Force a known system preference (light) so "System" is distinguishable.
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "light" },
  ]);
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => pageErrors.push(e.message));

  console.log("• Load with no stored theme → defaultTheme dark");
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.removeItem("budget-buckets:theme"));
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(400);
  let s = await state(page);
  assert(s.htmlClass.includes("dark"), "html has .dark by default");
  assert(s.bg === "rgb(11, 12, 16)" || s.bg.startsWith("rgb(1"), `dark bg (${s.bg})`);
  assert(s.themeColor === "#0a0a0c", "theme-color meta is dark");

  console.log("• Header toggle → light");
  await clickText(page, "button[aria-label='Switch to light mode']", "");
  await sleep(500);
  s = await state(page);
  assert(!s.htmlClass.includes("dark"), "html .dark removed (light)");
  assert(s.bg !== "rgb(11, 12, 16)", `light bg (${s.bg})`);
  assert(s.themeColor === "#f7f7fb", "theme-color meta is light");
  assert(s.stored === "light", "stored theme = light");

  console.log("• Settings → System (emulated system = light)");
  await page.goto(BASE + "/settings", { waitUntil: "networkidle0" });
  await sleep(300);
  await clickText(page, "button[role='radio']", "System");
  await sleep(500);
  s = await state(page);
  assert(s.stored === "system", "stored theme = system");
  assert(!s.htmlClass.includes("dark"), "system resolves to light (emulated)");

  console.log("• Switch emulated system to dark → app follows");
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "dark" },
  ]);
  await sleep(500);
  s = await state(page);
  assert(s.htmlClass.includes("dark"), "system now resolves to dark");

  console.log("• Persistence: set Dark, reload");
  await clickText(page, "button[role='radio']", "Dark");
  await sleep(400);
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(400);
  s = await state(page);
  assert(s.stored === "dark", "stored theme persisted = dark");
  assert(s.htmlClass.includes("dark"), "restored dark after reload");

  await browser.close();

  console.log("\n──────── RESULT ────────");
  console.log("Console errors:", consoleErrors.length);
  consoleErrors.forEach((e) => console.log("  ✗", e));
  console.log("Page exceptions:", pageErrors.length);
  pageErrors.forEach((e) => console.log("  ✗", e));
  if (consoleErrors.length || pageErrors.length) {
    console.log("\nFAILED ❌");
    process.exit(1);
  }
  console.log("\nTHEME SYSTEM PASSED ✅");
}

main().catch((e) => {
  console.error("\nTEST ERROR ❌:", e.message);
  console.log("Console errors:", consoleErrors);
  console.log("Page exceptions:", pageErrors);
  process.exit(1);
});
