#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const baseUrl = 'https://jstoneman0715-gif.github.io/fightonomics';
const lastmod = new Date().toISOString().split('T')[0];

const pages = [
  {
    loc: '/',
    changefreq: 'daily',
    priority: '1.0',
    lastmod
  },
  {
    loc: '/mma-news/',
    changefreq: 'daily',
    priority: '0.95',
    lastmod
  },
  {
    loc: '/numbers-dont-lie/',
    changefreq: 'weekly',
    priority: '0.8',
    lastmod
  },
  {
    loc: '/career-arcs/',
    changefreq: 'weekly',
    priority: '0.8',
    lastmod
  },
  {
    loc: '/hot-news/',
    changefreq: 'daily',
    priority: '0.85',
    lastmod
  },
  {
    loc: '/projected-matchups/',
    changefreq: 'weekly',
    priority: '0.8',
    lastmod
  },
  {
    loc: '/upcoming-events/',
    changefreq: 'weekly',
    priority: '0.8',
    lastmod
  }
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

const sitemapPath = path.join(distDir, 'sitemap.xml');
fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
console.log(`✅ Sitemap generated: ${sitemapPath}`);
