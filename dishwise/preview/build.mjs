/**
 * Builds the browser-only Dishwise preview as ONE self-contained HTML file:
 *   node preview/build.mjs  →  preview/dist/dishwise-preview.html
 * React loads from cdnjs; everything else (app code + CSS) is inlined.
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const out = path.join(here, "dist");
mkdirSync(out, { recursive: true });

const reactGlobals = {
  name: "react-globals",
  setup(b) {
    b.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({ path: path.join(here, "shims/jsx-runtime.ts") }));
    b.onResolve({ filter: /^react(-dom)?(\/client)?$/ }, (a) => ({ path: a.path, namespace: "global" }));
    b.onLoad({ filter: /.*/, namespace: "global" }, (a) => ({
      contents: `module.exports = window.${a.path.startsWith("react-dom") ? "ReactDOM" : "React"};`,
      loader: "js",
    }));
    b.onResolve({ filter: /^next\/link$/ }, () => ({ path: path.join(here, "shims/next-link.tsx") }));
    b.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: path.join(here, "shims/next-navigation.ts") }));
    b.onResolve({ filter: /^@\// }, (a) => b.resolve(`./${a.path.slice(2)}`, { resolveDir: path.join(root, "src"), kind: a.kind }));
  },
};

const result = await build({
  entryPoints: [path.join(here, "main.tsx")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: ["es2020"],
  jsx: "automatic",
  resolveExtensions: [".tsx", ".ts", ".jsx", ".js"],
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [reactGlobals],
  logLevel: "warning",
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const cssOut = path.join(out, "app.css");
execFileSync(path.join(root, "node_modules/.bin/tailwindcss"), ["-i", path.join(root, "src/app/globals.css"), "-o", cssOut, "--minify"], { cwd: root, stdio: "pipe" });
const css = readFileSync(cssOut, "utf8");

const html = `<title>Dishwise</title>
<meta name="description" content="Know what to order. Discover what you love.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400..700&display=swap">
<style>
:root{--font-inter:"Inter";--font-fraunces:"Fraunces";}
${css}
</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js}</script>
`;
writeFileSync(path.join(out, "dishwise-preview.html"), html);
console.log(`Built preview/dist/dishwise-preview.html (${(html.length / 1024).toFixed(0)} KB)`);
