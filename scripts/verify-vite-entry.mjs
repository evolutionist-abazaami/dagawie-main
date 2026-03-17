#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const indexHtmlPath = path.join(repoRoot, "index.html");
const srcMainPath = path.join(repoRoot, "src", "main.tsx");

function fail(msg) {
  // eslint-disable-next-line no-console
  console.error(`\n[verify-vite-entry] ${msg}\n`);
  process.exit(1);
}

if (!fs.existsSync(indexHtmlPath)) fail(`Missing ${indexHtmlPath}`);
if (!fs.existsSync(srcMainPath)) fail(`Missing ${srcMainPath}`);

const html = fs.readFileSync(indexHtmlPath, "utf8");

// Vite expects an absolute-from-root path for the HTML entry in most setups.
const expected = /<script\s+type=["']module["']\s+src=["']\/src\/main\.tsx["']\s*>\s*<\/script>/i;

if (!expected.test(html)) {
  const hasBare = /src=["']src\/main\.tsx["']/i.test(html);
  const hasRelative = /src=["']\.\/src\/main\.tsx["']/i.test(html);

  if (hasBare) {
    fail(
      `index.html uses src=\"src/main.tsx\" which breaks Vercel/Rollup resolution. Use src=\"/src/main.tsx\" instead.`
    );
  }
  if (hasRelative) {
    fail(
      `index.html uses src=\"./src/main.tsx\". Use src=\"/src/main.tsx\" for consistent Vite resolution.`
    );
  }

  fail(
    `index.html must include: <script type="module" src="/src/main.tsx"></script>`
  );
}

process.exit(0);

