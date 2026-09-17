import { mkdir } from "fs/promises";
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:4173";
const out = process.argv[3] || "scripts/shots";
await mkdir(out, { recursive: true });

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(base + "/", { waitUntil: "networkidle" });
if (!(await page.locator(".landing-hero").count())) errors.push("Home missing landing hero");
if (!(await page.locator('a[href="/church-history/timeline#nativity"]').count())) errors.push("Missing Church History button");
if (!(await page.locator('a[href="/church-fathers"]').count())) errors.push("Missing Church Writings button");
if (!(await page.locator("#great-places").count())) errors.push("Missing Great places to start section");
await page.screenshot({ path: out + "/home.png", fullPage: true });

await page.goto(base + "/read?work=confessions&chapter=1", { waitUntil: "networkidle" });
await page.waitForSelector(".book-chapter", { timeout: 15000 });
const chapCount = await page.locator(".book-chapter").count();
if (chapCount < 5) errors.push("Reader did not render multiple chapters, got " + chapCount);
if (!(await page.locator(".trans-pane .para").count())) errors.push("Pusey paragraphs missing");
if (!(await page.locator(".orig-pane").count())) errors.push("Split original column missing");
if (!(await page.locator(".orig-pane").locator("text=Magnus es").count())) errors.push("Latin missing from split column");
await page.screenshot({ path: out + "/read-parallel.png", fullPage: false });

await page.click('[data-mode="original"]');
await page.waitForSelector(".trans-pane >> text=Magnus es", { timeout: 10000 });
if (await page.locator("#editionBar.show").count()) errors.push("Edition bar still visible in Original mode");
if (await page.locator(".orig-pane").count()) errors.push("Split original pane should not show in Original mode");
if (!(await page.locator("text=Magnus es").count())) errors.push("Latin missing in Original mode");
await page.screenshot({ path: out + "/read-original.png", fullPage: false });

await page.goto(base + "/search?q=restless", { waitUntil: "networkidle" });
await page.waitForSelector(".result", { timeout: 15000 });
if ((await page.locator(".result").count()) < 1) errors.push("Keyword search returned no results");
await page.screenshot({ path: out + "/search.png", fullPage: true });

await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("SHOTS_OK", out);
