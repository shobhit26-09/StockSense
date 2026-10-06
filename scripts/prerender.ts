// Runs after `vite build`. Writes dist/<route>/index.html for every public route with its own
// title, description, canonical, Open Graph tags and readable HTML content, so crawlers that do
// not run JavaScript still see a real page. The React app replaces the content on load.

import { mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, resolve } from "path"
import { ALL_SEO_ROUTES, SEO_ROUTES, SITE_URL, type SeoRoute } from "../src/config/seoRoutes"

const distDir = resolve("dist")
const template = readFileSync(resolve(distDir, "index.html"), "utf8")

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const nav = SEO_ROUTES.filter((r) => r.path !== "/privacy")
  .map((r) => `<a style="color:#a1a1aa" href="${r.path}">${esc(r.h1)}</a>`)
  .join("\n          ")

function body(route: SeoRoute) {
  return `<div id="root">
      <div style="min-height:100vh;background:#0b0b0d;color:#f4f4f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center">
        <div style="font-size:1.1rem;font-weight:700;letter-spacing:-0.02em"><a style="color:inherit;text-decoration:none" href="/">StockSense</a></div>
        <h1 style="margin-top:0.75rem;font-size:1.6rem;font-weight:700">${esc(route.h1)}</h1>
        <p style="margin-top:0.75rem;max-width:36rem;color:#a1a1aa;font-size:0.95rem;line-height:1.6">${esc(route.intro)}</p>
        <nav style="margin-top:1.5rem;display:flex;flex-wrap:wrap;gap:0.5rem 1.25rem;justify-content:center;font-size:0.85rem">
          ${nav}
        </nav>
      </div>
    </div>
    <noscript>
      <p style="padding:1rem;font-family:system-ui,sans-serif">JavaScript is required for live market data.</p>
    </noscript>`
}

function render(route: SeoRoute) {
  const url = `${SITE_URL}${route.path === "/" ? "/" : route.path}`
  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`)
  const setMeta = (re: RegExp, tag: string) => {
    if (!re.test(html)) throw new Error(`prerender: pattern not found ${re}`)
    html = html.replace(re, tag)
  }
  setMeta(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(route.description)}" />`)
  setMeta(/<link\s+rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${url}" />`)
  setMeta(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(route.title)}" />`)
  setMeta(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(route.description)}" />`)
  setMeta(/<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${url}" />`)
  setMeta(/<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${esc(route.title)}" />`)
  setMeta(/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${esc(route.description)}" />`)
  setMeta(/<div id="root">[\s\S]*?<\/noscript>/, body(route))
  return html
}

for (const route of ALL_SEO_ROUTES) {
  const out = route.path === "/" ? resolve(distDir, "index.html") : resolve(distDir, "." + decodeURIComponent(route.path), "index.html")
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, render(route))
}
console.log(`prerendered ${ALL_SEO_ROUTES.length} routes`)
