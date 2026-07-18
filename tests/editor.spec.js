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

test('colors each syllable of a run-together pair by its own tone', async ({
  page,
}) => {
  await page.goto('/');

  const editor = page.locator('#editor');
  // "xi1an4" types as two separately-toned syllables (xī + àn) with no
  // separator between them; each syllable's tone must be colored on its
  // own vowel, not smeared across the whole four-character run.
  await editor.pressSequentially('xi1an4');
  await expect(editor).toHaveValue('xīàn');

  const highlights = page.locator('#validation-highlights');
  await expect(highlights.locator('.tone-1')).toHaveText('xī');
  await expect(highlights.locator('.tone-4')).toHaveText('àn');
});

test('copy button label recovers from a rapid repeat click', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');

  await page.locator('#editor').pressSequentially('ni3');
  const copyBtn = page.locator('#copy-btn');
  await copyBtn.click();
  await copyBtn.click();

  await expect(copyBtn).toHaveText('Copied!');
  await expect(copyBtn).toHaveText('Copy', { timeout: 3000 });
});

test('diagnostic card sources link to real external URLs', async ({ page }) => {
  await page.goto('/');

  const editor = page.locator('#editor');
  await editor.pressSequentially('jo');
  await editor.press('Enter'); // commit the composition so validation runs

  const invalid = page.locator('.invalid-pinyin').first();
  await invalid.click();

  const sourceLinks = page.locator('.diagnostic-sources a');
  await expect(sourceLinks.first()).toBeVisible();
  const hrefs = await sourceLinks.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    expect(href).toMatch(/^https?:\/\//);
  }
});
