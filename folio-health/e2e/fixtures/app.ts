import { expect, type Page } from "@playwright/test"
import type { TestUser } from "./medplum"

/** Sign in through the real login page and wait for the app shell. */
export async function signIn(page: Page, user: Pick<TestUser, "email" | "password">): Promise<void> {
  await page.goto("/login")
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 })
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible()
}

/** Sign out through the account menu (which also wipes client state). */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Account menu" }).click()
  await page.getByRole("menuitem", { name: "Log Out" }).click()
  await page.waitForURL(/\/login/, { timeout: 30_000 })
}

/** Assert a toast containing `text` appears. */
export async function expectToast(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible({ timeout: 15_000 })
}

/** Pick an option in one of the app's Select menus by its visible label. */
export async function pickOption(page: Page, option: string | RegExp): Promise<void> {
  await page.getByRole("option", { name: option }).first().click()
}
