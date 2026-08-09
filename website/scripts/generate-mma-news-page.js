#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const dataPath = path.join(rootDir, 'src', 'data', 'mma-news.json');
const distDir = path.join(rootDir, 'dist');
const outputDir = path.join(distDir, 'mma-news');
const publicImagesDir = path.join(rootDir, 'public', 'fightonomics', 'agents', 'mma-news-updater', 'images');
const distImagesDir = path.join(distDir, 'fightonomics', 'agents', 'mma-news-updater', 'images');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Copy images from public to dist if they exist
if (fs.existsSync(publicImagesDir)) {
  if (!fs.existsSync(distImagesDir)) {
    fs.mkdirSync(distImagesDir, { recursive: true });
  }
  const files = fs.readdirSync(publicImagesDir);
  for (const file of files) {
    const src = path.join(publicImagesDir, file);
    const dest = path.join(distImagesDir, file);
    fs.copyFileSync(src, dest);
  }
  console.log(`✓ Copied ${files.length} images to dist`);
}

let newsData = {
  lastUpdated: new Date().toISOString(),
  articles: [],
};

try {
  if (fs.existsSync(dataPath)) {
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    newsData = JSON.parse(rawData);
  }
} catch (error) {
  console.error('Error loading MMA news data:', error);
}

const articles = newsData.articles || [];
const lastUpdated = new Date(newsData.lastUpdated);

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MMA News</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 20px;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
      }

      header {
        text-align: center;
        color: white;
        margin-bottom: 40px;
        padding: 40px 20px;
      }

      header h1 {
        font-size: 2.5em;
        margin-bottom: 10px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      }

      .update-info {
        font-size: 0.9em;
        opacity: 0.9;
        margin-top: 15px;
      }

      .news-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
      }

      .news-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        display: flex;
        flex-direction: column;
      }

      .news-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
      }

      .news-image {
        width: 100%;
        height: 200px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.9em;
        overflow: hidden;
      }

      .news-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .news-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }

      .news-source {
        font-size: 0.85em;
        color: #667eea;
        font-weight: 600;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .news-title {
        font-size: 1.2em;
        font-weight: 700;
        color: #222;
        margin-bottom: 12px;
        line-height: 1.4;
      }

      .news-description {
        font-size: 0.95em;
        color: #666;
        line-height: 1.6;
        margin-bottom: 15px;
        flex-grow: 1;
      }

      .news-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #eee;
        padding-top: 15px;
      }

      .news-date {
        font-size: 0.85em;
        color: #999;
      }

      .read-more {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-decoration: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.9em;
        transition: opacity 0.3s ease;
      }

      .read-more:hover {
        opacity: 0.9;
      }

      .empty-state {
        text-align: center;
        color: white;
        padding: 60px 20px;
      }

      .empty-state h2 {
        font-size: 2em;
        margin-bottom: 10px;
      }

      .empty-state p {
        font-size: 1.1em;
        opacity: 0.9;
      }

      @media (max-width: 768px) {
        header h1 {
          font-size: 2em;
        }

        .news-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>🥊 MMA News</h1>
        <p>Latest Mixed Martial Arts News & Updates</p>
        <div class="update-info">
          <p>Last updated: ${lastUpdated.toLocaleString()}</p>
          <p>Updates twice daily at 12:00 AM and 12:00 PM UTC</p>
        </div>
      </header>

      ${articles.length > 0 ? `
        <div class="news-grid">
          ${articles.map((article) => `
            <div class="news-card">
              <div class="news-image">
                ${article.image ? `
                  <img src="${article.image}" alt="${article.title}" />
                ` : `
                  <span>🥊 MMA News</span>
                `}
              </div>
              <div class="news-content">
                <div class="news-source">${article.source}</div>
                <h2 class="news-title">${article.title}</h2>
                <p class="news-description">${article.description || 'No description available'}</p>
                <div class="news-footer">
                  <span class="news-date">${new Date(article.publishedAt).toLocaleDateString()}</span>
                  <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-more">Read More</a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <h2>No articles available yet</h2>
          <p>Check back soon! The system fetches fresh MMA news twice daily.</p>
        </div>
      `}
    </div>
  </body>
</html>`;

// Write index.html
fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf-8');
console.log('✓ Generated mma-news/index.html');

