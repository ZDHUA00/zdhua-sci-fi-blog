import { defineConfig } from 'astro/config';

const [owner = '', repo = ''] = process.env.GITHUB_REPOSITORY?.split('/') ?? [];
const inferredBase = repo && !repo.endsWith('.github.io') ? `/${repo}` : '/';
const inferredSite = owner
  ? repo.endsWith('.github.io')
    ? `https://${repo}`
    : `https://${owner}.github.io`
  : 'https://example.com';

export default defineConfig({
  site: process.env.SITE_URL || inferredSite,
  base: process.env.BASE_PATH || inferredBase,
  trailingSlash: 'always',
  vite: {
    cacheDir: '.astro-cache/vite',
  },
  build: {
    format: 'directory',
  },
});

