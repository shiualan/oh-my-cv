import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nativeVercelOutputDir = resolve(rootDir, "site/.vercel/output");
const staticOutputDir = resolve(rootDir, "site/.output/public");
const targetDir = resolve(rootDir, ".vercel/output");
const targetStaticDir = resolve(targetDir, "static");
const configPath = resolve(targetDir, "config.json");

const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://code.iconify.design; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload"
};

const editorFallbackRoutes = [
  { src: "/editor/(.*)", dest: "/200.html" },
  { src: "/en/editor/(.*)", dest: "/200.html" },
  { src: "/sp/editor/(.*)", dest: "/200.html" },
  { src: "/zh-cn/editor/(.*)", dest: "/200.html" }
];

async function directoryExists(path) {
  const stats = await stat(path).catch(() => null);

  return stats?.isDirectory() === true;
}

async function collectCleanUrlOverrides(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const overrides = {};

  for (const entry of entries) {
    const path = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      Object.assign(overrides, await collectCleanUrlOverrides(path, baseDir));
      continue;
    }

    if (entry.name !== "index.html") {
      continue;
    }

    const relativePath = relative(baseDir, path).split(sep).join("/");
    const cleanPath = dirname(relativePath).replace(/^\.$/, "");

    overrides[relativePath] = { path: cleanPath };
  }

  return overrides;
}

async function patchVercelConfig() {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const routes = Array.isArray(config.routes) ? config.routes : [];

  config.routes = [
    {
      src: "/(.*)",
      headers: securityHeaders,
      continue: true
    },
    ...routes,
    ...editorFallbackRoutes
  ];

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function createStaticVercelOutput() {
  if (!(await directoryExists(staticOutputDir))) {
    throw new Error(
      `Expected Nuxt output at ${staticOutputDir}. Run "pnpm --filter=site build" first.`
    );
  }

  await mkdir(targetStaticDir, { recursive: true });
  await cp(staticOutputDir, targetStaticDir, { recursive: true });

  const config = {
    version: 3,
    overrides: await collectCleanUrlOverrides(targetStaticDir),
    routes: [
      {
        src: "/(.*)",
        headers: securityHeaders,
        continue: true
      },
      {
        src: "/_nuxt/(.*)",
        headers: {
          "cache-control": "public, max-age=31536000, immutable"
        },
        continue: true
      },
      {
        handle: "filesystem"
      },
      ...editorFallbackRoutes
    ]
  };

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

await rm(targetDir, { recursive: true, force: true });
await mkdir(dirname(targetDir), { recursive: true });

if (process.env.VERCEL && (await directoryExists(nativeVercelOutputDir))) {
  await cp(nativeVercelOutputDir, targetDir, { recursive: true });
  await patchVercelConfig();
} else {
  await createStaticVercelOutput();
}

console.log(`Prepared Vercel Build Output API bundle at ${targetDir}`);
