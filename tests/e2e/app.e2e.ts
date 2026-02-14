import { expect, test } from '@playwright/test'

test('carga casos demo desde la cola', async ({ page }) => {
  await page.goto('/cola')

  await expect(page.getByRole('heading', { name: 'Cola de pacientes' })).toBeVisible()
  await page.getByRole('button', { name: 'Cargar casos demo' }).click()

  await expect(page.locator('table')).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(4)
  await expect(page.getByRole('link', { name: /Carlos/i })).toBeVisible()
})

test('crea paciente y completa flujo minimo hasta resultado', async ({ page }) => {
  await page.goto('/paciente/nuevo')

  await page.getByLabel('Nombre').fill('Paciente E2E')
  await page.getByLabel('Apellidos').fill('Playwright')
  await page.getByLabel('Sexo').selectOption('M')
  await page.getByLabel('Edad (años)').fill('34')
  await page.getByLabel('Peso (kg)').fill('78')
  await page.getByRole('button', { name: 'Guardar' }).click()

  await expect(page).toHaveURL(/\/cola$/)
  await page.getByRole('link', { name: /Paciente E2E Playwright/i }).click()

  await expect(page).toHaveURL(/\/triaje$/)
  await page.getByLabel('Motivo de consulta').fill('Disnea y malestar general')
  await page.locator('.symptom-tile', { hasText: 'Disnea' }).click()
  await page.locator('.red-flag-tile', { hasText: 'Compromiso de vía aérea' }).click()

  await page.getByLabel('FC (lpm)').fill('108')
  await page.getByLabel('FR (rpm)').fill('26')
  await page.getByLabel('SatO2 (%)').fill('93')
  await page.getByLabel('TA Sistólica (mmHg)').fill('102')
  await page.getByLabel('TA Diastólica (mmHg)').fill('68')
  await page.getByLabel('Temperatura (°C)').fill('37.2')
  await page.getByLabel('Glucemia capilar').fill('118')

  await page.locator('input[name="glasgow-ocular"][value="4"]').check()
  await page.locator('input[name="glasgow-verbal"][value="5"]').check()
  await page.locator('input[name="glasgow-motor"][value="6"]').check()

  await page.getByRole('button', { name: 'Calcular triaje' }).click()

  await expect(page).toHaveURL(/\/resultado$/)
  await expect(page.getByRole('heading', { name: 'Resultado de triaje' })).toBeVisible()
  await expect(page.getByText('Prioridad de triaje')).toBeVisible()
  await expect(page.getByText(/Dolor EVA actual:/)).toBeVisible()
})
