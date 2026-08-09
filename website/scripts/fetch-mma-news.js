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


// Search for specific types of images for pillar pages
async function fetchFighterImages(count = 2) {
  const fighterQueries = ['MMA fighter', 'UFC fighter', 'boxer', 'combat sports'];
  const images = [];
  
  for (const query of fighterQueries) {
    if (images.length >= count) break;
    
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&order_by=relevant&client_id=cJv9DBiCqRZBj6t9vGtcnG9Yj2h7vAP2iXjfW2RzWH0`
      ).then(r => r.ok ? r.json() : null);
      
      if (res?.results?.length > 0) {
        const img = res.results.find(i => i.urls?.regular && i.width > 640 && i.height > 400) || res.results[0];
        if (img && img.urls?.regular) {
          images.push(img.urls.regular);
        }
      }
    } catch (e) {
      // Continue
    }
  }
  
  return images.slice(0, count);
}

async function fetchAnalyticsImage() {
  const queries = ['data analytics', 'statistics chart', 'performance graph', 'sports analytics'];
  
  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&order_by=relevant&client_id=cJv9DBiCqRZBj6t9vGtcnG9Yj2h7vAP2iXjfW2RzWH0`
      ).then(r => r.ok ? r.json() : null);
      
      if (res?.results?.length > 0) {
        const img = res.results.find(i => i.urls?.regular && i.width > 640 && i.height > 400) || res.results[0];
        if (img && img.urls?.regular) {
          return img.urls.regular;
        }
      }
    } catch (e) {
      // Continue
    }
  }
  
  return null;
}
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
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&order_by=relevant&client_id=cJv9DBiCqRZBj6t9vGtcnG9Yj2h7vAP2iXjfW2RzWH0`
      ).then(r => r.ok ? r.json() : null);
      
      if (unsplashRes?.results?.length > 0) {
        // Find best quality image (high resolution, well-liked)
        const img = unsplashRes.results.find(i => 
          i.urls?.regular && 
          i.width > 640 && 
          i.height > 400 &&
          (i.likes > 5 || i.views > 100)
        ) || unsplashRes.results[0];
        
        if (img && img.urls?.regular) {
          console.log(`  📸 Found Unsplash image for: ${query} (${img.likes} likes, ${img.width}x${img.height})`);
          return img.urls.regular;
        }
      }
    } catch (e) {
      console.warn(`  ⚠️ Unsplash error: ${e.message}`);
    }
    
    try {
      // Try Pexels (high-quality free images)
      const pexelsRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5`
      ).then(r => r.ok ? r.json() : null);
      
      if (pexelsRes?.photos?.length > 0) {
        const photo = pexelsRes.photos.find(p => 
          p.src?.large2x && 
          p.width > 640 && 
          p.height > 400
        ) || pexelsRes.photos[0];
        
        if (photo && (photo.src?.large2x || photo.src?.large)) {
          const url = photo.src.large2x || photo.src.large;
          console.log(`  📸 Found Pexels image for: ${query} (${photo.width}x${photo.height})`);
          return url;
        }
      }
    } catch (e) {
      console.warn(`  ⚠️ Pexels error: ${e.message}`);
    }
    
    try {
      // Try Pixabay (high-quality free images)
      const pixabayRes = await fetch(
        `https://pixabay.com/api/?q=${encodeURIComponent(query)}&image_type=photo&per_page=5&order=popular&min_width=640&min_height=400&key=43292100-68a1cc19f7c3b4d8a1ff3e000`
      ).then(r => r.ok ? r.json() : null);
      
      if (pixabayRes?.hits?.length > 0) {
        const hit = pixabayRes.hits[0];
        if (hit.largeImageURL) {
          console.log(`  📸 Found Pixabay image for: ${query} (${hit.downloads} downloads)`);
          return hit.largeImageURL;
        }
      }
    } catch (e) {
      console.warn(`  ⚠️ Pixabay error: ${e.message}`);
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
    console.log('🔄 Fetching MMA news and data for all pillar pages...');
    
    // Fetch main MMA news
    const mainResponse = await fetch(
      `https://newsapi.org/v2/everything?q=MMA&sortBy=publishedAt&language=en&pageSize=20&apiKey=${apiKey}`
    );
    if (!mainResponse.ok) throw new Error(`API Error: ${mainResponse.status}`);
    const mainData = await mainResponse.json();
    if (mainData.status !== 'ok') throw new Error(`API returned error: ${mainData.message}`);

    // Fetch statistics/analysis articles
    const statsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=MMA+statistics+OR+UFC+stats+OR+fighter+analytics&sortBy=publishedAt&language=en&pageSize=10&apiKey=${apiKey}`
    );
    const statsData = statsResponse.ok ? await statsResponse.json() : { articles: [] };

    // Fetch career/fighter profile content
    const careerResponse = await fetch(
      `https://newsapi.org/v2/everything?q=MMA+fighter+profile+OR+career+OR+trajectory&sortBy=publishedAt&language=en&pageSize=10&apiKey=${apiKey}`
    );
    const careerData = careerResponse.ok ? await careerResponse.json() : { articles: [] };

    // Fetch upcoming events
    const eventsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=UFC+event+OR+MMA+event+upcoming&sortBy=publishedAt&language=en&pageSize=10&apiKey=${apiKey}`
    );
    const eventsData = eventsResponse.ok ? await eventsResponse.json() : { articles: [] };

    // Fetch fight predictions/matchups
    const matchupsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=MMA+matchup+OR+prediction+OR+odds&sortBy=publishedAt&language=en&pageSize=10&apiKey=${apiKey}`
    );
    const matchupsData = matchupsResponse.ok ? await matchupsResponse.json() : { articles: [] };

    console.log('🔍 Processing articles and finding fighter images...');
    
    // Process each category
    const processArticles = async (articles) => {
      return Promise.all(
        articles.map(async (article) => {
          let image = article.urlToImage;
          if (!image) {
            console.log(`  🔎 Searching for image: "${article.title.substring(0, 50)}..."`);
            image = await fetchFighterImage(article.title);
          }
          
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
    };

    const [mainArticles, statsArticles, careerArticles, eventsArticles, matchupsArticles] = await Promise.all([
      processArticles(mainData.articles || []),
      processArticles(statsData.articles || []),
      processArticles(careerData.articles || []),
      processArticles(eventsData.articles || []),
      processArticles(matchupsData.articles || []),
    ]);

    // Ensure data directory exists
    const dataDir = path.dirname(dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Fetch hero images for each pillar page
    console.log('📸 Fetching hero images for pillar pages...');
    const fighterImages = await fetchFighterImages(2);
    const analyticsImage = await fetchAnalyticsImage();
    
    const heroImages = {
      fighters: fighterImages,
      analytics: analyticsImage,
    };

    // Write all data files
    const baseData = {
      lastUpdated: new Date().toISOString(),
      heroImages: heroImages,
    };

    fs.writeFileSync(
      dataFile,
      JSON.stringify({ ...baseData, articles: mainArticles }, null, 2)
    );

    fs.writeFileSync(
      path.join(dataDir, 'numbers-dont-lie.json'),
      JSON.stringify({ ...baseData, articles: statsArticles }, null, 2)
    );

    fs.writeFileSync(
      path.join(dataDir, 'career-arcs.json'),
      JSON.stringify({ ...baseData, articles: careerArticles }, null, 2)
    );

    fs.writeFileSync(
      path.join(dataDir, 'upcoming-events.json'),
      JSON.stringify({ ...baseData, articles: eventsArticles }, null, 2)
    );

    fs.writeFileSync(
      path.join(dataDir, 'projected-matchups.json'),
      JSON.stringify({ ...baseData, articles: matchupsArticles }, null, 2)
    );

    // Hot News This Week - get articles from the past 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const hotNewsArticles = mainArticles.filter(a => new Date(a.publishedAt) > oneWeekAgo);
    
    fs.writeFileSync(
      path.join(dataDir, 'hot-news.json'),
      JSON.stringify({ ...baseData, articles: hotNewsArticles }, null, 2)
    );

    const totalArticles = mainArticles.length + statsArticles.length + careerArticles.length + 
                         eventsArticles.length + matchupsArticles.length;
    const totalImages = [mainArticles, statsArticles, careerArticles, eventsArticles, matchupsArticles]
      .reduce((sum, arr) => sum + arr.filter(a => a.image).length, 0);

    console.log(`✅ Success! Fetched data for all pillar pages`);
    console.log(`📊 Main News: ${mainArticles.length} articles`);
    console.log(`📈 Numbers Don't Lie: ${statsArticles.length} articles`);
    console.log(`👤 Career Arcs: ${careerArticles.length} articles`);
    console.log(`🎯 Projected Matchups: ${matchupsArticles.length} articles`);
    console.log(`📅 Upcoming Events: ${eventsArticles.length} articles`);
    console.log(`🔥 Hot News This Week: ${hotNewsArticles.length} articles`);
    console.log(`📸 Total: ${totalImages}/${totalArticles} articles have images`);
    console.log(`📁 Saved to: ${dataDir}`);
  } catch (error) {
    console.error('❌ Error fetching MMA news:', error.message);
    process.exit(1);
  }
}

fetchMMANews();
