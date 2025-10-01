#!/usr/bin/env node
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const glob = require("glob");
const parser = require("@babel/parser");
const generate = require("@babel/generator").default;

const serverDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(serverDir, "..");
const clientSrc = path.resolve(repoRoot, "client", "src");
const serverSrc = serverDir;

const EXTS = [".js", ".jsx", ".ts", ".tsx", ".cjs", ".mjs"];
const IGNORE_DIRS = [
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".vercel",
  ".output",
];

const patternFrom = (dir) =>
  `${dir.replace(/\\/g, "/")}/**/*.{js,jsx,ts,tsx,cjs,mjs}`;

function babelPluginsFor(file) {
  const plugins = [
    "jsx",
    "classProperties",
    "classPrivateProperties",
    "classPrivateMethods",
    "decorators-legacy",
    "objectRestSpread",
    "optionalCatchBinding",
    "optionalChaining",
    "nullishCoalescingOperator",
    "dynamicImport",
    "importMeta",
    "topLevelAwait",
  ];

  if (file.endsWith(".ts") || file.endsWith(".tsx")) plugins.push("typescript");
  return plugins;
}

async function stripFile(file) {
  const src = await fsp.readFile(file, "utf8");
  try {
    const ast = parser.parse(src, {
      sourceType: "unambiguous",
      errorRecovery: true,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      plugins: babelPluginsFor(file),
    });
    const { code } = generate(
      ast,
      {
        comments: false,
        retainLines: true,
        compact: false,
        jsescOption: { minimal: true },
      },
      src
    );
    if (code !== src) {
      await fsp.writeFile(file, code, "utf8");
      return { changed: true };
    }
    return { changed: false };
  } catch (err) {
    return { changed: false, error: err };
  }
}

function isIgnored(file) {
  const parts = file.split(path.sep);
  return parts.some((p) => IGNORE_DIRS.includes(p));
}

async function run() {
  const start = Date.now();
  const targets = [clientSrc, serverSrc].filter((p) => fs.existsSync(p));
  if (targets.length === 0) {
    console.error("No targets found to process.");
    process.exit(1);
  }

  let files = [];
  for (const dir of targets) {
    const pat = patternFrom(dir);
    files = files.concat(glob.sync(pat, { nodir: true }));
  }

  files = files.filter((f) => EXTS.includes(path.extname(f)) && !isIgnored(f));

  let changed = 0;
  let failed = 0;
  for (const file of files) {
    const res = await stripFile(file);
    if (res.changed) changed += 1;
    if (res.error) {
      failed += 1;
      console.warn(`[skip] ${file}: ${res.error.message}`);
    }
  }

  const ms = Date.now() - start;
  console.log(
    `Processed ${files.length} files. Updated: ${changed}. Failed: ${failed}. Time: ${ms}ms`
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
