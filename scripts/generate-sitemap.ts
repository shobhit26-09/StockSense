// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs"
import { resolve } from "path"

const BASE_URL = "https://stocksensee.netlify.app"
const LASTMOD = new Date().toISOString().slice(0, 10)

interface SitemapEntry {
  path: string
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: string
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/agent", changefreq: "daily", priority: "0.9" },
  { path: "/sectors", changefreq: "daily", priority: "0.8" },
  { path: "/heatmap", changefreq: "daily", priority: "0.8" },
  { path: "/movers", changefreq: "daily", priority: "0.8" },
  { path: "/macro", changefreq: "daily", priority: "0.7" },
  { path: "/news", changefreq: "hourly", priority: "0.7" },
  { path: "/privacy", changefreq: "monthly", priority: "0.3" },
]

function generateSitemap(list: SitemapEntry[]) {
  const urls = list.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      `    <lastmod>${LASTMOD}</lastmod>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  )

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n")
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries))
console.log(`sitemap.xml written (${entries.length} entries)`)
