import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

const favicon = readFileSync(
  new URL('./favicon.svg', import.meta.url),
).toString('base64');

function inlineFavicon() {
  return {
    name: 'inline-favicon',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(
          'href="favicon.svg"',
          `href="data:image/svg+xml;base64,${favicon}"`,
        );
      },
    },
  };
}

export default defineConfig({
  build: {
    assetsInlineLimit: Number.POSITIVE_INFINITY,
    cssCodeSplit: false,
    sourcemap: false,
  },
  plugins: [inlineFavicon(), viteSingleFile({ removeViteModuleLoader: true })],
});
