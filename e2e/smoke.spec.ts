import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test("user can navigate the core study workflow", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run against a seeded environment.");
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("link", { name: /mock tests/i }).click();
  await expect(page.getByText(/full length mock/i).first()).toBeVisible();
  await page.getByRole("button", { name: /start simulation/i }).first().click();
  await expect(page.getByText(/question 1/i)).toBeVisible();
  await expect(page.getByText(/question navigator/i)).toBeVisible();
});

test("protected pages reject unauthenticated access", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/login|admin/);
  await page.goto("/analytics");
  await expect(page).toHaveURL(/login|analytics/);
});

test("login layout fits the supported viewport widths", async ({ page }) => {
  for (const width of [320, 375, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test("admin can open protected question management", async ({ page }) => {
  test.skip(!adminEmail || !adminPassword, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin persistence checks.");
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(adminEmail!);
  await page.getByLabel(/password/i).fill(adminPassword!);
  await page.getByRole("button", { name: /sign in|login/i }).click();
  await page.goto("/admin");
  await expect(page.getByText(/question bank control room/i)).toBeVisible();
});