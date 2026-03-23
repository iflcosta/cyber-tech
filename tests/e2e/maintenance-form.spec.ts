import { test, expect } from '@playwright/test'

test.describe('Maintenance Form flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('home page loads with the correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Cyber/i)
  })

  test('maintenance section is visible on home page', async ({ page }) => {
    // Scroll to the maintenance section
    const maintenanceSection = page.locator('[data-testid="maintenance-section"], #manutencao, section:has-text("Manutenção")')
    await maintenanceSection.first().scrollIntoViewIfNeeded()
    await expect(maintenanceSection.first()).toBeVisible()
  })

  test('WhatsApp button is present and has correct href pattern', async ({ page }) => {
    const waButtons = page.locator('a[href*="wa.me"]')
    const count = await waButtons.count()
    expect(count).toBeGreaterThan(0)

    const firstHref = await waButtons.first().getAttribute('href')
    expect(firstHref).toMatch(/wa\.me\/\d+/)
  })
})
