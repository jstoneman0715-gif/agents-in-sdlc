import fs from 'fs';
import path from 'path';

const POLITICS_KEYWORDS = [
  'politics', 'political', 'government', 'congress', 'senate', 'representative',
  'election', 'vote', 'campaign', 'democrat', 'republican', 'trump', 'biden',
  'partisan', 'controversy', 'scandal', 'racist', 'racism', 'discrimination'
];

const GRAPPLING_KEYWORDS = [
  'takedown', 'submission', 'wrestling', 'jiu-jitsu', 'grappling', 'ground control',
  'neck', 'choke', 'arm drag', 'clinch', 'sprawl', 'scramble', 'mount', 'guard',
  'top control', 'ground game', 'wrestling pedigree', 'wrestling heavy'
];

function isPolitical(text) {
  const lowerText = text.toLowerCase();
  return POLITICS_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function hasGrapplingContent(text) {
  const lowerText = text.toLowerCase();
  return GRAPPLING_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function generateGrapplingAnalysis(article) {
  const title = article.title.toLowerCase();
  const description = (article.description || '').toLowerCase();
  const content = `${title} ${description}`;

  // Grappling-focused analytical takes
  const analyses = [
    {
      condition: () => content.includes('takedown') || content.includes('wrestling'),
      take: "This fight showcases critical grappling exchanges. The wrestler with superior takedown accuracy and top control positioning will dictate the pace and preserve energy for later rounds. Key metric: TD accuracy % and average control time."
    },
    {
      condition: () => content.includes('submission') || content.includes('jiu-jitsu'),
      take: "Submission grappling is the deciding factor here. The fighter with deeper jiu-jitsu transitions and opportunistic catching will convert scrambles into positional dominance. Watch for collar drags, leg lock setups, and guard retention patterns."
    },
    {
      condition: () => content.includes('knockout') || content.includes('striking'),
      take: "While striking dominates headlines, the grappling fundamentals win fights. Clinch control, inside positioning, and ready-made takedown entries from striking exchanges will separate elite wrestlers from strikers. Clinch control time is underrated."
    },
    {
      condition: () => content.includes('defense'),
      take: "Defensive wrestling prowess is the game-changer. Anti-wrestling tactics, scramble recovery, and cage-cutting positioning determine survival. The fighter with superior defensive wrestling anchoring maintains control and can set their own pace offensively."
    },
    {
      condition: () => content.includes('momentum') || content.includes('pressure'),
      take: "Grappling-heavy pressure wins rounds on scorecards. Sustained top control, forward clinch dominance, and takedown volume register with judges. Analytical breakdown: effective control time across all positions + TD frequency."
    },
    {
      condition: () => true,
      take: "From a grappling analytics perspective, this matchup hinges on wrestling positions and clinch warfare. The fighter establishing top control early and maintaining positional dominance through ground exchanges will control the fight's narrative and pace."
    }
  ];

  const applicableAnalysis = analyses.find(a => a.condition());
  return applicableAnalysis ? applicableAnalysis.take : analyses[analyses.length - 1].take;
}

function processArticles(articles) {
  return articles
    .filter(article => {
      // Filter out political content
      if (isPolitical(article.title) || isPolitical(article.description || '')) {
        console.log(`  Filtered (political): ${article.title.substring(0, 60)}...`);
        return false;
      }
      return true;
    })
    .map((article, index) => {
      const hasGrappling = hasGrapplingContent(article.title) || hasGrapplingContent(article.description || '');
      const analysis = generateGrapplingAnalysis(article);
      
      return {
        id: `analysis-${Date.now()}-${index}`,
        originalArticle: article,
        ourTake: analysis,
        grappleFocus: hasGrappling,
        publishedAt: article.publishedAt,
        source: article.source,
        image: article.image
      };
    });
}

async function analyzeAndSaveNews() {
  try {
    const dataPath = path.resolve('./src/data/mma-news.json');
    
    if (!fs.existsSync(dataPath)) {
      console.log('No articles file found yet');
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const newsData = JSON.parse(rawData);
    const articles = newsData.articles || [];

    console.log(`Processing ${articles.length} articles...`);
    const analyzed = processArticles(articles);

    // Save analyzed content
    const analysisPath = path.resolve('./src/data/mma-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify({ 
      analyses: analyzed, 
      lastUpdated: new Date().toISOString(),
      totalFiltered: articles.length - analyzed.length,
      totalAnalyzed: analyzed.length
    }, null, 2));

    console.log(`✓ Analyzed ${analyzed.length} articles (filtered ${articles.length - analyzed.length})`);
    console.log(`✓ Saved to mma-analysis.json`);

  } catch (error) {
    console.error('Error analyzing news:', error.message);
  }
}

analyzeAndSaveNews();
