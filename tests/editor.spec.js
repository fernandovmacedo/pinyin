import { URL, fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// AGENTS.md and README.md promise that dist/index.html works when opened
// directly from disk, with no server and no network requests: the whole
// point of the single-file build. Every other test here exercises the app
// through the Vite dev server, which would never catch a packaging
// regression (an inlined asset that isn't actually inlined, a script that
// assumes an http(s) origin, etc.). This test opens the real committed
// artifact via file:// instead.
const distIndexPath = fileURLToPath(
  new URL('../dist/index.html', import.meta.url),
);

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

test('works when opened directly from disk as a single file', async ({
  page,
}) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto(`file://${distIndexPath}`);

  // The favicon, styles, script, and rules manifest must all be inlined;
  // the only "request" for a file:// document is the navigation itself.
  expect(requests).toEqual([`file://${distIndexPath}`]);

  await expect(page.locator('#rules-status')).toBeEmpty();
  const editor = page.locator('#editor');
  await editor.pressSequentially('ni3');
  await expect(editor).toHaveValue('nǐ');
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
