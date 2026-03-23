import { test, expect } from '@playwright/test'

test.describe('Admin login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login')
  })

  test('displays the login form', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
  })

  test('shows an error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com')
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Wait for error feedback
    await expect(
      page.locator('text=/erro|inválid|incorret|invalid/i').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('unauthenticated access to /admin redirects to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
