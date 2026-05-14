# Oh My CV!

Microsoft Word and LaTeX can be too much machinery for a resume. Oh My CV! lets you write a resume in Markdown, preview it live, customize the styling, and export it to PDF.

This repository keeps the original project attribution intact and adds browser-side security hardening, GPL/source notices, and a Vercel-ready deployment configuration.

Try the original app: [ohmycv.app](https://ohmycv.app/)

Fork source: [github.com/shiualan/oh-my-cv](https://github.com/shiualan/oh-my-cv)

## Features

- Write resumes in Markdown with a real-time preview.
- Export to PDF in A4 and US Letter sizes.
- Automatically paginate resumes like a word processor.
- Customize margins, theme colors, line heights, fonts, page size, and CSS.
- Pick fonts from [Google Fonts](https://fonts.google.com/) when an API key is configured.
- Add icons through [Iconify](https://github.com/iconify/iconify).
- Use TeX-style math through [KaTeX](https://github.com/KaTeX/KaTeX).
- Add cross-references for academic CVs.
- Correct common casing automatically, such as `Github` to `GitHub`.
- Insert line breaks with `\\[10px]` or page breaks with `\newpage`.
- Manage multiple resumes locally.
- Use the app offline as a [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps).
- Keep resume data in the browser through localForage/IndexedDB.
- Use dark mode.

## Security Updates

This version hardens the browser rendering path while preserving the Markdown resume workflow:

- Sanitizes rendered resume HTML before it reaches `innerHTML`.
- Escapes custom cross-reference labels.
- Restricts TeX-style spacing commands to safe CSS lengths.
- Filters dangerous custom CSS primitives such as `url()`, `@import`, and legacy CSS execution patterns.
- Limits imported Markdown and JSON backup file sizes.
- Restricts remote Markdown imports to HTTPS, with localhost HTTP allowed for development.
- Adds safer external-link attributes.
- Adds Vercel security headers through `vercel.json`.

The local `SECURITY.md` review artifact contains the detailed threat model, findings, fixes, and remaining notes. It is intentionally ignored by Git in this fork per maintainer request.

## Important Notice

- Chromium-based browsers such as [Chrome](https://www.google.com/chrome/) and [Microsoft Edge](https://www.microsoft.com/en-us/edge) are recommended.
- Back up your data regularly with `Save as...`. Resume data is stored locally in your browser, not in a hosted database.
- Import Markdown, JSON backups, and CSS only from sources you trust.

## Development

This is a [pnpm workspace](https://pnpm.io/workspaces) with the Nuxt site in `site` and shared local packages in `packages`.

Requirements:

- Node.js 20+
- pnpm 9+

Install dependencies:

```bash
pnpm install
```

Build local packages:

```bash
pnpm build:pkg
```

Run the Nuxt app locally:

```bash
pnpm dev
```

Build the static site:

```bash
pnpm build
```

Preview the generated build:

```bash
pnpm serve
```

To enable Google Fonts selection, create `site/.env` and add:

```bash
NUXT_PUBLIC_GOOGLE_FONTS_KEY="YOUR_API_KEY"
```

## Deploying To Vercel

This repo includes `vercel.json`, so Vercel can deploy from the repository root.

Use these settings if configuring the project manually:

- Framework preset: Nuxt.js
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm vercel:build`
- Output directory: leave unset
- Node.js version: 20+

Optional environment variable:

```bash
NUXT_PUBLIC_GOOGLE_FONTS_KEY="YOUR_API_KEY"
NUXT_PUBLIC_SITE_URL="https://your-vercel-domain.example"
```

The Vercel build step copies Nuxt's generated Vercel Build Output API bundle from `site/.vercel/output` to the repository root at `.vercel/output`, then patches that bundle with the browser security headers and editor route fallbacks. If Vercel's Project Settings has an Output Directory override, remove it; do not set it to `dist`, `public`, `site/.output/public`, or `site/.vercel/output/static`.

## GPL Compliance Notes

- This fork is licensed as [GPL-3.0-only](LICENSE).
- The fork source is available at [github.com/shiualan/oh-my-cv](https://github.com/shiualan/oh-my-cv).
- A visible legal notice page is available in the web app at `/legal`.
- `NOTICE` preserves upstream attribution and records the fork modification notice.
- Package metadata in the root and Nuxt site declares the GPL-3.0-only license and fork repository URL.
- Redistributors should preserve `LICENSE`, `NOTICE`, the original credits below, and the Git history for modified-file dates.

## Contribution

Contributions are welcome. Please read the [Contributing Guide](.github/CONTRIBUTING.md) before getting started.

## Credits And Attribution

This project is based on [Renovamen/oh-my-cv](https://github.com/Renovamen/oh-my-cv), created by [Renovamen](https://github.com/Renovamen).

Original project credits include:

- [billryan/resume](https://github.com/billryan/resume)
- [Iconify](https://github.com/iconify/iconify)
- [KaTeX](https://github.com/KaTeX/KaTeX)
- [localForage](https://localforage.github.io/localForage/)
- [Nuxt](https://nuxt.com/), [Vue](https://vuejs.org/), [Vite](https://vitejs.dev/), [Radix Vue](https://www.radix-vue.com/), [Zag](https://zagjs.com/), and [UnoCSS](https://unocss.dev/)

Please preserve the original author, project, and license notices when redistributing modified versions. This fork's own source repository is [shiualan/oh-my-cv](https://github.com/shiualan/oh-my-cv).

## License

[GPL-3.0](LICENSE)
