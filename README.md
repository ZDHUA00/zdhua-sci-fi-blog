# ZDHUA-Blog

Astro powered personal portfolio and blog deployed at `zdhua.me`.

The current design direction is adapted from the open-source Astro Sphere theme by Mark Horn, while keeping this site's custom Astro 5 setup, native CSS/JS motion, GitHub Pages workflow, and custom domain.

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

## Open-source reference

- Astro Sphere: https://github.com/markhorn-dev/astro-sphere
- License: MIT
