import js from '@eslint/js';

export default [
  {
    ignores: ['dist/', 'node_modules/', 'playwright-report/', 'test-results/'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js', '*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        clearTimeout: 'readonly',
        document: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        process: 'readonly',
        requestAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        window: 'readonly',
      },
    },
  },
];
