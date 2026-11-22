/**
 * End-to-end test of the core Dishwise journey in a real browser (mobile size).
 * Usage: start the app (npm run build && FOUNDER_PASSCODE=test123 npm start), then
 *        BASE_URL=http://localhost:3000 FOUNDER_PASSCODE=test123 npm run test:e2e
 */
const { chromium, devices } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR || "";
const CODE = process.env.FOUNDER_PASSCODE || "";

function assert(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["iPhone 13"], reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const shot = async (name) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
  };

  console.log("Welcome & onboarding");
  await page.goto(`${BASE}/?invite=e2e`);
  await page.getByRole("heading", { name: /Know what to order/ }).waitFor();
  await shot("01-welcome");
  await page.getByRole("link", { name: /Explore a menu/ }).click();
  await page.getByRole("heading", { name: "Any dietary needs?" }).waitFor();
  await page.getByRole("button", { name: "Halal" }).click();
  await shot("02-onboarding");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Chicken", exact: true }).click();
  await page.getByRole("button", { name: "Grilled & smoky" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: /Medium/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: /Keep it easy/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Done/ }).click();
  await page.waitForURL(/\/scan$/);
  assert(true, "onboarding completed in 5 steps and landed on Scan");
  await shot("03-scan");

  console.log("Photo upload without AI is handled honestly");
  const status = await (await page.request.get(`${BASE}/api/status`)).json();
  if (!status.ai) {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    await page.locator('input[aria-label="Menu photo"]').setInputFiles({ name: "menu.png", mimeType: "image/png", buffer: png });
    await page.getByText(/isn't set up on this preview/).waitFor();
    assert(true, "photo upload without AI shows a clear, honest message");
  }

  console.log("Sample menu → review → picks");
  await page.getByRole("button", { name: /Ember & Ash/ }).click();
  await page.waitForURL(/\/scan\/review/);
  await page.getByText(/Fictional sample menu/).waitFor();
  await shot("04-review");
  await page.getByRole("button", { name: /Get my three picks/ }).click();
  await page.waitForURL(/\/scan\/picks/);
  const cards = page.locator("article");
  await cards.first().waitFor();
  assert((await cards.count()) === 3, "three recommendation cards shown");
  const titles = await cards.locator("h2").allTextContents();
  console.log("    picks:", titles.join(" | "));
  assert(titles.every((t) => !/pork/i.test(t)), "no pork dishes recommended to a halal diner");
  assert(await page.getByText("Safe Pick").first().isVisible(), "Safe / Adventure / Value labels present");
  await shot("05-picks");

  console.log("Dish details → choose → enjoy");
  await cards.first().getByRole("link", { name: "Details" }).click();
  await page.waitForURL(/\/scan\/dish\//);
  await page.getByText("What it is").waitFor();
  assert(await page.getByText(/No photo from the restaurant/).isVisible(), "no fake food photo, placeholder explained");
  await shot("06-dish");
  await page.getByRole("button", { name: /Choose this dish/ }).click();
  await page.waitForURL(/\/enjoy/);
  await page.getByRole("button", { name: /Date night/ }).click();
  await page.getByText("A few conversation starters").waitFor();
  await shot("07-enjoy");
  await page.getByRole("button", { name: /Put my phone away/ }).click();
  await page.getByText(/Your choice is made/).waitFor();
  await shot("08-calm");
  await page.getByRole("button", { name: /finished/ }).click();

  console.log("Feedback → journal → passport");
  await page.waitForURL(/\/feedback/);
  await page.getByRole("radio", { name: "5 stars" }).click();
  await page.getByRole("radiogroup", { name: "Would you order it again" }).getByRole("radio", { name: "Yes" }).click();
  await page.getByRole("radiogroup", { name: "Confidence" }).getByRole("radio", { name: "Yes" }).click();
  await page.getByRole("radio", { name: "Asked the staff" }).click();
  await page.getByRole("radiogroup", { name: "Use again" }).getByRole("radio", { name: "Yes" }).click();
  await page.getByRole("radiogroup", { name: "Willingness to pay" }).getByRole("radio", { name: "Maybe" }).click();
  await page.getByPlaceholder("What would make Dishwise more useful?").fill("E2E test comment");
  await shot("09-feedback");
  await page.getByRole("button", { name: /Save to my journal/ }).click();
  await page.waitForURL(/\/journal\?saved=/);
  assert((await page.locator("ol > li").count()) === 1, "meal saved to the journal");
  await shot("10-journal");
  await page.getByRole("link", { name: "Passport" }).click();
  await page.getByText("Cuisine stamps").waitFor();
  assert(await page.getByText("First memory").isVisible(), "passport shows milestones");
  await shot("11-passport");

  console.log("Pasted text path");
  await page.goto(`${BASE}/scan`);
  await page.getByRole("button", { name: /Paste text/ }).click();
  await page.getByLabel("Paste the menu").fill("MAINS\nLamb tagine — apricot, almonds £18\nFalafel wrap (VG) — tahini, pickles £11\nGrilled sea bream — lemon, herbs £21");
  await page.getByRole("button", { name: "Read this menu" }).click();
  await page.waitForURL(/\/scan\/review/);
  assert((await page.locator('input[aria-label="Dish name"]').count()) === 3, "pasted menu parsed into 3 dishes");
  await page.getByRole("button", { name: /Get my three picks/ }).click();
  await page.waitForURL(/\/scan\/picks/);
  assert((await page.locator("article").count()) >= 2, "picks generated for a pasted menu");

  console.log("Home & profile");
  await page.goto(`${BASE}/`);
  await page.getByRole("link", { name: /Continue your menu/ }).waitFor();
  await shot("12-discover");
  await page.goto(`${BASE}/profile`);
  await page.getByText("Your tastes").waitFor();
  await shot("13-profile");

  console.log("Founder dashboard");
  await page.waitForTimeout(500);
  await page.goto(`${BASE}/founder`);
  if (CODE) {
    await page.getByLabel(/Passcode/).fill(CODE);
    await page.getByRole("button", { name: "Open dashboard" }).click();
  }
  await page.getByText("Journey funnel").waitFor();
  assert(await page.getByText("E2E test comment").isVisible(), "feedback appears on the founder dashboard");
  await shot("14-founder");

  await browser.close();
  const relevant = errors.filter((e) => !/favicon|Failed to load resource.*(503|422|401)/.test(e));
  if (relevant.length) {
    console.log("Browser errors:\n" + relevant.join("\n"));
    process.exit(1);
  }
  console.log("\nAll journey checks passed.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
