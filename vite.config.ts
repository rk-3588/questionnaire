import { defineConfig } from "vite";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Keep Blender's stable source/export paths, while production URLs identify
// exact bytes and can be cached without revalidation across deployments.
const models = ["archive-cassette", "archive-assembly"].map((name) => {
  const source = readFileSync(`public/assets/${name}.glb`);
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 16);
  return {
    key: `assets/${name}.glb`,
    fileName: `assets/${name}.${hash}.glb`,
    source,
  };
});
const hasNovecento = ["Normal", "DemiBold", "Bold"].every((weight) =>
  existsSync(
    `public/fonts/novecento/webFonts/NovecentoSansWide${weight}/font.woff2`,
  ),
);
export default defineConfig(({ mode, command }) => ({
  base: mode === "wallpaper" ? "./" : "/",
  // The research website ships only its own public resources. The original
  // assets remain available to the separate wallpaper build and local studies.
  publicDir: mode === "wallpaper" || command === "serve" ? "public" : false,
  define: {
    __RHINE_MODELS__: JSON.stringify(
      Object.fromEntries(models.map((model) => [model.key, model.fileName])),
    ),
    __RHINE_NOVECENTO__: JSON.stringify(hasNovecento),
  },
  plugins: [
    ...(mode === "wallpaper"
      ? [
          {
            name: "versioned-model-assets",
            apply: "build",
            buildStart() {
              for (const model of models)
                this.emitFile({
                  type: "asset",
                  fileName: model.fileName,
                  source: model.source,
                });
            },
          } satisfies import("vite").Plugin,
        ]
      : [
          {
            name: "survey-public-resources",
            apply: "build",
            buildStart() {
              for (const fileName of [
                "manifest.webmanifest",
                "survey-mark.svg",
                "update.html",
                "update.js",
                ...[
                  "apple-touch-icon",
                  "icon-192",
                  "icon-512",
                  "icon-maskable-512",
                ].map((name) => `icons/survey/${name}.png`),
              ])
                this.emitFile({
                  type: "asset",
                  fileName,
                  source: readFileSync(`public/${fileName}`),
                });
            },
          } satisfies import("vite").Plugin,
        ]),
    ...(mode === "wallpaper"
      ? [
          {
            name: "wallpaper-host",
            transformIndexHtml: {
              order: "pre" as const,
              handler(html: string) {
                return {
                  html: html
                    .replace(/\s*<link rel="manifest"[^>]*>/, "")
                    .replace(
                      '<div id="app"></div>',
                      '<main id="viewport"><div id="stage"></div></main>',
                    )
                    .replace("/src/research-app.ts", "/src/main.ts"),
                  tags: [
                    {
                      tag: "script",
                      children: readFileSync("wallpaper/host.js", "utf8"),
                      injectTo: "head-prepend" as const,
                    },
                  ],
                };
              },
            },
          },
        ]
      : []),
  ],
}));
