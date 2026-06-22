/**
 * Headful smoke test: drives the real app in Chrome, exercises the core flow,
 * and fails on any console error / page exception.
 *
 *   node scripts/smoke-test.mjs
 */
import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";

const consoleErrors = [];
const pageErrors = [];

function log(step) {
  console.log(`• ${step}`);
}

async function waitText(page, text, timeout = 8000) {
  await page.waitForFunction(
    (t) => document.body && document.body.innerText.includes(t),
    { timeout },
    text
  );
}

async function clickByText(page, selector, text) {
  // Dispatch the click through the DOM so we bypass puppeteer's hit-testing
  // (Framer Motion buttons can fail its clickability check mid-animation).
  const clicked = await page.evaluate(
    (sel, t) => {
      const els = [...document.querySelectorAll(sel)];
      const el = t
        ? els.find((e) => e.textContent.trim().includes(t))
        : els[0];
      if (!el) return false;
      el.click();
      return true;
    },
    selector,
    text
  );
  if (!clicked) throw new Error(`No <${selector}> containing "${text}"`);
}

async function setInput(page, labelText, value) {
  // Find input by its associated label text, else by placeholder.
  const handle = await page.evaluateHandle((label) => {
    const labels = [...document.querySelectorAll("label")];
    const l = labels.find((x) => x.textContent.trim().includes(label));
    if (l) {
      const id = l.getAttribute("for");
      if (id) return document.getElementById(id);
      const wrap = l.parentElement;
      return wrap ? wrap.querySelector("input, textarea") : null;
    }
    return null;
  }, labelText);
  const el = handle.asElement();
  if (!el) throw new Error(`No input for label "${labelText}"`);
  await el.click({ clickCount: 3 });
  await el.type(value, { delay: 10 });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    defaultViewport: { width: 412, height: 880, isMobile: true, hasTouch: true },
    args: ["--window-size=440,920"],
  });
  const page = await browser.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  log("Loading dashboard");
  await page.goto(BASE, { waitUntil: "networkidle0" });
  // Start clean.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await waitText(page, "Start budgeting");

  log("Creating scope (Malaysia Living, RM600)");
  await clickByText(page, "button", "Create your first scope");
  await waitText(page, "New budget scope");
  await setInput(page, "Scope name", "Malaysia Living");
  await clickByText(page, "button", "RM");
  await setInput(page, "Total budget", "600");
  await clickByText(page, "button", "Create scope");
  await sleep(400);

  log("Opening scope");
  await clickByText(page, "a", "Malaysia Living");
  await waitText(page, "Remaining balance");

  log("Adding bucket Rent (RM275)");
  await clickByText(page, "button", "Create your first bucket");
  await waitText(page, "New bucket");
  await setInput(page, "Bucket name", "Rent");
  await setInput(page, "Allocation", "275");
  await clickByText(page, "button", "Add bucket");
  await sleep(400);
  await waitText(page, "Rent");

  log("Adding bucket Groceries (RM115)");
  await clickByText(page, "button", "Add");
  await waitText(page, "New bucket");
  await setInput(page, "Bucket name", "Groceries");
  await setInput(page, "Allocation", "115");
  await clickByText(page, "button", "Add bucket");
  await sleep(400);

  log("Recording expense RM50 against Groceries");
  await clickByText(page, "button[aria-label='Add transaction']", "");
  await waitText(page, "Add transaction");
  await clickByText(page, "button", "Groceries");
  await setInput(page, "Amount", "50");
  await setInput(page, "Note", "Eggs and bread");
  await clickByText(page, "button", "Record expense");
  await sleep(500);

  log("Verifying Groceries remaining = RM65");
  await waitText(page, "Eggs and bread");
  const has65 = await page.evaluate(() =>
    document.body.innerText.includes("RM65")
  );
  if (!has65) throw new Error("Expected Groceries remaining RM65 not found");

  log("Reloading to verify persistence");
  await page.reload({ waitUntil: "networkidle0" });
  await waitText(page, "Remaining balance");
  const persisted = await page.evaluate(
    () =>
      document.body.innerText.includes("Rent") &&
      document.body.innerText.includes("Groceries") &&
      document.body.innerText.includes("Eggs and bread")
  );
  if (!persisted) throw new Error("State did not persist after reload");

  log("Deleting the transaction (should reverse effect)");
  await clickByText(page, "button[aria-label='Delete transaction']", "");
  await sleep(500);
  const reversed = await page.evaluate(
    () => !document.body.innerText.includes("Eggs and bread")
  );
  if (!reversed) throw new Error("Transaction not removed");

  await sleep(800);
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
  console.log("\nALL FLOWS PASSED ✅");
}

main().catch((err) => {
  console.error("\nTEST ERROR ❌:", err.message);
  console.log("Console errors so far:", consoleErrors);
  console.log("Page exceptions so far:", pageErrors);
  process.exit(1);
});
