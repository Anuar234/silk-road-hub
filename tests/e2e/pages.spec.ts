import { expect, test } from '@playwright/test'

test('investments page loads with project cards', async ({ page }) => {
  await page.goto('/#/investments')

  await expect(page.getByRole('heading', { name: 'Инвестиционные проекты' })).toBeVisible()
  await expect(page.getByText('Kazakh Invest')).toBeVisible()
})

test('contacts page loads with partner organizations', async ({ page }) => {
  await page.goto('/#/contacts')

  await expect(page.getByRole('heading', { name: 'Контакты' })).toBeVisible()
  await expect(page.getByText('QazTrade')).toBeVisible()
  await expect(page.getByText('KazakhExport')).toBeVisible()
})

test('registration page shows role selection', async ({ page }) => {
  await page.goto('/#/register')

  await expect(page.getByRole('heading', { name: 'Регистрация' })).toBeVisible()
  await expect(page.getByText('Покупатель / Импортёр')).toBeVisible()
  await expect(page.getByText('Экспортёр / Продавец')).toBeVisible()
})

test('catalog region filter appears when KZ is selected', async ({ page }) => {
  await page.goto('/#/catalog?country=KZ')

  await expect(page.getByRole('heading', { name: 'Каталог' })).toBeVisible()
  // The region filter should be visible when country is KZ
  await expect(page.getByLabel('Регион')).toBeVisible()
})
