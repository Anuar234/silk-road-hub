import { expect, test } from '@playwright/test'

test('public catalog keeps hash-route and filter contract', async ({ page }) => {
  await page.goto('/#/catalog?q=honey&verified=1')

  await expect(page).toHaveURL(/#\/catalog\?q=honey&verified=1/)
  await expect(page.getByRole('heading', { name: 'Каталог' })).toBeVisible()
  await expect(page.getByPlaceholder('Поиск: товар, компания, сектор, подкатегория, страна, HS-код…')).toHaveValue('honey')
})

test('buyer login succeeds and preserves current default redirect behavior', async ({ page }) => {
  await page.goto('/#/login')

  await page.getByPlaceholder('name@company.com').fill('Test')
  await page.getByPlaceholder('••••••••').fill('Test123')
  await page.getByRole('button', { name: 'Войти' }).click()

  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('link', { name: 'Кабинет' })).toBeVisible()
})
