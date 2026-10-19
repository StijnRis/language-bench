import { expect, test, type Page } from "@playwright/test";

const ROUTES = ["/", "/pick/", "/validation/", "/problems/", "/languages/", "/timeline/", "/compare/", "/methodology/", "/sessions/"];

/** Collect console errors and uncaught exceptions of a page. */
function watch(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}

for (const route of ROUTES) {
  test(`renders ${route}`, async ({ page }) => {
    const errors = watch(page);
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page).toHaveTitle(/\S/);
    expect(errors).toEqual([]);
  });
}

test("every page in the sitemap exists and has a canonical link", async ({ request }) => {
  test.setTimeout(180_000);
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  expect(paths.length).toBeGreaterThan(20);
  const bad: string[] = [];
  // all non-benchmark pages, plus a sample of the (many) benchmark pages
  const sample = paths.filter((p, i) => !p.startsWith("/benchmarks/") || i % 25 === 0);
  for (let i = 0; i < sample.length; i += 12) {
    await Promise.all(
      sample.slice(i, i + 12).map(async (p) => {
        const res = await request.get(p);
        const html = res.ok() ? await res.text() : "";
        if (!res.ok() || !html.includes('rel="canonical"')) bad.push(`${p} -> ${res.status()}`);
      }),
    );
  }
  expect(bad).toEqual([]);
});

test("share cards, badges and the CSV export are served with the right type", async ({ page, request }) => {
  await page.goto("/");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toMatch(/\/og\/site\/home\.png$/);
  const img = await request.get(new URL(og!).pathname);
  expect(img.headers()["content-type"]).toContain("image/png");

  const lang = await page.locator('a[href^="/languages/"]:not([href="/languages/"])').first().getAttribute("href");
  const id = lang!.split("/")[2]!;
  const badge = await request.get(`/badges/${id}.svg`);
  expect(badge.headers()["content-type"]).toContain("image/svg+xml");
  expect(await badge.text()).toContain("language-bench");

  const csv = await request.get("/results.csv");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const text = await csv.text();
  expect(text.split("\n")[0]).toContain("language,version,build,problem,seconds");
  expect(text.split("\n").length).toBeGreaterThan(20);
});

test("home page states a conclusion and when it was measured", async ({ page }) => {
  await page.goto("/");
  const headline = page.getByRole("region", { name: "Summary" });
  await expect(headline).toBeVisible();
  await expect(headline).toContainText(/fastest overall|tied/);
  await expect(headline.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
});

test("leaderboard task and metric live in the URL and survive a reload", async ({ page }) => {
  await page.goto("/");
  const select = page.getByLabel("Task");
  const value = await select.locator("option").nth(2).getAttribute("value");
  await select.selectOption(value!);
  await page.getByRole("button", { name: "Memory", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`task=${value}`));
  await expect(page).toHaveURL(/metric=memory/);
  await page.reload();
  await expect(page.getByLabel("Task")).toHaveValue(value!);
  await expect(page.getByRole("button", { name: "Memory", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("leaderboard time basis (warm, cold, end-to-end) lives in the URL", async ({ page }) => {
  await page.goto("/");
  await page.locator("label", { hasText: /^Time/ }).locator("select").selectOption("e2e");
  await expect(page).toHaveURL(/basis=e2e/);
  await expect(page.getByText("end-to-end: process start to exit", { exact: false }).first()).toBeVisible();
  await page.reload();
  await expect(page.locator("label", { hasText: /^Time/ }).locator("select")).toHaveValue("e2e");
});

test("leaderboard offers CSV download and link copy", async ({ page }) => {
  await page.goto("/");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download CSV" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^language-bench-.*\.csv$/);
});

test("pick-for-me: weights change the ranking and are shared through the URL", async ({ page }) => {
  await page.goto("/pick/");
  const rows = () => page.locator("tbody tr td:nth-child(2)").allInnerTexts();
  const before = await rows();
  expect(before.length).toBeGreaterThan(3);
  await page.getByRole("button", { name: "memory-bound" }).click();
  await expect(page).toHaveURL(/w=/);
  await page.getByLabel(/Importance of memory/).fill("100");
  await expect(page).toHaveURL(/mem=100/);
  const url = page.url();
  await page.goto(url);
  await expect(page.getByLabel(/Importance of memory/)).toHaveValue("100");
  const after = await rows();
  expect(after.join()).not.toEqual(before.join());
});

test("theme toggle cycles and the choice persists", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /Colour theme/ });
  const theme = () => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(await theme()).toBeNull();
  await toggle.click();
  expect(await theme()).toBe("light");
  await toggle.click();
  expect(await theme()).toBe("dark");
  await page.reload();
  expect(await theme()).toBe("dark");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(10, 13, 19)");
  await toggle.click();
  expect(await theme()).toBeNull();
});

test("validation page shows the before/after spread", async ({ page }) => {
  await page.goto("/validation/");
  await expect(page.getByText("After machine and OS correction")).toBeVisible();
  await expect(page.locator("svg.histo")).toHaveAttribute("aria-label", /Histogram/);
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 800 } });
  for (const route of ["/", "/pick/", "/compare/", "/validation/", "/methodology/"]) {
    test(`no horizontal page scroll on ${route}`, async ({ page }) => {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});

test("skip link and main navigation are keyboard reachable", async ({ page }) => {
  await page.goto("/pick/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Pick for me" })).toHaveAttribute("aria-current", "page");
});

test("language page shows a working badge preview and per-problem results", async ({ page }) => {
  await page.goto("/languages/rust/");
  const img = page.locator(".badge-preview img");
  await expect(img).toBeVisible();
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(page.getByRole("heading", { name: "Performance by problem" })).toBeVisible();
  await expect(page.locator(".lang-hero .stats")).toBeVisible();
});

test("head-to-head page has a timeline", async ({ page }) => {
  await page.goto("/compare/c-vs-rust/");
  await expect(page.getByRole("heading", { name: "Over time" })).toBeVisible();
  await expect(page.getByRole("img", { name: /per release over time/ })).toBeVisible();
});

test("sessions are grouped by day and the header does not cover content", async ({ page }) => {
  await page.goto("/sessions/");
  await expect(page.getByRole("heading", { name: /^\d{4}-\d{2}-\d{2}/ }).first()).toBeVisible();
  await expect(page.locator(".session-row").first()).toBeVisible();
  expect(await page.locator("header.site").evaluate((el) => getComputedStyle(el).position)).not.toBe("sticky");
});

test("home headline has no confidence meter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Summary" })).not.toContainText("Confidence");
});
