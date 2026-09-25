import { expect, test } from '@playwright/test'

test('explora Lima y abre una misión', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tu ciudad. Tu próxima misión.' })).toBeVisible()
  await page.getByRole('button', { name: /Parque Kennedy 330 m/ }).click()
  await page.getByRole('link', { name: 'Ver misión', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Parque Kennedy' })).toBeVisible()
})

test('las pantallas principales tienen navegación real', async ({ page }) => {
  await page.goto('/recompensas')
  await expect(page.getByRole('heading', { name: /Pequeñas acciones/ })).toBeVisible()
  await page.getByRole('link', { name: /Arroz para tu hogar/ }).click()
  await expect(page.getByRole('heading', { name: 'Arroz para tu hogar' })).toBeVisible()
})
