import { test, expect } from '@playwright/test'

test('Startseite lädt', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
})

test('Admin-Login lädt', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.locator('form')).toBeVisible()
})
