import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const newsFile = path.join(__dirname, '../src/data/mma-news.json');
const analysisFile = path.join(__dirname, '../src/data/mma-analysis.json');

// Grappling-focused keywords and terminology
const grappleFocusKeywords = [
  'wrestling', 'takedown', 'grappling', 'submission', 'guard', 'mount',
  'clinch', 'judo', 'bjj', 'jiu-jitsu', 'ground', 'control', 'escape',
  'sweep', 'armbar', 'choke', 'rear naked choke', 'kimura', 'triangle',
  'collar tie', 'clinch work', 'cage control', 'positioning'
];

// Grappling-focused takes on common MMA news topics
const grappleFocusTakes = {
  'title fight': 'Title implications depend heavily on grappling matchup dynamics. Top-level wrestling and positional control often determine championship outcomes.',
  'championship': 'Championship-level grappling is non-negotiable. Control time and submission threat determine title runs.',
  'knockout': 'While striking gets highlights, it\'s grappling composure and ground control that define champions.',
  'striking': 'Striking exchanges mean nothing without solid grappling defense. Ground game is the foundation.',
  'debut': 'We\'ll learn a lot about this fighter\'s grappling fundamentals - the true test of MMA skill.',
  'record': 'Record means little without understanding grappling methodology. How did they finish? By controlling the ground.',
  'training': 'Training camp focus: Wrestling and positional grappling will determine success in this matchup.',
  'comeback': 'Comebacks are built on grappling maturity and tactical patience. Striking flashiness fades; ring control persists.',
  'injury': 'Grappling-heavy fighters often return stronger from injury due to deep positional knowledge.',
  'upset': 'Upsets often come from superior grappling execution and cage control, not luck.',
};

// Determine if an article is grappling-focused
function analyzeGrapplingFocus(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  let score = 0;
  let matchedKeywords = [];
  
  for (const keyword of grappleFocusKeywords) {
    if (text.includes(keyword)) {
      score += 5;
      matchedKeywords.push(keyword);
    }
  }
  
  return {
    score: Math.min(score, 100),
    matchedKeywords: [...new Set(matchedKeywords)],
    isGrapplingFocused: score >= 10
  };
}

// Generate grappling-focused take
function generateGrapplingTake(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  // Find matching take templates
  for (const [topic, take] of Object.entries(grappleFocusTakes)) {
    if (text.includes(topic)) {
      return take;
    }
  }
  
  // Default grappling take
  return 'Grappling mastery is the foundation of MMA success. This story\'s true significance will be determined by positional excellence and ground control dynamics.';
}

// Process articles
async function analyzeNews() {
  try {
    console.log('Processing news articles...');
    
    // Read news file
    const newsData = JSON.parse(fs.readFileSync(newsFile, 'utf-8'));
    const articles = Array.isArray(newsData) ? newsData : newsData.articles || [];
    
    // Analyze each article
    const analyses = articles.map(article => {
      const { score, matchedKeywords, isGrapplingFocused } = analyzeGrapplingFocus(
        article.title || '',
        article.description || ''
      );
      
      const ourTake = generateGrapplingTake(
        article.title || '',
        article.description || ''
      );
      
      return {
        originalArticle: {
          title: article.title,
          description: article.description,
          source: article.source,
          url: article.url,
          image: article.image,
          publishedAt: article.publishedAt
        },
        ourTake,
        grappleFocus: {
          score,
          keywords: matchedKeywords,
          isFocused: isGrapplingFocused
        },
        publishedAt: article.publishedAt
      };
    });
    
    // Filter out politics/non-MMA
    const filtered = analyses.filter(a => {
      const text = `${a.originalArticle.title} ${a.originalArticle.description}`.toLowerCase();
      const politicsKeywords = ['politics', 'politics', 'election', 'government', 'congress', 'senate', 'house of representatives'];
      const isPolitics = politicsKeywords.some(kw => text.includes(kw));
      return !isPolitics;
    });
    
    console.log(`✓ Analyzed ${articles.length} articles (filtered ${analyses.length - filtered.length})`);
    console.log(`✓ Saved to mma-analysis.json`);
    
    // Save analysis
    fs.writeFileSync(analysisFile, JSON.stringify(filtered, null, 2));
    
  } catch (error) {
    console.error('Error analyzing news:', error);
    process.exit(1);
  }
}

analyzeNews();
