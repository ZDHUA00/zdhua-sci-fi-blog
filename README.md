# ZDHUA.LOG

Astro powered personal blog rebuilt as a starship command console.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
SITE_URL=https://zdhua.me BASE_PATH=/ npm run build
```

GitHub Pages deployment is handled by `.github/workflows/pages.yml`. The custom domain is kept in `public/CNAME`.
