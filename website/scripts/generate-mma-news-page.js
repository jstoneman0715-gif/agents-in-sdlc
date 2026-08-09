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
const publicImagesDir = path.join(rootDir, 'public', 'agents', 'mma-news-updater', 'images');
const distImagesDir = path.join(distDir, 'agents', 'mma-news-updater', 'images');

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

let analysisData = {
  analyses: [],
};

let eventsData = {
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

// Try to load analyzed data
try {
  const analysisPath = path.join(rootDir, 'src', 'data', 'mma-analysis.json');
  if (fs.existsSync(analysisPath)) {
    const rawAnalysis = fs.readFileSync(analysisPath, 'utf-8');
    analysisData = JSON.parse(rawAnalysis);
  }
} catch (error) {
  console.error('Error loading analysis data:', error);
}

// Try to load events data
try {
  const eventsPath = path.join(rootDir, 'src', 'data', 'upcoming-events.json');
  console.log(`📂 Checking for events at: ${eventsPath}`);
  if (fs.existsSync(eventsPath)) {
    const rawEvents = fs.readFileSync(eventsPath, 'utf-8');
    console.log(`   File size: ${rawEvents.length} bytes`);
    eventsData = JSON.parse(rawEvents);
    console.log(`✓ Loaded events data: ${eventsData.articles?.length || 0} articles`);
    if (eventsData.articles && eventsData.articles.length > 0) {
      console.log(`   First event: ${eventsData.articles[0].title}`);
    }
  } else {
    console.log(`⚠️  Events file not found at: ${eventsPath}`);
    // List what files DO exist
    const dataDir = path.join(rootDir, 'src', 'data');
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      console.log(`   Available files: ${files.join(', ')}`);
    }
  }
} catch (error) {
  console.error('Error loading events data:', error);
}

// Use analyzed data if available, otherwise fall back to raw articles
const displayData = analysisData.analyses.length > 0 ? analysisData.analyses : newsData.articles;

console.log(`\n=== HTML GENERATION DEBUG ===`);
console.log(`News data loaded: ${newsData.articles?.length || 0} articles`);
console.log(`Events data loaded: ${eventsData.articles?.length || 0} events`);
console.log(`Analysis data loaded: ${analysisData.analyses?.length || 0} analyses`);
console.log(`Display mode: ${analysisData.analyses.length > 0 ? 'Analysis' : 'Raw articles'}`);
console.log(`Will show ${displayData.length} items in Latest News section`);
if (eventsData.articles && eventsData.articles.length > 0) {
  console.log(`✅ Events will render: showing top ${Math.min(3, eventsData.articles.length)} events`);
  eventsData.articles.slice(0, 3).forEach((e, i) => {
    console.log(`   Event ${i+1}: ${e.title.substring(0, 40)}...`);
  });
} else {
  console.log(`❌ Events WILL NOT render - empty or undefined`);
}

// Generate events HTML section separately to avoid nested template literal issues
let eventsSection = '';
if (eventsData && eventsData.articles && eventsData.articles.length > 0) {
  const eventCards = eventsData.articles.slice(0, 3).map((event) => {
    return `
    <div class="news-card">
      <div class="news-image">
        ${event.image ? `<img src="${event.image}" alt="${event.title}" />` : '🎫'}
      </div>
      <div class="news-content">
        <div class="news-source">${event.source || 'UFC/MMA Event'}</div>
        <div class="news-title">${event.title}</div>
        <div class="news-description">${event.description || 'Upcoming MMA event'}</div>
        <a href="${event.url}" target="_blank" class="read-more">View Event</a>
      </div>
    </div>
    `;
  }).join('');
  
  eventsSection = `
      <div style="text-align: center; margin: 3rem 0 2rem 0; padding-bottom: 2rem; border-bottom: 1px solid #333;">
        <h2 style="font-size: clamp(1.3rem, 3vw, 1.7rem); color: #ff6b35; margin-bottom: 0.5rem;">📅 Most Recent Events</h2>
        <p style="color: #aaa;">Upcoming UFC and MMA events</p>
      </div>

      <div class="news-grid">
        ${eventCards}
      </div>
  `;
}

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MMA News - Fightonomics | Fighter Analysis & Breaking Updates</title>
    <meta name="description" content="Daily MMA news, fighter analysis, and combat sports coverage by Julian Stoneman. Get breaking UFC updates, career insights, and data-driven analysis of the latest fights." />
    <meta name="keywords" content="MMA news, UFC news, fighter analysis, combat sports, boxing, wrestling, MMA rankings" />
    <meta name="author" content="Julian Stoneman" />
    <link rel="canonical" href="https://jstoneman0715-gif.github.io/fightonomics/mma-news/" />
    
    <!-- Open Graph Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://jstoneman0715-gif.github.io/fightonomics/mma-news/" />
    <meta property="og:title" content="MMA News - Fightonomics | Fighter Analysis & Breaking Updates" />
    <meta property="og:description" content="Daily MMA news and data-driven fighter analysis by Julian Stoneman. Breaking UFC updates, rankings, and combat sports coverage." />
    <meta property="og:image" content="https://jstoneman0715-gif.github.io/fightonomics/og-image.png" />
    <meta property="og:site_name" content="Fightonomics" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Twitter Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="MMA News - Fightonomics" />
    <meta name="twitter:description" content="Daily MMA news and fighter analysis by Julian Stoneman" />
    
    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Fightonomics",
      "url": "https://jstoneman0715-gif.github.io/fightonomics/",
      "description": "MMA news, fighter analysis, and combat sports coverage",
      "author": {
        "@type": "Person",
        "name": "Julian Stoneman",
        "description": "Amateur wrestling and boxing champion, lifelong MMA fan"
      }
    }
    </script>
    
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
        color: #e0e0e0;
        line-height: 1.6;
        min-height: 100vh;
      }

      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }

      header {
        text-align: center;
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 3px solid #ff6b35;
        animation: slideDown 0.6s ease;
      }

      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      header h1 {
        font-size: clamp(2rem, 8vw, 3.5rem);
        margin-bottom: 0.5rem;
        color: #ff6b35;
        text-transform: uppercase;
        letter-spacing: 3px;
        font-weight: 900;
      }

      .tagline {
        font-size: clamp(1rem, 3vw, 1.25rem);
        color: #aaa;
        margin-bottom: 1.5rem;
        font-weight: 300;
        letter-spacing: 1px;
      }

      .bio-section {
        background: linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.8) 100%);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 107, 53, 0.2);
        border-radius: 12px;
        padding: clamp(1.5rem, 4vw, 2.5rem);
        margin: 0 auto 2.5rem;
        max-width: 900px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .bio-title {
        color: #ff6b35;
        font-size: clamp(1.1rem, 2.5vw, 1.4rem);
        margin-bottom: 1rem;
        font-weight: 700;
      }

      .bio-text {
        color: #ccc;
        font-size: clamp(0.95rem, 2vw, 1.05rem);
        line-height: 1.8;
      }

      .pillar-nav {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1rem;
        margin-bottom: 3rem;
        max-width: 1100px;
        margin-left: auto;
        margin-right: auto;
      }

      .pillar-link {
        background: linear-gradient(135deg, #ff6b35 0%, #ff8555 100%);
        color: #000;
        padding: clamp(1rem, 2vw, 1.2rem) 1.5rem;
        border-radius: 8px;
        text-decoration: none;
        text-align: center;
        font-weight: 700;
        font-size: clamp(0.9rem, 1.5vw, 1rem);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 2px solid transparent;
        box-shadow: 0 4px 15px rgba(255, 107, 53, 0.2);
        cursor: pointer;
        display: inline-block;
        margin: 0 auto;
      }

      .pillar-link:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(255, 107, 53, 0.4);
        background: linear-gradient(135deg, #ff8555 0%, #ff6b35 100%);
      }

      .news-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;
      }

      .news-card {
        background: linear-gradient(135deg, #1a1a1a 0%, #262626 100%);
        border: 1px solid #333;
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
      }

      .news-card:hover {
        border-color: #ff6b35;
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(255, 107, 53, 0.25);
      }

      .news-image {
        width: 100%;
        height: 220px;
        background: #2a2a2a;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ff6b35;
        font-size: 2em;
        overflow: hidden;
      }

      .news-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .news-card:hover .news-image img {
        transform: scale(1.05);
      }

      .news-content {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }

      .news-source {
        font-size: 0.75em;
        color: #ff6b35;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 0.75rem;
        font-weight: 700;
      }

      .news-title {
        font-size: clamp(1.1rem, 2vw, 1.4rem);
        font-weight: 700;
        color: #fff;
        margin-bottom: 1rem;
        line-height: 1.4;
      }

      .news-description {
        font-size: 0.95em;
        color: #bbb;
        line-height: 1.6;
        margin-bottom: 1.25rem;
        flex-grow: 1;
      }

      .news-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #333;
        padding-top: 1rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .news-date {
        font-size: 0.85em;
        color: #888;
      }

      .read-more {
        color: #fff;
        background: linear-gradient(135deg, #ff6b35 0%, #ff8555 100%);
        text-decoration: none;
        font-weight: 700;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-size: 0.95rem;
        min-width: 140px;
        justify-content: center;
      }

      .read-more:hover {
        color: #000;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #888;
      }

      .empty-state h2 {
        color: #ff6b35;
        margin-bottom: 1rem;
        font-size: clamp(1.2rem, 3vw, 1.6rem);
      }

      @media (max-width: 1024px) {
        .pillar-nav { gap: 0.75rem; }
      }

      @media (max-width: 768px) {
        .container { padding: 1rem; }
        header h1 { letter-spacing: 2px; }
        .pillar-nav { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
        .news-grid { grid-template-columns: 1fr; gap: 1.5rem; }
        .news-footer { flex-direction: column; align-items: flex-start; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>Fightonomics</h1>
        <div class="tagline">MMA News, Analysis & Commentary</div>
      </header>

      <div class="bio-section">
        <div class="bio-title">Welcome to Fightonomics</div>
        <div class="bio-text">
          <p>Hi, I'm <strong>Julian Stoneman</strong>, an amateur wrestling and boxing champion with a lifelong passion for mixed martial arts. Fightonomics is my project to deliver data-driven analysis, career insights, and breaking MMA news. Whether you're interested in fighter statistics, career trajectories, or upcoming matchups, you'll find in-depth coverage here.</p>
        </div>
      </div>

      <div class="pillar-nav">
        <a href="/fightonomics/numbers-dont-lie/" class="pillar-link">Numbers Don't Lie</a>
        <a href="/fightonomics/career-arcs/" class="pillar-link">Career Arcs</a>
        <a href="/fightonomics/hot-news/" class="pillar-link">Hot News This Week</a>
        <a href="/fightonomics/projected-matchups/" class="pillar-link">Projected Matchups</a>
        <a href="/fightonomics/upcoming-events/" class="pillar-link">Upcoming Events</a>
      </div>

      ${eventsSection}

      <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #333;">
        <h2 style="font-size: clamp(1.3rem, 3vw, 1.7rem); color: #ff6b35; margin-bottom: 0.5rem;">Latest News</h2>
        <p style="color: #aaa;">Breaking MMA news and event coverage</p>
      </div>

      ${displayData.length > 0 ? `
        <div class="news-grid">
          ${displayData.map((item) => {
            const article = item.originalArticle || item;
            const take = item.ourTake || '';
            return `
            <div class="news-card">
              <div class="news-image">
                ${article.image ? `
                  <img src="${article.image}" alt="${article.title}" />
                ` : `
                  🥊
                `}
              </div>
              <div class="news-content">
                <div class="news-source">${article.source}</div>
                <h2 class="news-title">${article.title}</h2>
                <div style="background: rgba(255, 107, 53, 0.1); padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 3px solid #ff6b35;">
                  <div style="font-size: 0.85em; color: #ff6b35; font-weight: 700; margin-bottom: 0.5rem;">⚡ FIGHTONOMICS TAKE:</div>
                  <p class="news-description" style="color: #ddd; font-style: italic; margin: 0;">${take}</p>
                </div>
                <p class="news-description">${article.description || 'Read the full story'}</p>
                <div class="news-footer">
                  <span class="news-date">${new Date(article.publishedAt).toLocaleDateString()}</span>
                  <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-more">Read Full Article →</a>
                </div>
              </div>
            </div>
          `}).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <h2>No articles available yet</h2>
          <p>Check back soon for the latest MMA news and analysis</p>
        </div>
      `}
    </div>
  </body>
</html>`;

// Write index.html
fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf-8');
console.log('✓ Generated mma-news/index.html');
console.log(`  - Rendered ${displayData.length} articles in Latest News section`);
console.log(`  - Rendered ${eventsData.articles?.length || 0} events in Events section`);
console.log(`  - Total HTML size: ${(html.length / 1024).toFixed(1)}KB`);

