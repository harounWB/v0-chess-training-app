export type SeoLink = {
  href: string;
  label: string;
  title: string;
  description: string;
};

export type OpeningPage = {
  slug: string;
  title: string;
  description: string;
  plan: string[];
};

export type LearningTopic = {
  title: string;
  description: string;
};

export const corePages: SeoLink[] = [
  {
    href: '/home',
    label: 'Home',
    title: 'Chess Opening Trainer - Learn & Practice Openings Fast',
    description: 'Free chess opening trainer and PGN analyzer built for fast, structured opening improvement.',
  },
  {
    href: '/upload',
    label: 'Analyze',
    title: 'Analyze Chess Games Online - Free PGN Analyzer',
    description: 'Upload PGN files, review games, and train against the openings you actually play.',
  },
  {
    href: '/training',
    label: 'Training',
    title: 'Chess Opening Trainer - Practice Openings Interactively',
    description: 'Train chess openings online with an interactive board and fast feedback loop.',
  },
  {
    href: '/about-us',
    label: 'About',
    title: 'About OpeningMaster',
    description: 'Learn how OpeningMaster helps players study openings, analyze games, and train faster.',
  },
];

export const featurePages = [
  {
    title: 'Interactive Chess Training Tool - Learn Faster',
    description: 'Practice move-by-move against your own repertoire and turn mistakes into repeatable training.',
  },
  {
    title: 'AI Chess Analysis - Improve Your Moves Instantly',
    description: 'Use engine-backed feedback and PGN review to find mistakes before they become habits.',
  },
  {
    title: 'Personalized Chess Training Based on Your Mistakes',
    description: 'Focus on the lines you miss most often and build a sharper opening memory over time.',
  },
];

export const learningTopics: LearningTopic[] = [
  {
    title: 'How to Learn Chess Openings Fast',
    description: 'A step-by-step method for building a study routine that sticks.',
  },
  {
    title: 'Best Way to Study Chess Openings in 2026',
    description: 'Practical advice for combining model games, repetition, and analysis.',
  },
  {
    title: 'How to Analyze Your Chess Games',
    description: 'A beginner-friendly workflow for spotting patterns and fixing recurring mistakes.',
  },
  {
    title: 'Common Chess Mistakes and How to Fix Them',
    description: 'Turn blunders, missed tactics, and opening confusion into clear improvement goals.',
  },
  {
    title: 'How to Improve Chess Rating Quickly',
    description: 'Simple habits that help you spend time on the positions that matter most.',
  },
];

export const openingPages: OpeningPage[] = [
  {
    slug: 'sicilian-defense',
    title: 'Sicilian Defense Opening - Learn Variations & Ideas',
    description: 'Study core Sicilian structures, common branches, and the strategic plans behind the opening.',
    plan: [
      'Learn the Open Sicilian and the main anti-Sicilian branches.',
      'Practice core move orders until the first 10 moves feel automatic.',
      'Review typical pawn breaks, tactical motifs, and piece activity.',
    ],
  },
  {
    slug: 'sicilian-dragon',
    title: 'Sicilian Defense Dragon Variation - Complete Guide',
    description: 'A practical guide to the Dragon structure, typical attacks, and defensive ideas for both sides.',
    plan: [
      'Understand the fianchetto structure and the race for opposite-side attacks.',
      'Memorize the most common Yugoslav Attack plans.',
      'Use engine review to identify tactical shots in forcing lines.',
    ],
  },
  {
    slug: 'french-defense',
    title: 'French Defense Opening - Strategy, Plans & Traps',
    description: 'Explore the French Defense with model plans, tactical traps, and clear structure-based study.',
    plan: [
      'Study the Advance, Tarrasch, and Winawer structures.',
      'Track the dark-square weaknesses and central break patterns.',
      'Build a repertoire around reliable piece placement and pawn tension.',
    ],
  },
  {
    slug: 'caro-kann-defense',
    title: 'Caro-Kann Defense - Easy Guide for Beginners',
    description: 'A beginner-friendly Caro-Kann page focused on safe development, structure, and practical plans.',
    plan: [
      'Learn the Exchange, Advance, and Classical setups.',
      'Practice solid piece development and central counterplay.',
      'Use short model lines to remember the most important ideas.',
    ],
  },
  {
    slug: 'kings-indian-defense',
    title: "King's Indian Defense - Full Opening Breakdown",
    description: 'Break down the King\'s Indian with strategic themes, attack patterns, and common setup ideas.',
    plan: [
      'Study the fianchetto kingside setup and central counterstrike ideas.',
      'Review typical attacks on both wings and the resulting pawn storms.',
      'Use recurring middlegame structures to make the opening easier to recall.',
    ],
  },
  {
    slug: 'queens-gambit',
    title: "Queen's Gambit Opening - Theory & Main Ideas",
    description: 'A practical Queen\'s Gambit overview with the main move orders and strategic concepts.',
    plan: [
      'Cover the Accepted, Declined, and Exchange families.',
      'Learn the central tension themes and the most common piece placements.',
      'Connect the opening to the typical endgames it produces.',
    ],
  },
];

export const footerKeywords = [
  'best chess opening trainer online free',
  'how to practice chess openings effectively',
  'free tool to analyze chess games online',
  'learn sicilian defense step by step',
  'chess training website for beginners',
];

export const openingPageMap = new Map(openingPages.map((opening) => [opening.slug, opening]));
