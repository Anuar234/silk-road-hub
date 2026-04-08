import { expect, test } from '@playwright/test'

test('unauthenticated user is redirected to login from a protected product action', async ({ page }) => {
  await page.goto('/#/catalog/product/organicheskiy-myod-500g')

  await page.locator('section').getByRole('button', { name: 'Написать продавцу' }).click()

  await expect(page).toHaveURL(/#\/login/)
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible()
})

test('login returns the user to the originally requested protected flow', async ({ page }) => {
  await page.goto('/#/catalog/product/organicheskiy-myod-500g')

  await page.locator('section').getByRole('button', { name: 'Написать продавцу' }).click()
  await page.getByPlaceholder('name@company.com').fill('Test')
  await page.getByPlaceholder('••••••••').fill('Test123')
  await page.getByRole('button', { name: 'Войти' }).click()

  await expect(page).toHaveURL(/#\/catalog\/product\/organicheskiy-myod-500g/)
})
