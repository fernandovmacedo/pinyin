/**
 * Validate the rule manifest before the editor relies on it.
 *
 * @param {object} manifest
 * @throws {Error} if required teaching data is absent or inconsistent
 */
export function validateRulesManifest(manifest) {
  if (
    !manifest ||
    !Array.isArray(manifest.syllables) ||
    !Array.isArray(manifest.rules) ||
    !Array.isArray(manifest.sources) ||
    manifest.syllables.length === 0
  ) {
    throw new Error('The rules manifest is missing required arrays.');
  }

  const sourceIds = new Set(manifest.sources.map((source) => source.id));
  for (const source of manifest.sources) {
    if (!source.id || !source.url || !source.title?.en || !source.title?.zh) {
      throw new Error('A source record is incomplete.');
    }
  }

  for (const rule of manifest.rules) {
    if (
      !rule.id ||
      !rule.title?.en ||
      !rule.title?.zh ||
      !rule.explanation?.en ||
      !rule.explanation?.zh ||
      !Array.isArray(rule.sources) ||
      rule.sources.length === 0
    ) {
      throw new Error('A teaching rule is incomplete.');
    }
    if (rule.sources.some((sourceId) => !sourceIds.has(sourceId))) {
      throw new Error(`Rule ${rule.id} refers to an unknown source.`);
    }
  }
}
