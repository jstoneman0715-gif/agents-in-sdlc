import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, '../src/data/mma-news.json');

// Helper to download images into website/public so they are served by GitHub Pages.
async function downloadImageToPublic(url, slugBase) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    const ext = contentType.split('/').pop().split(';')[0] || 'jpg';
    const safeExt = ext.split('?')[0];
    const fileName = `${slugBase}.${safeExt}`;
    const imagesDir = path.join(__dirname, '../public/agents/mma-news-updater/images');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
    const outPath = path.join(imagesDir, fileName);
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
    // Return the absolute path used by the site (site is hosted at /fightonomics, but agents is at root)
    return `/fightonomics/agents/mma-news-updater/images/${fileName}`;
  } catch (e) {
    return null;
  }
}


// Extract fighter names and keywords from text
function extractFighterKeywords(text) {
  if (!text) return [];
  
  // Extended list of MMA fighters and sports-related terms
  const fighterPatterns = [
    /\b(Conor|McGregor|Dustin|Poirier|Nate|Diaz|Jorge|Masvidal|Jon|Jones|Stipe|Miocic|Israel|Adesanya|Sean|Strickland|Alex|Pereira|Leon|Edwards|Kamaru|Usman|Colby|Covington|Max|Holloway)\b/gi,
    /\b(UFC|MMA|boxing|fighter|champion|knockout|KO|submission|belt|bout|match|combat)\b/gi,
  ];
  
  const keywords = [];
  for (const pattern of fighterPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      keywords.push(...matches.map(m => m.toLowerCase()));
    }
  }
  
  return [...new Set(keywords)];
}

// Search for high-quality fighter images across multiple sources
async function fetchFighterImage(searchQuery) {
  // Build search variations: original query, specific fighter names, plus general sports terms
  const baseQueries = [searchQuery];
  const keywords = extractFighterKeywords(searchQuery);
  const fighterNames = keywords.filter(k => /^[a-z]+$/.test(k) && k.length > 3);
  
  // Prioritize fighter-specific searches over generic MMA terms
  const queries = [
    ...fighterNames.slice(0, 2),  // Top 2 fighter names
    searchQuery,
    ...keywords.filter(k => k === 'mma' || k === 'boxing' || k === 'fighter'),
  ].filter(Boolean);
  
  for (const query of queries) {
    try {
      // Try Unsplash first (high-quality free images)
      const unsplashRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&order_by=relevant&client_id=cJv9DBiCqRZBj6t9vGtcnG9Yj2h7vAP2iXjfW2RzWH0`
      ).then(r => r.ok ? r.json() : null);
      
      if (unsplashRes?.results?.length > 0) {
        // Pick the most relevant one (usually index 0)
        const img = unsplashRes.results[0];
        if (img.urls?.regular && img.likes > 10) {  // Prefer popular images
          console.log(`  📸 Found Unsplash image for: ${query} (${img.likes} likes)`);
          return img.urls.regular;
        }
      }
    } catch (e) {
      // Continue to next source
    }
    
    try {
      // Try Pexels (high-quality free images)
      const pexelsRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3`
      ).then(r => r.ok ? r.json() : null);
      
      if (pexelsRes?.photos?.length > 0) {
        const photo = pexelsRes.photos[0];
        if (photo.src?.large2x) {
          console.log(`  📸 Found Pexels image for: ${query}`);
          return photo.src.large2x;  // High-res version
        }
      }
    } catch (e) {
      // Continue to next source
    }
    
    try {
      // Try Pixabay (high-quality free images)
      const pixabayRes = await fetch(
        `https://pixabay.com/api/?q=${encodeURIComponent(query)}&image_type=photo&per_page=3&order=popular&key=43292100-68a1cc19f7c3b4d8a1ff3e000`
      ).then(r => r.ok ? r.json() : null);
      
      if (pixabayRes?.hits?.length > 0) {
        const hit = pixabayRes.hits[0];
        if (hit.largeImageURL) {
          console.log(`  📸 Found Pixabay image for: ${query} (${hit.downloads} downloads)`);
          return hit.largeImageURL;
        }
      }
    } catch (e) {
      // Continue to next source
    }
  }
  
  return null;
}

async function fetchMMANews() {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.error('❌ ERROR: NEWS_API_KEY environment variable not set');
    process.exit(1);
  }

  try {
    console.log('🔄 Fetching MMA news...');
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=MMA&sortBy=publishedAt&language=en&pageSize=20&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error(`API returned error: ${data.message}`);
    }

    console.log('🔍 Processing articles and finding fighter images...');
    
    const articles = await Promise.all(
      data.articles.map(async (article) => {
        let image = article.urlToImage;
        
        // Try to find a better fighter image if original is missing
        if (!image) {
          console.log(`  🔎 Searching for image: "${article.title.substring(0, 50)}..."`);
          image = await fetchFighterImage(article.title);
        }
        
        // If image exists, attempt to download and use local path
        let localImage = null;
        if (image) {
          const slugBase = (article.title || 'fighter').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now()}`;
          localImage = await downloadImageToPublic(image, slugBase);
        }

        return {
          title: article.title,
          description: article.description,
          url: article.url,
          image: localImage || image || null,
          source: article.source.name,
          publishedAt: article.publishedAt,
          author: article.author,
        };
      })
    );

    // Ensure data directory exists
    const dataDir = path.dirname(dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write to JSON file
    fs.writeFileSync(
      dataFile,
      JSON.stringify(
        {
          lastUpdated: new Date().toISOString(),
          articles: articles,
        },
        null,
        2
      )
    );

    const withImages = articles.filter(a => a.image).length;
    console.log(`✅ Success! Fetched ${articles.length} MMA articles`);
    console.log(`📸 ${withImages}/${articles.length} articles have images`);
    console.log(`📁 Saved to: ${dataFile}`);
    console.log(`⏰ Last updated: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('❌ Error fetching MMA news:', error.message);
    process.exit(1);
  }
}

fetchMMANews();
