import { expect, test } from '@playwright/test';

test('converts a tone number while typing', async ({ page }) => {
  await page.goto('/');

  const editor = page.locator('#editor');
  await editor.pressSequentially('ni3');

  await expect(editor).toHaveValue('nǐ');
});

test('loads its embedded rules without a network request', async ({ page }) => {
  const rulesRequests = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/rules.json')) {
      rulesRequests.push(request.url());
    }
  });

  await page.goto('/');

  await expect(page.locator('#rules-status')).toBeEmpty();
  expect(rulesRequests).toEqual([]);
});
