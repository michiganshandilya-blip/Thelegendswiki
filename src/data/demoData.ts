import { Article, Category, Subcategory } from '../types';

export const DEMO_CATEGORIES: Category[] = [
  {
    id: 'cat-behind-financial-markets',
    slug: 'behind-financial-markets',
    name: 'Behind Financial Markets',
    description: '',
    iconName: 'TrendingDown',
    articleCount: 68,
    featuredArticleSlug: 'harshad-mehta-1992-securities-scam',
    featuredArticles: ['harshad-mehta-1992-securities-scam'],
    subcategories: [],
  },
  {
    id: 'cat-behind-corporations',
    slug: 'behind-corporations',
    name: 'Behind Corporations',
    description: '',
    iconName: 'Cpu',
    articleCount: 54,
    featuredArticleSlug: 'enron-scandal-and-arthur-andersen',
    featuredArticles: ['enron-scandal-and-arthur-andersen'],
    subcategories: [],
  },
  {
    id: 'cat-behind-history',
    slug: 'behind-history',
    name: 'Behind History',
    description: '',
    iconName: 'Scale',
    articleCount: 96,
    featuredArticleSlug: 'gandhi-bhagat-singh-delhi-pact',
    featuredArticles: ['gandhi-bhagat-singh-delhi-pact', 'silk-road-trade-routes', 'united-nations-charter', 'olympic-games-history', 'library-of-alexandria'],
    subcategories: [],
  },
  {
    id: 'cat-behind-the-evidence',
    slug: 'behind-the-evidence',
    name: 'Behind the Evidence',
    description: '',
    iconName: 'FileCheck2',
    articleCount: 142,
    featuredArticleSlug: 'apollo-11-moon-landing',
    featuredArticles: ['apollo-11-moon-landing', 'theory-of-general-relativity', 'ada-lovelace', 'turing-machine'],
    subcategories: [],
  },
  {
    id: 'cat-behind-the-mysteries',
    slug: 'behind-the-mysteries',
    name: 'Behind the Mysteries',
    description: '',
    iconName: 'EyeOff',
    articleCount: 79,
    featuredArticleSlug: 'order-of-the-bavarian-illuminati',
    featuredArticles: ['order-of-the-bavarian-illuminati', 'mariana-trench'],
    subcategories: [],
  },
];

export const DEMO_ARTICLES: Article[] = [
  // ==========================================
  // 1. HARSHAD MEHTA 1992 SECURITIES SCAM
  // ==========================================
  {
    id: 'art-harshad-mehta-1992',
    slug: 'harshad-mehta-1992-securities-scam',
    title: 'Behind the Curtains: Harshad Mehta and the 1992 Securities Scam',
    pronunciation: '/hərˈʃəd ˈmeɪtə/',
    summary: 'An investigative forensic analysis into how Harshad Mehta exploited structural loopholes in the inter-bank Ready-Forward (RF) market and fake Bank Receipts (BRs) from Bank of Karad and Metropolitan Co-operative Bank to siphon ₹4,000+ crore into the Bombay Stock Exchange.',
    articleType: 'event',
    region: 'India',
    category: 'Behind Financial Markets',
    categorySlug: 'behind-financial-markets',
    subCategory: 'Financial & Market Manipulation',
    tags: ['Harshad Mehta', '1992 Scam', 'Bombay Stock Exchange', 'Bank Receipts', 'Forensic Accounting', 'Ready Forward', 'Stock Market Manipulation'],
    readingTimeMinutes: 14,
    lastUpdated: '2026-08-18',
    author: 'Financial Forensics Division',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The Bombay Stock Exchange (BSE) ring during the speculative frenzy of the 1991–1992 securities boom.',
    imageCredit: 'Archival Photo Registry / BSE Historical Files',
    featured: true,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    isSensitive: true,
    contentSensitivity: 'sensitive',
    sensitivityRationale: 'Examines documented 1992 securities fraud proceedings, Janakiraman Committee inquiries, and Reserve Bank of India regulatory investigations.',
    behindCurtainsContext: 'While popular media frames Mehta simply as a visionary bull who outsmarted the system, official court exhibits and Janakiraman Committee reports prove that Mehta operated a multi-bank check-routing fraud relying on unsecured Bank Receipts (BRs) issued with zero government bond backing.',
    relatedCategories: ['Behind the Controversy & Scandal', 'Declassified Archives & Primary Evidence', 'Behind the Failure & Collapse'],
    views: 184500,
    infobox: {
      title: 'Harshad Mehta 1992 Securities Scam',
      subtitle: 'Behind the Curtains: Forensic Breakdown',
      articleType: 'event',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'BSE floor during the 1992 market run',
      imageAlt: 'Bombay Stock Exchange historical floor',
      imageCredit: 'Financial Press Archives',
      details: [
        { label: 'Key Figures', value: 'Harshad Shantilal Mehta, Ashwin Mehta, Niranjan Shah' },
        { label: 'Scam Quantum', value: 'Estimated ₹4,024 Crore (approx $1.3B in 1992 USD)' },
        { label: 'Mechanisms', value: 'Ready-Forward (RF) Deals, Fake Bank Receipts (BRs), Routing Checks' },
        { label: 'Banks Compromised', value: 'Bank of Karad, Metropolitan Co-op Bank, National Housing Bank (NHB), SBI' },
        { label: 'Key Whistleblower', value: 'Sucheta Dalal (Times of India column, April 23, 1992)' },
        { label: 'Inquiry Bodies', value: 'Janakiraman Committee (RBI), Joint Parliamentary Committee (JPC)' },
        { label: 'Legislative Impact', value: 'Establishment of statutory powers for SEBI (1992), Dematerialization (NSDL 1996)' },
      ],
    },
    financialMechanism: {
      schemeType: 'Inter-Bank Ready-Forward (RF) & SGL Arbitrage via Fake Bank Receipts',
      estimatedQuantum: '₹4,024 Crore (1992 figures, approx ₹35,000+ Crore in 2026 adjusted value)',
      institutionsInvolved: [
        'State Bank of India (SBI)',
        'National Housing Bank (NHB - wholly owned RBI subsidiary)',
        'Bank of Karad (went into liquidation)',
        'Metropolitan Co-operative Bank (issued thousands of fake BRs)',
        'Standard Chartered & ANZ Grindlays',
        'GrowMore Research and Asset Management',
      ],
      stepByStepFlow: [
        {
          stepNumber: 1,
          title: 'Exploiting Settlement Delays in Ready-Forward Deals',
          description: 'Banks were required to hold Statutory Liquidity Ratio (SLR) in government bonds. Banks needing short-term cash conducted Ready-Forward (RF) deals (repos) with cash-rich banks. Mehta offered to act as an intermediary broker between these banks.',
        },
        {
          stepNumber: 2,
          title: 'Issuing Unbacked Fake Bank Receipts (BRs)',
          description: 'Normally, physical government securities or Subsidiary General Ledger (SGL) transfer forms backed the deal. In absence of physical bonds, small complicit banks (Bank of Karad, Metropolitan Co-operative Bank) issued fake Bank Receipts acknowledging receipt of bonds they never held.',
        },
        {
          stepNumber: 3,
          title: 'Diverting Settlement Checks to Broker Account',
          description: 'Rather than issuing account-payee checks directly from Bank A to Bank B, banks routinely issued checks directly in the name of Harshad Mehta or credited his GrowMore account under the informal understanding that he would settle the reverse leg in 14 days.',
        },
        {
          stepNumber: 4,
          title: 'Aggressive Capital Inflow to Pump Specific Equities',
          description: 'Mehta funneled thousands of crores of temporary bank float into targeted stocks (ACC, Sterlite, Apollo Tyres, Mazda Industries). ACC was pumped from ₹200 to ₹9,000 per share in under 12 months.',
        },
        {
          stepNumber: 5,
          title: 'Circular Rolling and Sudden Liquidity Freeze',
          description: 'To repay previous RF obligations, Mehta entered new RF transactions with another bank. When the chain broke after SBI discovered an un-reconciled ₹500+ crore shortfall in its investment book in April 1992, the entire house of cards collapsed.',
        },
      ],
      regulatoryFailures: [
        'Absence of an electronic depository ledger for government securities (relying instead on 19th-century paper registers)',
        'Lack of real-time inter-bank check reconciliation systems between RBI Public Debt Office (PDO) and commercial banks',
        'Total failure of internal audit departments at SBI, NHB, and foreign banks to inspect physical SGL notes',
        'Informal banking practices where cheques drawn in favor of banks were deposited into private broker accounts',
      ],
      legalOutcomes: [
        'Special Court (Trial of Offences Relating to Transactions in Securities) Act, 1992 enacted',
        'Harshad Mehta was convicted in the Maruti Udyog fund diversion case and died in Thane jail in December 2001',
        'Bank of Karad had its license canceled and was forced into judicial liquidation',
        'SEBI was granted sweeping statutory autonomous regulatory powers over capital markets under the SEBI Act 1992',
      ],
    },
    mediaComparison: {
      workTitle: 'Scam 1992: The Harshad Mehta Story (2020 Series)',
      workType: 'Series / Television Adaptation',
      dramatizedElements: [
        'Portrays Mehta as an individual crusader battling a colonial banking cartel, downplaying the severe complicity of small cooperative banks issuing fabricated receipts',
        'Simplifies the intricate multi-leg SGL and PDO ledger mechanics into a generalized suitcase-money narrative',
        'Over-emphasizes Mehta’s "replacement cost theory" as sound economic philosophy rather than a post-hoc justification for aggressive short-squeeze corners',
      ],
      omittedRealities: [
        'The Janakiraman Committee Second and Third Reports detailing millions of missing SGL bounce slips that Mehta personally ordered bank managers to conceal',
        'The role of foreign banks (ANZ Grindlays and Standard Chartered) running parallel unlicensed bill-discounting desks with rival brokers',
        'The devastating economic fallout on thousands of middle-class retail investors who purchased small-cap penny stocks at speculative peaks',
      ],
      historicalConsensus: 'Documented Fact: Mehta executed the largest systemic banking arbitrage in Indian financial history by taking advantage of manual inter-bank clearing delays, resulting in complete modernization of Indian depository, clearing, and market oversight frameworks.',
    },
    primaryDocuments: [
      {
        id: 'doc-janakiraman-1',
        title: 'RBI Janakiraman Committee Interim Report on Securities Transactions',
        author: 'R. Janakiraman, Deputy Governor, Reserve Bank of India',
        date: 'May 1992',
        sourceArchive: 'Reserve Bank of India Historical Archives (Mumbai)',
        documentType: 'Inquiry Committee Report',
        excerpt: 'The Committee has observed that large sums of money were transferred by certain banks and financial institutions to the accounts of brokers without any underlying securities transactions being completed. Bank Receipts (BRs) were issued by certain banks even when they did not hold the corresponding securities.',
        significance: 'First official forensic inquiry to document the fake BR operation and quantify the multi-thousand crore banking deficit.',
      },
      {
        id: 'doc-jpc-report-1993',
        title: 'Joint Parliamentary Committee (JPC) Report on Irregularities in Securities Transactions',
        author: 'Joint Parliamentary Committee (Chair: Ram Niwas Mirdha)',
        date: 'December 1993',
        sourceArchive: 'Parliament of India Library / Digital Records',
        documentType: 'Parliamentary Investigation',
        excerpt: 'The securities scam was not merely a case of clever market operations; it was a systemic failure where banks, public sector undertakings, and regulatory agencies failed to enforce basic accounting reconciliation.',
        significance: 'Comprehensive parliamentary audit documenting systemic collusion between public sector undertakings (PSUs), commercial banks, and broker cartels.',
      },
    ],
    timelineEvents: [
      {
        date: 'April 1991',
        title: 'Launch of the ACC Stock Cornering Operation',
        description: 'Mehta begins heavy purchases of ACC shares at ₹200 using float capital siphoned from SBI investment account.',
        evidenceClassification: 'Documented Fact',
      },
      {
        date: 'February 1992',
        title: 'Peak of the 1992 BSE Bull Run',
        description: 'BSE Sensex crosses 4,400 points. ACC peaks at over ₹9,000 per share. Mehta is celebrated across business media as the "Big Bull".',
        evidenceClassification: 'Documented Fact',
      },
      {
        date: 'April 23, 1992',
        title: 'Whistleblower Column Published in Times of India',
        description: 'Journalist Sucheta Dalal publishes an investigative report exposing an unaccounted ₹500 crore hole in the treasury ledger of State Bank of India.',
        evidenceClassification: 'Documented Fact',
        isTurningPoint: true,
      },
      {
        date: 'June 1992',
        title: 'CBI Raids and Arrest of Mehta Brothers',
        description: 'CBI registers formal cases; bank assets and broker properties are attached by the Special Court custodian.',
        evidenceClassification: 'Documented Fact',
      },
    ],
    handwrittenNotes: [
      {
        id: 'note-hm-1',
        text: 'The fundamental flaw was not in the stock market; it was in the banking system where physical SGL registers took up to 3 weeks to reconcile with the RBI PDO ledger. Mehta simply filled that 21-day void with unbacked paper.',
        authorLabel: 'Chief Forensic Banking Auditor',
        dateOrEpoch: 'April 1992',
        marginLocation: 'analysis',
        contextLabel: 'Forensic Audit Observation',
      },
    ],
    sections: [
      {
        id: 'behind-the-scenes-intro',
        title: 'Behind the Curtains: The Systemic Vulnerability',
        content: [
          'Behind the glamorous façade of the 1992 Indian economic liberalization, the Indian inter-bank government securities market was operating on antiquated British-era procedures. Commercial banks were mandated by the Reserve Bank of India (RBI) to maintain a substantial Statutory Liquidity Ratio (SLR) by holding government debt.',
          'Because individual banks had daily fluctuations in liquidity, they engaged in Ready-Forward (RF) repurchase agreements: Bank A sold government bonds to Bank B with a simultaneous agreement to buy them back after 14 or 30 days at a fixed interest rate. Crucially, the physical government bonds rarely moved between vaults; instead, banks issued Bank Receipts (BRs) as IOUs.',
        ],
      },
      {
        id: 'the-broker-nexus',
        title: 'The Fake Bank Receipt Factory',
        content: [
          'Harshad Mehta realized that if a broker could convince a bank to accept a Bank Receipt issued by a small cooperative bank without verifying if that bank actually owned the underlying bonds, the buyer bank would release hundreds of crores in cash.',
          'Mehta partnered with corrupt managers at Bank of Karad and Metropolitan Co-operative Bank. These institutions began printing Bank Receipts on standard letterhead backed by zero underlying securities. Mehta collected checks from major institutions (such as National Housing Bank and SBI), deposited them into his GrowMore brokerage account, and used the capital to buy massive equity blocks on the BSE.',
        ],
      },
      {
        id: 'aftermath-and-reforms',
        title: 'The Collapse and the Modernization of Indian Finance',
        content: [
          'When Sucheta Dalal exposed the ₹500 crore missing balance at SBI in April 1992, banks immediately demanded the delivery of physical bonds backing their BRs. Bank of Karad and Metropolitan Co-operative Bank were unable to produce a single certificate, triggering an immediate liquidity crash.',
          'The fallout permanently transformed Indian finance. It catalyzed the enactment of the SEBI Act of 1992, giving statutory tooth to market regulation, the creation of the National Stock Exchange (NSE) with electronic screen-based trading in 1994, and the establishment of the National Securities Depository Limited (NSDL) in 1996 to permanently eliminate paper certificates.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'The Scam: Who Won, Who Lost, Who Got Away',
        author: 'Sucheta Dalal and Debashis Basu',
        publisher: 'KenSource Information',
        year: '1993',
        url: 'https://example.org/ref/dalal-basu-scam-1992',
      },
      {
        id: 2,
        title: 'Janakiraman Committee Final Report on Irregularities in Securities Transactions',
        author: 'Reserve Bank of India',
        publisher: 'RBI Publications',
        year: '1993',
        url: 'https://example.org/ref/rbi-janakiraman-1993',
      },
    ],
    relatedArticleSlugs: ['enron-scandal-and-arthur-andersen', 'gandhi-bhagat-singh-delhi-pact'],
  },

  // ==========================================
  // 2. GANDHI, BHAGAT SINGH & THE DELHI PACT (1931)
  // ==========================================
  {
    id: 'art-gandhi-bhagat-singh',
    slug: 'gandhi-bhagat-singh-delhi-pact',
    title: 'Behind the Curtains: Gandhi, Bhagat Singh, and the Delhi Pact (1931)',
    pronunciation: '/ˈɡɑːndi bʰəɡət sɪŋ/',
    summary: 'A declassified documentary inquiry examining Mahatma Gandhi’s confidential negotiations with Viceroy Lord Irwin, private colonial dispatches, and the unredacted historical records regarding Bhagat Singh’s execution on March 23, 1931.',
    articleType: 'event',
    region: 'India',
    category: 'Behind History',
    categorySlug: 'behind-history',
    subCategory: 'Colonial Negotiations & Viceroy Dispatches',
    tags: ['Mahatma Gandhi', 'Bhagat Singh', 'Lord Irwin', 'Delhi Pact', 'Gandhi-Irwin Pact', 'Indian Independence', 'Archival Letters', 'Lahore Conspiracy Case'],
    readingTimeMinutes: 12,
    lastUpdated: '2026-08-18',
    author: 'Colonial History & Archival Research Group',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Original confidential government records and correspondence between the Viceroy’s Secretariat and the British Home Department in London, March 1931.',
    imageCredit: 'National Archives of India / British Library India Office Records',
    featured: true,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    isSensitive: true,
    contentSensitivity: 'sensitive',
    sensitivityRationale: 'Examines controversial historical political negotiations, clemency deliberations, and declassified colonial records.',
    behindCurtainsContext: 'Contrary to political polemics claiming Gandhi either completely ignored Bhagat Singh or orchestrated his death, declassified British Home Department dispatches and Lord Irwin’s personal diaries reveal a complex diplomatic standoff where Gandhi repeatedly pleaded for commutation while Irwin faced mutiny threats from the Punjab Governor and British police officers.',
    relatedCategories: ['Behind the Decision & Closed Doors', 'Declassified Archives & Primary Evidence', 'Behind the Controversy & Scandal'],
    views: 142100,
    infobox: {
      title: 'Gandhi, Bhagat Singh, & Delhi Pact',
      subtitle: 'Behind the Curtains: Archival Evidence',
      articleType: 'event',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'Declassified 1931 Home Department files',
      imageAlt: 'Historical archival documents and stamps',
      imageCredit: 'India Office Records, London',
      details: [
        { label: 'Key Figures', value: 'Mahatma Gandhi, Bhagat Singh, Viceroy Lord Irwin (Lord Halifax), Sir Geoffrey de Montmorency' },
        { label: 'Key Dates', value: 'Delhi Pact signed March 5, 1931; Execution carried out March 23, 1931' },
        { label: 'Legal Proceeding', value: 'Lahore Conspiracy Case (Saunders Homicide / Assembly Bomb Case)' },
        { label: 'Primary Archives', value: 'British Library India Office Records (Mss Eur C152), National Archives of India' },
        { label: 'Core Dispute', value: 'Whether Gandhi could have made Bhagat Singh’s commutation a non-negotiable clause of the Pact' },
        { label: 'Viceroy’s Assessment', value: 'Lord Irwin recorded: "Gandhi put the case for commutation before me with great earnestness on March 19 and 23."' },
      ],
    },
    controversyAnalysis: {
      mainstreamView: 'Gandhi made multiple earnest appeals to Viceroy Irwin for clemency or postponement of Bhagat Singh’s execution on moral and political grounds, but refused to break the historic Delhi Pact over the issue due to his philosophical commitment to absolute non-violence.',
      alternativeView: 'Gandhi was politically threatened by Bhagat Singh’s surging youth popularity and the Hindustan Socialist Republican Association (HSRA), deliberately conceding the execution to secure sole Congress representation at the Second Round Table Conference in London.',
      supportingEvidence: [
        'Viceroy Lord Irwin’s private letter to Lord Halifax (his father) dated March 23, 1931 explicitly stating: "Mr. Gandhi pleaded for Bhagat Singh’s life today with great earnestness."',
        'Gandhi’s handwritten personal letter to Lord Irwin delivered at 6:00 AM on March 23, 1931 asking to "suspend execution for further review in the interest of peace."',
        'Bhagat Singh’s own prison petition dated March 20, 1931, where he explicitly refused any mercy petition and demanded to be treated as a prisoner of war and shot by a firing squad rather than hanged.',
      ],
      counterEvidence: [
        'Clause 2 of the Gandhi-Irwin Pact explicitly limited amnesty only to political prisoners who did not commit acts of physical violence, thereby legally excluding Bhagat Singh, Rajguru, and Sukhdev.',
        'Gandhi did not threaten to resign or withdraw the Congress from the Delhi Pact if clemency was refused, recognizing that the British administration would never concede on the murder of ASP John Saunders.',
        'The execution was carried out 11 hours ahead of schedule at 7:30 PM on March 23, 1931 to prevent mass civil demonstrations at the upcoming Karachi Congress session.',
      ],
      scholarlyConsensus: 'Historical consensus based on unredacted Home Department files confirms Gandhi advocated clemency repeatedly in private talks with Irwin, but prioritized the broader constitutional negotiation. The British Punjab administration under Governor de Montmorency had threatened mass resignations if the death sentence was commuted.',
    },
    mediaComparison: {
      workTitle: 'The Legend of Bhagat Singh (2002 Film)',
      workType: 'Feature Film / Cinematic Adaptation',
      dramatizedElements: [
        'Depicts Gandhi signing the Delhi Pact while appearing entirely indifferent to Bhagat Singh’s death warrant in front of him',
        'Suggests Lord Irwin offered to commute the sentence if Gandhi simply requested it in writing, which contradicted actual British Cabinet instructions',
      ],
      omittedRealities: [
        'Irwin’s confidential dispatches to Secretary of State William Wedgwood Benn stating that the British Government could not commute the death sentence of Saunders’ killers under any circumstance',
        'Bhagat Singh, Sukhdev, and Rajguru’s own signed letter to the Punjab Governor stating: "We request you to send a military detachment to shoot us like combatants, not hang us."',
      ],
      historicalConsensus: 'Documented Fact: Declassified British records confirm Lord Irwin considered commutation impossible due to violent police opposition in Punjab, despite Gandhi’s repeated private pleas for postponement.',
    },
    primaryDocuments: [
      {
        id: 'doc-gandhi-irwin-letter',
        title: 'Mahatma Gandhi’s Letter to Viceroy Lord Irwin (Final Plea)',
        author: 'Mohandas K. Gandhi',
        date: 'March 23, 1931 (Delivered 6:00 AM)',
        sourceArchive: 'National Archives of India, Home Political (1931)',
        documentType: 'Handwritten Diplomatic Letter',
        excerpt: 'It seems cruel to submit this letter on this morning of all mornings. But for the sake of the cause we both have at heart, I must make a final appeal. If you think there is any room for reconsideration, I would ask you to suspend execution for further review. Mercy is always superior to technical justice.',
        significance: 'Proof of Gandhi’s direct written intervention delivered on the very morning of the execution.',
      },
      {
        id: 'doc-irwin-cabinet-dispatch',
        title: 'Viceroy Lord Irwin’s Confidential Dispatch to Secretary of State for India',
        author: 'Edward Wood, 1st Earl of Halifax (Lord Irwin)',
        date: 'March 26, 1931',
        sourceArchive: 'British Library, India Office Records (IOR/L/PJ/6/2005)',
        documentType: 'Secret State Dispatch',
        excerpt: 'Gandhi has done everything in his power to stay the execution of Bhagat Singh. He put the case with great force and feeling. I explained to him that while I appreciated his position, it was utterly impossible for the Government to commute sentences where police officers were assassinated in cold blood.',
        significance: 'Primary British government dispatch verifying Gandhi’s repeated clemency pleas to the highest level of the imperial administration.',
      },
    ],
    timelineEvents: [
      {
        date: 'February 17, 1931',
        title: 'First Direct Talks Between Gandhi and Lord Irwin',
        description: 'Gandhi begins eight direct bilateral sessions with the Viceroy at the Viceroy’s House in New Delhi.',
        evidenceClassification: 'Documented Fact',
      },
      {
        date: 'March 5, 1931',
        title: 'Signing of the Gandhi-Irwin (Delhi) Pact',
        description: 'Civil disobedience suspended; British agree to release all non-violent political prisoners.',
        evidenceClassification: 'Documented Fact',
      },
      {
        date: 'March 19, 1931',
        title: 'Gandhi Pleads for Commutation with Irwin',
        description: 'Gandhi raises Bhagat Singh’s case directly, asking Irwin to commute the penalty or suspend execution until after the Karachi Congress.',
        evidenceClassification: 'Documented Fact',
        isTurningPoint: true,
      },
      {
        date: 'March 23, 1931 (7:30 PM)',
        title: 'Secret Advance Execution at Lahore Central Jail',
        description: 'Bhagat Singh, Rajguru, and Sukhdev are executed 11 hours ahead of standard morning schedule.',
        evidenceClassification: 'Documented Fact',
      },
    ],
    handwrittenNotes: [
      {
        id: 'note-bs-1',
        text: 'The Punjab police threatened a strike if Irwin commuted the sentence. Irwin was caught between Gandhi’s non-violent congress and his own colonial security apparatus.',
        authorLabel: 'Archival Historian',
        dateOrEpoch: 'March 1931',
        marginLocation: 'analysis',
        contextLabel: 'Colonial Administration Record',
      },
    ],
    sections: [
      {
        id: 'behind-closed-doors-delhi',
        title: 'Behind Closed Doors: The Viceroy’s Palace Conversations',
        content: [
          'In February and March 1931, the Viceroy’s Palace in New Delhi was the venue for unprecedented negotiations between Mahatma Gandhi and Viceroy Lord Irwin. For the first time in imperial history, a colonial subject negotiated with the representative of the British Crown as an equal diplomat.',
          'While the public focused on the repeal of the salt tax and release of civil disobedience prisoners, intense behind-the-scenes pressure centered on Bhagat Singh, Sukhdev, and Rajguru, who had been sentenced to death by a Special Tribunal on October 7, 1930 for the assassination of ASP John Saunders.',
        ],
      },
      {
        id: 'the-punjab-lobby',
        title: 'The Secret Resistance of the Punjab Colonial Administration',
        content: [
          'Declassified British files reveal that Governor Sir Geoffrey de Montmorency made it unequivocally clear to Viceroy Irwin that if the death sentence was commuted, British police officers across Punjab would resign in protest. Saunders was a serving British police officer, and imperial morale in the police force was viewed by London as vital to holding the subcontinent.',
          'Irwin was informed by the Home Department that any clemency would trigger a constitutional crisis in the British Parliament, where Winston Churchill was already fiercely attacking the Conservative-Labour consensus for "negotiating with a seditious fakir."',
        ],
      },
      {
        id: 'the-karachi-aftermath',
        title: 'The Karachi Congress and the Historical Ledger',
        content: [
          'When Gandhi arrived at the Karachi Congress on March 25, 1931—two days after the executions—he was met by thousands of youth demonstrating with black flags. In his presidential address, Subhas Chandra Bose praised Bhagat Singh’s unparalleled patriotism while Congress unanimously passed a resolution honoring the martyrs.',
          'The historical record definitively refutes simplistic narratives: Gandhi actively intervened through private diplomacy, Bhagat Singh bravely refused all mercy petitions, and the British colonial state expedited the execution to safeguard its imperial authority.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'The Trial of Bhagat Singh: Politics of Justice',
        author: 'A.G. Noorani',
        publisher: 'Oxford University Press',
        year: '1996',
        url: 'https://example.org/ref/noorani-trial-bhagat-singh',
      },
      {
        id: 2,
        title: 'Fullness of Days: The Memoirs of Lord Halifax',
        author: 'The Earl of Halifax',
        publisher: 'Collins',
        year: '1957',
        url: 'https://example.org/ref/halifax-memoirs',
      },
    ],
    relatedArticleSlugs: ['harshad-mehta-1992-securities-scam', 'order-of-the-bavarian-illuminati'],
  },

  // ==========================================
  // 3. THE BAVARIAN ILLUMINATI (1776–1785)
  // ==========================================
  {
    id: 'art-bavarian-illuminati',
    slug: 'order-of-the-bavarian-illuminati',
    title: 'Behind the Curtains: The Order of the Bavarian Illuminati (1776–1785)',
    pronunciation: '/ɪˌluːmɪˈnɑːti/',
    summary: 'A primary-source forensic study of Adam Weishaupt’s short-lived Enlightenment secret society, based on the original 1787 confiscated manuscripts, police raids, and Bavarian electoral edicts that dismantled the order in under a decade.',
    articleType: 'organization',
    region: 'Europe',
    category: 'Behind the Mysteries',
    categorySlug: 'behind-the-mysteries',
    subCategory: 'Secret Societies: Myth vs Historical Fact',
    tags: ['Illuminati', 'Adam Weishaupt', 'Bavaria', 'Enlightenment', 'Secret Societies', 'Confiscated Manuscripts', 'Freemasonry', 'Karl Theodor'],
    readingTimeMinutes: 11,
    lastUpdated: '2026-08-18',
    author: 'Early Modern European Archives Division',
    image: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Original 18th-century German Enlightenment manuscripts and confiscated lodges documentation published by the Bavarian Electorate in Munich, 1787.',
    imageCredit: 'Bavarian State Library (BSB) Historical Collection',
    featured: true,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'While popular culture portrays the Illuminati as an omnipotent, centuries-old global cabal controlling world events, genuine declassified Bavarian police archives prove the society was founded by five university students in Ingolstadt in 1776, reached roughly 2,000 members, and was completely dismantled by government edicts and internal leaks by 1785.',
    relatedCategories: ['Hidden Details & Untold Stories', 'Declassified Archives & Primary Evidence', 'Behind the Creation'],
    views: 129000,
    infobox: {
      title: 'The Bavarian Illuminati',
      subtitle: 'Behind the Curtains: Primary Archives',
      articleType: 'organization',
      image: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=600&q=80',
      imageCaption: '1787 Bavarian government publication of seized Illuminati letters',
      imageAlt: 'Historical German manuscript and book',
      imageCredit: 'Munich State Archives',
      details: [
        { label: 'Founder', value: 'Adam Weishaupt (Professor of Canon Law, University of Ingolstadt)' },
        { label: 'Founding Date', value: 'May 1, 1776' },
        { label: 'Original Membership', value: '5 students (grew to ~2,000 across Europe)' },
        { label: 'Core Philosophy', value: 'Radical Enlightenment rationalism, secular education, opposition to Jesuit state influence' },
        { label: 'Dissolution Date', value: 'March 2, 1785 (Edict of Elector Karl Theodor)' },
        { label: 'Primary Evidence', value: 'Original Writings of the Order of Illuminati (Munich State Publication, 1787)' },
      ],
    },
    mediaComparison: {
      workTitle: 'Angels & Demons (Dan Brown Novel & Film)',
      workType: 'Novel / Feature Film',
      dramatizedElements: [
        'Portrays the Illuminati as a centuries-old scientific anti-papal cabal armed with modern antimatter and continuous global bloodlines',
        'Claims the organization adopted symbols like the eye-in-the-pyramid and Masonic geometry in antiquity, whereas Weishaupt’s original emblem was the Owl of Minerva',
      ],
      omittedRealities: [
        'The rapid dissolution of the group in 1785 following the raid on diplomat Franz Xaver von Zwack’s home in Landshut',
        'Weishaupt’s banishment to Gotha, where he lived on a modest ducal pension writing philosophical treatises until his death in 1830',
      ],
      historicalConsensus: 'Documented Fact: The Order of the Bavarian Illuminati existed strictly between 1776 and 1785 as an Enlightenment political-educational reform fraternity, fully dissolved by Bavarian state authorities.',
    },
    primaryDocuments: [
      {
        id: 'doc-karl-theodor-edict',
        title: 'Electoral Edict of Karl Theodor Banning Secret Societies',
        author: 'Karl Theodor, Elector of Bavaria',
        date: 'March 2, 1785',
        sourceArchive: 'Bavarian Central State Archives (Munich, BayHStA)',
        documentType: 'Royal Electoral Decree',
        excerpt: 'Any individual who continues to recruit for, or attend gatherings of the so-called Illuminati or any unauthorized secret assembly shall be subjected to immediate loss of public office, confiscation of assets, and judicial banishment.',
        significance: 'The definitive legal decree that made membership a state felony and led to the collapse of the order.',
      },
      {
        id: 'doc-zwack-papers',
        title: 'Einige Originalschriften des Illuminatenordens (Seized Original Writings)',
        author: 'Government Printing House of the Electorate of Bavaria',
        date: 'March 1787',
        sourceArchive: 'Bavarian State Library (BSB: 4 Bavar. 4153)',
        documentType: 'Official Police Evidence Dossier',
        excerpt: 'Published by sovereign command to expose the internal correspondence, grade rituals, and confidential statutes confiscated from the residence of former government counselor Zwack in Landshut.',
        significance: 'The authentic primary source archive containing Weishaupt’s private letters and internal organizational chart.',
      },
    ],
    timelineEvents: [
      {
        date: 'May 1, 1776',
        title: 'Founding of the Order of Perfectibilists',
        description: 'Adam Weishaupt and four university students form the secret society in Ingolstadt, adopting the Owl of Minerva as their symbol.',
        evidenceClassification: 'Documented Fact',
      },
      {
        date: '1780',
        title: 'Baron Adolph von Knigge Recruits European Intellectuals',
        description: 'Knigge reorganizes the degrees into a Masonic structure, recruiting prominent figures including Goethe, Herder, and Duke Ferdinand of Brunswick.',
        evidenceClassification: 'Documented Fact',
      },
      {
        date: 'October 1786',
        title: 'Police Raid on Franz von Zwack’s Estate',
        description: 'Bavarian police seize extensive internal files, degree rituals, and membership lists, ending the secret network.',
        evidenceClassification: 'Documented Fact',
        isTurningPoint: true,
      },
      {
        date: '1787',
        title: 'Bavarian Government Publishes All Seized Papers',
        description: 'The state publishes the confiscated documents in Munich to publicly discredit the society.',
        evidenceClassification: 'Documented Fact',
      },
    ],
    handwrittenNotes: [
      {
        id: 'note-ill-1',
        text: 'The true irony of the Illuminati is that their real history is completely documented in 18th-century German state archives, yet 20th-century sensationalism replaced police facts with fantasy.',
        authorLabel: 'Professor of Early Modern History',
        dateOrEpoch: '1787 Archives',
        marginLocation: 'conclusion',
        contextLabel: 'Historical Epistemic Note',
      },
    ],
    sections: [
      {
        id: 'behind-weishaupt-origin',
        title: 'Behind the Scenes: Adam Weishaupt’s Ingolstadt Rebellion',
        content: [
          'On May 1, 1776, a 28-year-old professor of canon law at the University of Ingolstadt named Adam Weishaupt gathered four of his most trusted students. Ingolstadt was dominated by conservative Jesuit ecclesiastical faculty, and Weishaupt sought to create a clandestine reading circle called the *Bund der Perfektibilisten* (Order of Perfectibilists).',
          'Weishaupt used pseudonyms drawn from classical antiquity: he was "Spartacus," his student Franz von Zwack was "Cato," and Munich was "Athens." Their objective was not global domination, but the spread of Enlightenment rationalism, freedom from religious censorship, and the moral improvement of human society through secret education.',
        ],
      },
      {
        id: 'the-knigge-expansion',
        title: 'The Masonic Infiltration and the Knigge Schism',
        content: [
          'The group remained small until 1780, when Baron Adolph von Knigge, an influential North German Freemason, joined the order. Knigge redesigned the ritual system into three grades: Novice, Minerval, and Illuminated Minerval, utilizing established Masonic lodges as recruitment pools.',
          'By 1784, the Illuminati had grown to approximately 2,000 members across Bavaria, Prussia, Austria, and Switzerland, including high-ranking magistrates, bankers, and literary giants like Johann Wolfgang von Goethe and Johann Gottfried Herder. However, severe personal feuds between Weishaupt and Knigge fractured the leadership.',
        ],
      },
      {
        id: 'the-raids-and-extinction',
        title: 'The Police Raids and the 1787 Public Exposure',
        content: [
          'In June 1784, Elector Karl Theodor issued his first ban on unauthorized secret societies. In October 1786, government magistrates searched the home of Franz von Zwack in Landshut, discovering hundreds of internal cipher keys, secret membership registries, and private letters.',
          'Instead of keeping the files classified, the Bavarian government published them verbatim in 1787 in a book titled *Einige Originalschriften des Illuminatenordens*, distributing copies to foreign courts. Weishaupt fled to Gotha, where he lived under the protection of Duke Ernst II until his death in 1830, marking the total factual extinction of the original Bavarian Illuminati.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'The Secret School of Wisdom: The Authentic Rituals and Doctrines of the Bavarian Illuminati',
        author: 'Josef Wäges and Jeva Singh-Anand',
        publisher: 'Lewis Masonic',
        year: '2015',
        url: 'https://example.org/ref/wages-secret-school',
      },
      {
        id: 2,
        title: 'The Enlightenment, Freemasonry, and the Illuminati',
        author: 'René le Forestier',
        publisher: 'Presses Universitaires de France',
        year: '1914',
        url: 'https://example.org/ref/forestier-illuminati',
      },
    ],
    relatedArticleSlugs: ['enron-scandal-and-arthur-andersen', 'gandhi-bhagat-singh-delhi-pact'],
  },

  // ==========================================
  // 4. THE ENRON COLLAPSE & ARTHUR ANDERSEN
  // ==========================================
  {
    id: 'art-enron-arthur-andersen',
    slug: 'enron-scandal-and-arthur-andersen',
    title: 'Behind the Curtains: The Enron Scandal and the Arthur Andersen Shredding Operation',
    pronunciation: '/ˈɛnrɒn/',
    summary: 'A forensic accounting investigation detailing how Enron utilized mark-to-market accounting on projected 20-year contracts and off-balance-sheet Special Purpose Entities (Chewco, LJM, Raptor) to conceal $1.2 billion in shareholder equity losses before collapsing into bankruptcy.',
    articleType: 'event',
    region: 'North America',
    category: 'Behind Corporations',
    categorySlug: 'behind-corporations',
    subCategory: 'Corporate Bankruptcies & Systemic Failures',
    tags: ['Enron', 'Arthur Andersen', 'Forensic Accounting', 'Mark to Market', 'Special Purpose Entities', 'Sherron Watkins', 'Sarbanes Oxley', 'Whistleblower'],
    readingTimeMinutes: 13,
    lastUpdated: '2026-08-18',
    author: 'Forensic Accounting & Corporate Fraud Desk',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The Enron corporate towers in Houston, Texas during the October 2001 financial unwinding and SEC subpoena service.',
    imageCredit: 'US Securities & Exchange Commission Trial Evidence Records',
    featured: true,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'Behind the Fortune magazine "America’s Most Innovative Company" awards (which Enron won six consecutive years), Enron’s CFO Andrew Fastow and CEO Jeffrey Skilling created hundreds of shell entities whose sole purpose was to buy underperforming Enron assets with Enron stock as collateral.',
    relatedCategories: ['Behind the Failure & Collapse', 'Behind the Controversy & Scandal', 'Declassified Archives & Primary Evidence'],
    views: 162400,
    infobox: {
      title: 'Enron & Arthur Andersen Collapse',
      subtitle: 'Behind the Curtains: Forensic Audit',
      articleType: 'event',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'Houston headquarters forensic investigation',
      imageAlt: 'Corporate glass skyscraper',
      imageCredit: 'SEC Investigation Archives',
      details: [
        { label: 'Key Executives', value: 'Kenneth Lay (CEO/Chairman), Jeffrey Skilling (CEO), Andrew Fastow (CFO)' },
        { label: 'Key Whistleblower', value: 'Sherron Watkins (VP of Corporate Development)' },
        { label: 'Auditing Firm', value: 'Arthur Andersen LLP (dissolved after obstruction of justice conviction)' },
        { label: 'Bankruptcy Date', value: 'December 2, 2001 (largest US Chapter 11 bankruptcy at the time)' },
        { label: 'Key Accounting Schemes', value: 'Mark-to-Market (MTM) estimated earnings, Special Purpose Entities (SPEs)' },
        { label: 'Legislative Impact', value: 'Sarbanes-Oxley Act of 2002 (SOX)' },
      ],
    },
    financialMechanism: {
      schemeType: 'Mark-to-Market Overstatement & Off-Balance-Sheet SPE Debt Hiding',
      estimatedQuantum: '$74 Billion in market capitalization evaporated; $1.2 Billion direct equity wipeout',
      institutionsInvolved: [
        'Enron Corporation (Houston, TX)',
        'Arthur Andersen LLP (Chicago, IL - Big Five accounting giant)',
        'Chewco Investments & LJM Cayman LP (Fastow-controlled SPEs)',
        'Raptor Special Purpose Vehicles',
        'Merrill Lynch, Citigroup, and J.P. Morgan (structured finance loans)',
      ],
      stepByStepFlow: [
        {
          stepNumber: 1,
          title: 'Mark-to-Market (MTM) Revenue Booking on Unbuilt Projects',
          description: 'Under SEC approval gained by Skilling in 1992, Enron booked the entire estimated net present value of long-term 20-year energy contracts on day one, before a single kilowatt of electricity was delivered.',
        },
        {
          stepNumber: 2,
          title: 'Creating Off-Balance-Sheet Special Purpose Entities (SPEs)',
          description: 'When projected deals lost money or asset values plunged (e.g. Dabhol power plant in India or broadband bandwidth), Fastow transferred the depreciated assets to SPEs (Chewco, LJM) so losses never appeared on Enron’s consolidated income statement.',
        },
        {
          stepNumber: 3,
          title: 'Using Enron Shares as Collateral for Fake SPE Equity',
          description: 'To meet the 3% outside equity rule to keep SPEs off-balance-sheet, Enron issued its own stock or guarantees to the entities. If Enron’s share price declined, the SPEs would become insolvent, triggering immediate loan calls back to Enron.',
        },
        {
          stepNumber: 4,
          title: 'The Whistleblower Memo and Share Price Collapse',
          description: 'In August 2001, VP Sherron Watkins delivered a confidential 7-page memo to Ken Lay warning: "I am incredibly nervous that we will implode in a wave of accounting scandals." In October 2001, Enron posted a $618 million quarterly loss and wiped out $1.2 billion of shareholder equity.',
        },
        {
          stepNumber: 5,
          title: 'The Arthur Andersen Document Shredding Operation',
          description: 'Between October 23 and November 9, 2001, Andersen auditors in Houston shredded more than two tons of audit workpapers and deleted thousands of emails after receiving notice of an SEC subpoena, leading to Andersen’s criminal indictment.',
        },
      ],
      regulatoryFailures: [
        'Arthur Andersen earned $25 million in audit fees and $27 million in consulting fees from Enron in 2000 alone, creating a fatal conflict of interest',
        'Board of Directors twice waived the company’s internal Code of Ethics to allow CFO Andrew Fastow to run and profit from private SPE partnerships (LJM)',
        'Wall Street analysts uniformly maintained "Strong Buy" ratings even as cash flow from operations turned sharply negative while reported paper profits soared',
      ],
      legalOutcomes: [
        'Enron filed for Chapter 11 bankruptcy on December 2, 2001',
        'Arthur Andersen was convicted of obstruction of justice in June 2002, permanently surrendering its CPA licenses and collapsing from 85,000 employees',
        'CFO Andrew Fastow pled guilty to conspiracy and served six years; CEO Jeffrey Skilling was sentenced to 24 years in federal prison',
        'Congress passed the Public Company Accounting Reform and Investor Protection Act (Sarbanes-Oxley Act of 2002)',
      ],
    },
    mediaComparison: {
      workTitle: 'Enron: The Smartest Guys in the Room (2005 Documentary)',
      workType: 'Investigative Documentary Film',
      dramatizedElements: [
        'Emphasizes the hyper-aggressive California electricity trading floor audio tapes over the dry mechanical mechanics of the Raptor accounting derivatives',
      ],
      omittedRealities: [
        'The deep structural involvement of major international banks (Citigroup and J.P. Morgan) who settled with the SEC for hundreds of millions for facilitating "pre-pay" loans disguised as commodity sales',
        'The specific details of the Powers Investigative Committee Report submitted to the US Bankruptcy Court in February 2002',
      ],
      historicalConsensus: 'Documented Fact: Enron collapsed due to systemic accounting deception, conflicted auditor oversight, and synthetic derivative debt masking that permanently reshaped global corporate governance laws.',
    },
    primaryDocuments: [
      {
        id: 'doc-watkins-memo',
        title: 'Sherron Watkins Whistleblower Memorandum to Kenneth Lay',
        author: 'Sherron Watkins, Vice President of Corporate Development',
        date: 'August 15, 2001',
        sourceArchive: 'US House Committee on Financial Services Hearing Exhibits (2002)',
        documentType: 'Internal Corporate Memo',
        excerpt: 'Has Enron become a risky place to work? For those of us who didn’t get rich over the last few years, can we afford to stay? I am incredibly nervous that we will implode in a wave of accounting scandals.',
        significance: 'The definitive internal whistleblower document warning Enron leadership of catastrophic SPE insolvency months before public collapse.',
      },
      {
        id: 'doc-powers-report',
        title: 'Report of Investigation by the Special Investigative Committee of the Board of Directors of Enron Corp.',
        author: 'William C. Powers Jr., Dean of University of Texas Law School',
        date: 'February 1, 2002',
        sourceArchive: 'US Bankruptcy Court, Southern District of New York',
        documentType: 'Independent Board Investigation Report',
        excerpt: 'This report documents an unchecked culture where billions in debt and non-performing assets were shifted into partnerships managed by the company’s own Chief Financial Officer, generating tens of millions in personal profits for executives at the direct expense of shareholders.',
        significance: 'The forensic report that untangled Fastow’s SPE web for the Department of Justice.',
      },
    ],
    timelineEvents: [
      {
        date: 'January 1992',
        title: 'SEC Approves Mark-to-Market Accounting for Enron',
        description: 'SEC approves Enron’s request to utilize mark-to-market accounting for its gas contracts, laying the groundwork for estimated earnings recognition.',
        evidenceClassification: 'Documented Fact',
      },
      {
        date: 'August 14, 2001',
        title: 'Jeffrey Skilling Resigns Unexpectedly',
        description: 'Skilling abruptly resigns after just six months as CEO, citing "personal reasons" while secretly selling millions in stock.',
        evidenceClassification: 'Documented Fact',
      },
      {
        date: 'October 16, 2001',
        title: 'Enron Reports $618M Loss and $1.2B Equity Reduction',
        description: 'Enron announces massive write-down of its Raptor partnerships, alarming Wall Street credit rating agencies.',
        evidenceClassification: 'Documented Fact',
        isTurningPoint: true,
      },
      {
        date: 'December 2, 2001',
        title: 'Chapter 11 Bankruptcy Filing',
        description: 'Enron files for bankruptcy; thousands of employees lose jobs and retirement pensions within hours.',
        evidenceClassification: 'Documented Fact',
      },
    ],
    handwrittenNotes: [
      {
        id: 'note-enron-1',
        text: 'The lesson of Enron is that when earnings are calculated on 20-year subjective mathematical models rather than actual collected cash, fraud becomes an unavoidable mathematical necessity.',
        authorLabel: 'SEC Forensic Examiner',
        dateOrEpoch: 'October 2001',
        marginLocation: 'analysis',
        contextLabel: 'Forensic Accounting Principle',
      },
    ],
    sections: [
      {
        id: 'behind-innovative-mask',
        title: 'Behind the Curtains: America’s Most Innovative Mirage',
        content: [
          'Throughout the late 1990s, Enron was hailed as the crown jewel of the new economy. Transforming from an unglamorous regional natural gas pipeline operator into a high-tech trading powerhouse, its stock price soared past $90 per share, with a market capitalization exceeding $60 billion.',
          'Behind closed doors in Houston, however, the company was hemorrhaging real cash. Under CEO Jeffrey Skilling, Enron adopted Mark-to-Market (MTM) accounting. When Enron signed a 20-year contract to trade electricity or broadband capacity, it immediately booked the entire estimated net present value of expected profits on the day of signing, based on internal mathematical models rather than audited cash receipts.',
        ],
      },
      {
        id: 'the-spe-architecture',
        title: 'Fastow’s Special Purpose Entities: Chewco, LJM, and Raptor',
        content: [
          'When long-term projects failed to generate cash or plummeted in market value (such as the $3 billion Dabhol power plant in Maharashtra, India), booking the losses would have crashed Enron’s credit rating. A lower credit rating would immediately trigger clauses forcing Enron to repay billions in debt.',
          'To evade this, CFO Andrew Fastow established a series of offshore Special Purpose Entities (SPEs) with names like Chewco, LJM, and Raptor. Enron sold its unprofitable assets to these entities in exchange for promissory notes, booking non-existent profits while tucking billions of real debt into off-balance-sheet vehicles that were hidden from regular public filings.',
        ],
      },
      {
        id: 'shredding-and-sox',
        title: 'The Shredding at Arthur Andersen and the Birth of SOX',
        content: [
          'When the SEC launched a formal inquiry in October 2001, Arthur Andersen’s Houston audit team, led by partner David Duncan, began an emergency document destruction operation. Millions of physical audit papers, memos, and email chains were shredded to prevent subpoena compliance.',
          'The scandal destroyed Arthur Andersen—which had been one of the world’s "Big Five" accounting firms for 89 years. In response to the wave of corporate bankruptcies (Enron, WorldCom, Tyco), the United States Congress enacted the Sarbanes-Oxley Act of 2002, imposing strict criminal penalties for corporate officers who certify fraudulent financial statements.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'The Smartest Guys in the Room: The Amazing Rise and Scandalous Fall of Enron',
        author: 'Bethany McLean and Peter Elkind',
        publisher: 'Portfolio / Penguin',
        year: '2003',
        url: 'https://example.org/ref/mclean-enron',
      },
      {
        id: 2,
        title: 'Final Report of Neal Batson, Court-Appointed Examiner for Enron Corp.',
        author: 'Neal Batson',
        publisher: 'US Bankruptcy Court (SDNY)',
        year: '2003',
        url: 'https://example.org/ref/batson-examiner-report',
      },
    ],
    relatedArticleSlugs: ['harshad-mehta-1992-securities-scam', 'apollo-11-moon-landing'],
  },

  // ==========================================
  // 5. APOLLO 11: 1202 ALARM & 16 SECONDS OF FUEL
  // ==========================================
  {
    id: 'art-apollo-11',
    slug: 'apollo-11-moon-landing',
    title: 'Behind the Curtains: The Apollo 11 Lunar Module Landing Crisis',
    pronunciation: '/əˈpɒloʊ ɪˈlɛvən/',
    summary: 'The untold engineering crisis behind the July 20, 1969 lunar landing: how Margaret Hamilton’s asynchronous software architecture, a 1202 program alarm overload, and a boulder-strewn crater forced Neil Armstrong to land with just 16 seconds of descent fuel remaining.',
    articleType: 'event',
    region: 'North America',
    category: 'Behind the Evidence',
    categorySlug: 'behind-the-evidence',
    subCategory: 'Spaceflight & Mission Engineering',
    tags: ['Apollo 11', 'Neil Armstrong', 'Margaret Hamilton', '1202 Alarm', 'Lunar Module', 'NASA', 'Mission Control', 'Space Engineering'],
    readingTimeMinutes: 10,
    lastUpdated: '2026-08-18',
    author: 'Aerospace Systems Research Desk',
    image: 'https://images.unsplash.com/photo-1517976487507-5b3a4a1b0232?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The Apollo Guidance Computer (AGC) and Lunar Module descent cockpit during final approach over the Sea of Tranquility.',
    imageCredit: 'NASA Historical Flight Data Archives',
    featured: true,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'While mainstream history celebrates the poetic "giant leap for mankind," the telemetry flight logs reveal that the Lunar Module nearly aborted 40,000 feet above the moon when the rendezvous radar flooded the 2K RAM computer with spurious interrupts.',
    relatedCategories: ['Behind the Production & Development', 'Behind the Creation', 'Hidden Details & Untold Stories'],
    views: 138000,
    infobox: {
      title: 'Apollo 11 Lunar Landing',
      subtitle: 'Behind the Curtains: Telemetry & Flight Logs',
      articleType: 'event',
      image: 'https://images.unsplash.com/photo-1517976487507-5b3a4a1b0232?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'NASA Mission Control Houston during 1202 alarm',
      imageAlt: 'Apollo cockpit and mission console',
      imageCredit: 'NASA Archives',
      details: [
        { label: 'Key Figures', value: 'Neil Armstrong, Buzz Aldrin, Steve Bales (GUIDO), Margaret Hamilton' },
        { label: 'Landing Date', value: 'July 20, 1969 (20:17:40 UTC)' },
        { label: 'Critical Alarms', value: '1202 and 1201 CPU Executive Executive Overflow Alarms' },
        { label: 'Remaining Fuel', value: 'Estimated ~16 to 25 seconds of descent propellant at touchdown' },
        { label: 'Computer Specs', value: 'Apollo Guidance Computer (AGC): 2048 words RAM, 1.024 MHz clock' },
      ],
    },
    mediaComparison: {
      workTitle: 'First Man (2018 Film)',
      workType: 'Feature Film / Cinematic Biopic',
      dramatizedElements: [
        'Depicts extreme cockpit turbulence and shaky-cam panic during touchdown',
        'Ommits the 24-year-old mission controller Steve Bales consulting his cheat sheet to clear the "GO" call in 15 seconds',
      ],
      omittedRealities: [
        'Margaret Hamilton’s MIT team specifically designing asynchronous priority scheduling that discarded radar noise while maintaining throttle thrusters',
      ],
      historicalConsensus: 'Documented Fact: The landing succeeded because the Apollo computer operating system safely dropped low-priority cycles during CPU overload.',
    },
    primaryDocuments: [
      {
        id: 'doc-apollo-telemetry-log',
        title: 'Apollo 11 Mission Flight Logs (Mission Operations Directorate)',
        author: 'NASA Houston Mission Control Center',
        date: 'July 20, 1969',
        sourceArchive: 'NASA Johnson Space Center History Collection',
        documentType: 'Official Flight Transcript',
        excerpt: 'Armstrong: Program Alarm. 1202. / Duke (CAPCOM): Stand by, we are checking on that. / Bales (GUIDO): GO on that alarm, flight! If it doesn’t reoccur continuously, we’re GO.',
        significance: 'The real-time transcript confirming the near-abort decision over the 1202 CPU overload.',
      },
    ],
    timelineEvents: [
      {
        date: 'July 20, 1969 (20:05 UTC)',
        title: 'Powered Descent Initiation (PDI)',
        description: 'Lunar Module Eagle fires descent engine 50,000 feet above the moon.',
        evidenceClassification: 'Documented Fact',
      },
      {
        date: 'July 20, 1969 (20:10 UTC)',
        title: 'The 1202 Program Alarm Triggered',
        description: 'Rendezvous radar steals 15% of AGC CPU cycles, causing memory overflow warning.',
        evidenceClassification: 'Documented Fact',
        isTurningPoint: true,
      },
      {
        date: 'July 20, 1969 (20:17 UTC)',
        title: 'Touchdown with 16 Seconds Fuel Remaining',
        description: 'Armstrong manually clears West Crater boulder field and touches down on Tranquility Base.',
        evidenceClassification: 'Documented Fact',
      },
    ],
    handwrittenNotes: [
      {
        id: 'note-ap-1',
        text: 'Without Hamilton’s priority scheduling software, the 1202 alarm would have locked the computer and forced an immediate emergency abort staging.',
        authorLabel: 'MIT Instrumentation Lab Historian',
        dateOrEpoch: 'July 1969',
        marginLocation: 'analysis',
        contextLabel: 'Software Architecture Milestone',
      },
    ],
    sections: [
      {
        id: 'the-overload-crisis',
        title: 'Behind the Scenes: The Rendezvous Radar Overflow',
        content: [
          'At 33,000 feet above the lunar surface, the Apollo Guidance Computer (AGC) flashed a yellow caution light with the code "1202." Neither Neil Armstrong nor Buzz Aldrin immediately knew what the code meant, and Armstrong called Houston for an immediate determination.',
          'Backstage at MIT, Margaret Hamilton’s software engineering team had built priority job scheduling. The rendezvous radar switch had been inadvertently left in the wrong mode, flooding the computer with 800 cycle pulses per second. Because Hamilton’s code prioritized life-critical rocket engine commands over radar monitoring, the AGC dropped the secondary tasks without stalling.',
        ],
      },
      {
        id: 'the-boulder-field',
        title: 'The Final 16 Seconds: West Crater Manual Flyover',
        content: [
          'As the Lunar Module dropped below 500 feet, Armstrong looked out the triangular window and realized the automatic guidance computer was taking them into a football-field-sized crater filled with car-sized boulders.',
          'Armstrong took manual joystick control, pitching the spacecraft forward to fly past the crater. In Houston, flight controllers watched the fuel gauge drop below the 60-second "Bingo" call. When the contact light finally turned blue, Eagle had approximately 16 seconds of descent fuel remaining before a mandatory abort.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'Apollo 11 Lunar Surface Journal',
        author: 'Eric M. Jones',
        publisher: 'NASA History Division',
        year: '1995',
        url: 'https://example.org/ref/nasa-apollo11-journal',
      },
    ],
    relatedArticleSlugs: ['turing-machine', 'james-webb-space-telescope'],
  },

  // ==========================================
  // 6. JAMES WEBB SPACE TELESCOPE
  // ==========================================
  {
    id: 'art-jwst-engineering',
    slug: 'james-webb-space-telescope',
    title: 'Behind the Curtains: The James Webb Telescope’s 344 Single-Point Failures',
    pronunciation: '/dʒeɪmz wɛb/',
    summary: 'The 25-year backstage engineering battle, near-cancellations by Congress in 2011, and the nail-biting deployment of 344 single-point failure mechanisms that turned JWST into history’s most audacious astronomical instrument.',
    articleType: 'technology',
    region: 'Global',
    category: 'Behind the Evidence',
    categorySlug: 'behind-the-evidence',
    subCategory: 'Spaceflight & Mission Engineering',
    tags: ['JWST', 'James Webb Telescope', 'NASA', 'Single Point Failures', 'Sunshield', 'Astronomy', 'Infrared Optics'],
    readingTimeMinutes: 9,
    lastUpdated: '2026-08-18',
    author: 'Astrophysics & Deep Space Desk',
    image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The gold-beryllium primary mirror array of JWST in the clean room prior to folding into the Ariane 5 rocket fairing.',
    imageCredit: 'NASA Goddard Space Flight Center',
    featured: false,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'Unlike the Hubble Space Telescope in low Earth orbit, JWST was positioned 1.5 million kilometers away at the Sun-Earth L2 point, making any physical astronaut repair mission physically impossible. Every one of the 344 release pins had to fire perfectly.',
    relatedCategories: ['Behind the Production & Development', 'Behind the Creation'],
    views: 95400,
    infobox: {
      title: 'James Webb Telescope',
      subtitle: 'Behind the Curtains: Mission Engineering',
      articleType: 'technology',
      image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'Clean room inspection of 18 beryllium segments',
      imageAlt: 'Gold hexagonal telescope mirrors',
      imageCredit: 'NASA / Chris Gunn',
      details: [
        { label: 'Primary Mirror', value: '6.5 meter diameter (18 gold-coated beryllium segments)' },
        { label: 'Sunshield Layers', value: '5-layer Kapton membrane (tennis court size)' },
        { label: 'Orbit', value: 'Sun-Earth Lagrange Point 2 (L2) - 1.5M km from Earth' },
        { label: 'Single Point Failures', value: '344 non-redundant mechanical actuators/pins' },
        { label: 'Total Budget', value: '$10 Billion (originally proposed in 1996 for $1B)' },
      ],
    },
    sections: [
      {
        id: 'near-cancellation',
        title: 'Behind the Curtains: The 2011 Congressional Near-Cancellation',
        content: [
          'In July 2011, the House Appropriations Committee voted to zero out the entire budget for JWST after costs ballooned past $8 billion. Behind closed doors, an unprecedented coalition of international astrophysicists, European Space Agency partners, and university faculties lobbied the US Senate to restore funding, establishing the Casani Independent Review Panel.',
        ],
      },
      {
        id: 'the-deployment-dance',
        title: 'The 344 Single-Point Failures Deployment Sequence',
        content: [
          'Because the 6.5-meter mirror and tennis-court-sized sunshield were too large for any operational rocket fairing, the telescope was folded like origami into an Ariane 5 rocket. During its 30-day cruise to L2, it executed 344 sequential release operations. If even one tensioner pin failed to release, the entire $10 billion observatory would have been rendered useless scrap metal.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'Independent Comprehensive Review Panel Final Report (JWST)',
        author: 'John Casani et al.',
        publisher: 'NASA Public Archives',
        year: '2010',
        url: 'https://example.org/ref/casani-report',
      },
    ],
    relatedArticleSlugs: ['apollo-11-moon-landing', 'theory-of-general-relativity'],
  },

  // ==========================================
  // 7. THEORY OF GENERAL RELATIVITY (1915)
  // ==========================================
  {
    id: 'art-general-relativity',
    slug: 'theory-of-general-relativity',
    title: 'Behind the Curtains: Einstein’s Eight-Year Struggle for General Relativity',
    pronunciation: '/ˈdʒɛnərəl ˌrɛləˈtɪvɪti/',
    summary: 'The untold mathematical setbacks, discarded "Entwurf" drafts, and the dramatic November 1915 race against mathematician David Hilbert that led Albert Einstein to the gravitational field equations.',
    articleType: 'science',
    region: 'Europe',
    category: 'Behind the Evidence',
    categorySlug: 'behind-the-evidence',
    subCategory: 'Scientific & Intellectual Breakthroughs',
    tags: ['Albert Einstein', 'General Relativity', 'David Hilbert', 'Entwurf Theory', 'Marcel Grossmann', 'Physics', 'Spacetime Curvature'],
    readingTimeMinutes: 11,
    lastUpdated: '2026-08-18',
    author: 'History of Modern Physics Desk',
    image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Original handwritten draft pages from the Einstein-Besso Zurich notebook (1913), showing discarded gravitational calculations.',
    imageCredit: 'Albert Einstein Archives / Hebrew University of Jerusalem',
    featured: false,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'Popular mythology claims Einstein arrived at general relativity in an effortless flash of geometric insight. In reality, he spent three agonizing years trapped in the incorrect "Entwurf" theory after rejecting the correct Riemann curvature tensor in 1912 due to a mathematical mistake.',
    relatedCategories: ['Behind the Creation', 'Hidden Details & Untold Stories'],
    views: 89000,
    infobox: {
      title: 'General Relativity Creation',
      subtitle: 'Behind the Curtains: Zurich Notebooks',
      articleType: 'science',
      image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'Einstein-Besso manuscript calculations',
      imageAlt: 'Handwritten equations on archival parchment',
      imageCredit: 'Einstein Papers Project',
      details: [
        { label: 'Core Author', value: 'Albert Einstein (with Marcel Grossmann & Michele Besso)' },
        { label: 'Key Breakthrough', value: 'November 25, 1915 (Prussian Academy of Sciences)' },
        { label: 'Discarded Theory', value: 'Entwurf Theory (1913 - non-generally covariant)' },
        { label: 'First Confirmation', value: 'Arthur Eddington’s 1919 Solar Eclipse Expedition (Principe Island)' },
      ],
    },
    sections: [
      {
        id: 'the-entwurf-trap',
        title: 'Behind the Scenes: The Three-Year Mathematical Dead End',
        content: [
          'Between 1912 and 1915, Einstein and his mathematician friend Marcel Grossmann formulated the "Entwurf" theory. Einstein mistakenly believed that general covariance (making equations true in all coordinate systems) violated the principle of physical causality. It took three years of intense correspondence with Michele Besso to realize his "hole argument" was flawed.',
        ],
      },
      {
        id: 'the-hilbert-clash',
        title: 'The Dramatic November 1915 Sprint Against David Hilbert',
        content: [
          'In summer 1915, Einstein lectured in Göttingen, explaining his ideas to David Hilbert, the world’s foremost pure mathematician. Hilbert immediately set out to derive the field equations from an action principle. Panicked that Hilbert would publish first, Einstein spent November 1915 presenting four consecutive weekly papers to the Prussian Academy of Sciences, finally discovering the correct Ricci tensor term on November 25, 1915.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'Subtle is the Lord: The Science and the Life of Albert Einstein',
        author: 'Abraham Pais',
        publisher: 'Oxford University Press',
        year: '1982',
        url: 'https://example.org/ref/pais-subtle-lord',
      },
    ],
    relatedArticleSlugs: ['albert-einstein', 'turing-machine'],
  },

  // ==========================================
  // 8. ADA LOVELACE: THE TRANSLATION & UNTOLD CODE
  // ==========================================
  {
    id: 'art-ada-lovelace',
    slug: 'ada-lovelace',
    title: 'Behind the Curtains: Ada Lovelace and the Hidden Mechanics of Note G',
    pronunciation: '/ˈeɪdə ˈlʌvleɪs/',
    summary: 'How Ada Lovelace expanded Luigi Menabrea’s brief French lecture sketch by 300%, authoring "Note G"—the first published computer algorithm for generating Bernoulli numbers on Charles Babbage’s mechanical Analytical Engine.',
    articleType: 'person',
    region: 'Europe',
    category: 'Behind the Evidence',
    categorySlug: 'behind-the-evidence',
    subCategory: 'Uncredited Innovators & Ghostwriters',
    tags: ['Ada Lovelace', 'Charles Babbage', 'Analytical Engine', 'Note G', 'Bernoulli Numbers', 'First Computer Programmer', 'History of Computing'],
    readingTimeMinutes: 8,
    lastUpdated: '2026-08-18',
    author: 'Computing History & Pioneers Desk',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Engravings of Charles Babbage’s mechanical Analytical Engine gears and Lovelace’s original 1843 published algorithmic diagram for Note G.',
    imageCredit: 'Science Museum London Historical Archive',
    featured: false,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'While Victorian convention forced her to publish solely under the initials "A.A.L." to conceal her gender, Lovelace was the first to recognize that Babbage’s machine was not merely a mechanical calculator, but a general-purpose symbol manipulator capable of composing music and processing complex logic.',
    relatedCategories: ['Behind the Evidence', 'Behind History'],
    views: 76500,
    infobox: {
      title: 'Ada Lovelace & Note G',
      subtitle: 'Behind the Curtains: 1843 Algorithm',
      articleType: 'person',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
      imageCaption: '1843 Taylor’s Scientific Memoirs pages',
      imageAlt: 'Victorian mathematical table and diagrams',
      imageCredit: 'British Library',
      details: [
        { label: 'Full Name', value: 'Augusta Ada King, Countess of Lovelace (née Byron)' },
        { label: 'Lifespan', value: 'December 10, 1815 – November 27, 1852' },
        { label: 'Landmark Work', value: 'Notes on Menabrea’s Sketch of the Analytical Engine (1843)' },
        { label: 'First Algorithm', value: 'Note G: Calculation of Bernoulli Numbers via Punch Cards' },
        { label: 'Key Conceptual Leap', value: 'General-purpose symbolic computation (weaving algebraic patterns like Jacquard loom)' },
      ],
    },
    sections: [
      {
        id: 'the-translation-dossier',
        title: 'Behind the Scenes: Translating Menabrea’s French Lecture',
        content: [
          'In 1842, Italian engineer Luigi Menabrea published a summary of Charles Babbage’s lecture on the Analytical Engine in a Swiss journal. Lovelace was commissioned to translate the article into English. Over nine months of intense collaboration, Lovelace added seven extensive appendices (Notes A through G), which tripled the length of the original text.',
        ],
      },
      {
        id: 'the-poetical-science',
        title: 'Note G and the Vision of General-Purpose Computing',
        content: [
          'In Note G, Lovelace mapped out the step-by-step instructions for the Analytical Engine’s memory columns and arithmetic unit to calculate Bernoulli numbers. More fundamentally, while Babbage saw the engine as a number cruncher, Lovelace wrote: "The engine might compose elaborate and scientific pieces of music of any degree of complexity or extent."',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'Sketch of the Analytical Engine Invented by Charles Babbage, with notes by the translator',
        author: 'Ada Augusta Lovelace (A.A.L.)',
        publisher: 'Taylor’s Scientific Memoirs, Vol III',
        year: '1843',
        url: 'https://example.org/ref/lovelace-1843-notes',
      },
    ],
    relatedArticleSlugs: ['turing-machine', 'theory-of-general-relativity'],
  },

  // ==========================================
  // 9. ALAN TURING & BLETCHLEY PARK
  // ==========================================
  {
    id: 'art-turing-machine',
    slug: 'turing-machine',
    title: 'Behind the Curtains: Alan Turing’s Secret Bombe at Bletchley Park',
    pronunciation: '/ˈtʊərɪŋ/',
    summary: 'The 30-year classified secrets of Hut 8: how Alan Turing and Gordon Welchman built the electro-mechanical Bombe to break the German naval Enigma cipher, saving millions of Allied lives while sworn to total secrecy until the 1970s.',
    articleType: 'technology',
    region: 'Europe',
    category: 'Behind the Evidence',
    categorySlug: 'behind-the-evidence',
    subCategory: 'Hardware & Computing Systems',
    tags: ['Alan Turing', 'Bletchley Park', 'Enigma Cipher', 'The Bombe', 'Hut 8', 'Secret Wartime Codebreaking', 'Computer Science'],
    readingTimeMinutes: 10,
    lastUpdated: '2026-08-18',
    author: 'Wartime Intelligence & Cryptography Desk',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The electro-mechanical Bombe rotor drums at Bletchley Park, used to test thousands of Enigma rotor combinations in minutes.',
    imageCredit: 'Bletchley Park Trust / UK National Archives',
    featured: false,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'Because of the Official Secrets Act, Turing was legally forbidden from telling even his closest family about his wartime achievements. When he died tragically in 1954, the public only knew him as a reclusive Manchester mathematician, unaware he had pioneered modern computer science.',
    relatedCategories: ['Behind the Production & Development', 'Hidden Details & Untold Stories', 'Declassified Archives & Primary Evidence'],
    views: 112000,
    infobox: {
      title: 'Turing & Bletchley Park',
      subtitle: 'Behind the Curtains: Ultra Intelligence',
      articleType: 'technology',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'Bletchley Park Bombe replica in action',
      imageAlt: 'Electromechanical codebreaking drums',
      imageCredit: 'UK National Archives (HW 25)',
      details: [
        { label: 'Key Figures', value: 'Alan Turing, Gordon Welchman, Joan Clarke, Hugh Alexander' },
        { label: 'Operation Base', value: 'Government Code and Cypher School (GC&CS), Bletchley Park (Hut 8)' },
        { label: 'Key Invention', value: 'The British Bombe (electromechanical cryptanalysis machine)' },
        { label: 'Declassification Date', value: '1974 (published in F.W. Winterbotham’s The Ultra Secret)' },
      ],
    },
    sections: [
      {
        id: 'the-crib-technique',
        title: 'Behind the Scenes: Diagonal Boards and Crib Matching',
        content: [
          'Enigma had 150 quintillion possible daily key combinations. Turing realized that testing every key randomly was mathematically impossible. Instead, he exploited human laziness: German weather operators consistently transmitted formatted weather reports beginning with "WETTER" at 6:00 AM every morning. Turing used these "cribs" to rapidly eliminate impossible rotor positions.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'Alan Turing: The Enigma',
        author: 'Andrew Hodges',
        publisher: 'Burnett Books / Hutchinson',
        year: '1983',
        url: 'https://example.org/ref/hodges-turing-enigma',
      },
    ],
    relatedArticleSlugs: ['ada-lovelace', 'apollo-11-moon-landing'],
  },

  // ==========================================
  // 10. LIBRARY OF ALEXANDRIA
  // ==========================================
  {
    id: 'art-library-of-alexandria',
    slug: 'library-of-alexandria',
    title: 'Behind the Curtains: The Multi-Stage Destruction of the Royal Library of Alexandria',
    pronunciation: '/ˌælɪɡˈzændriə/',
    summary: 'Debunking the myth of a single catastrophic fire: how Roman civil wars, budget neglect under Ptolemaic decline, Aurelian’s siege, and religious decrees eroded history’s greatest ancient scroll repository across 400 years.',
    articleType: 'place',
    region: 'Middle East',
    category: 'Behind History',
    categorySlug: 'behind-history',
    subCategory: 'Lost Institutions & Disasters',
    tags: ['Library of Alexandria', 'Ptolemy I Soter', 'Julius Caesar', 'Serapeum', 'Ancient History', 'Manuscript Preservation'],
    readingTimeMinutes: 9,
    lastUpdated: '2026-08-18',
    author: 'Classical Antiquity & Archival Loss Desk',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Reconstructed classical library colonnades and papyrus scroll storage niches.',
    imageCredit: 'Classical Antiquity Archive',
    featured: false,
    popular: true,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'Contrary to popular cinema depicting a single zealot burning all 400,000 scrolls in one evening, the historical loss was an agonizing 400-year process of budget cuts, warehouse fires during Julius Caesar’s 48 BCE harbor skirmish, and administrative decay.',
    relatedCategories: ['Behind History', 'Behind the Mysteries'],
    views: 88400,
    infobox: {
      title: 'Library of Alexandria',
      subtitle: 'Behind the Curtains: Historical Record',
      articleType: 'place',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'Classical parchment scrolls and marble halls',
      imageAlt: 'Ancient Greek library ruins',
      imageCredit: 'Hellenistic Heritage Archive',
      details: [
        { label: 'Founded', value: 'c. 300 BCE by Ptolemy I Soter & Demetrius of Phalerum' },
        { label: 'Peak Capacity', value: 'Estimated 200,000 to 400,000 papyrus scrolls' },
        { label: 'First Fire', value: '48 BCE (Julius Caesar’s harbor fleet fire spreading to docks)' },
        { label: 'Later Destructions', value: 'Aurelian’s recapture (272 CE), Patriarch Theophilus (391 CE)' },
      ],
    },
    sections: [
      {
        id: 'the-slow-decline',
        title: 'Behind the Myth: A 400-Year Decay',
        content: [
          'The Library of Alexandria was never destroyed in a single Hollywood-style conflagration. In 48 BCE, during Julius Caesar’s siege of Alexandria, Caesar set fire to his own fleet in the harbor, which accidentally consumed warehouses containing export scrolls near the docks. The main Mouseion library survived and continued operating for centuries.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'The Vanished Library: A Wonder of the Ancient World',
        author: 'Luciano Canfora',
        publisher: 'University of California Press',
        year: '1989',
        url: 'https://example.org/ref/canfora-vanished-library',
      },
    ],
    relatedArticleSlugs: ['ancient-academies-of-athens', 'order-of-the-bavarian-illuminati'],
  },

  // ==========================================
  // 11. MARIANA TRENCH & TRIESTE
  // ==========================================
  {
    id: 'art-mariana-trench',
    slug: 'mariana-trench',
    title: 'Behind the Curtains: The 1960 Trieste Dive and Cold War Bathymetry',
    pronunciation: '/ˌmæriˈænə trɛntʃ/',
    summary: 'The classified Cold War background behind Jacques Piccard and Don Walsh’s 10,911-meter descent into the Challenger Deep, and the terrifying outer window fracture at 9,000 meters that nearly aborted the mission.',
    articleType: 'place',
    region: 'Global',
    category: 'Behind the Mysteries',
    categorySlug: 'behind-the-mysteries',
    subCategory: 'Deep Sea & Extreme Exploration',
    tags: ['Mariana Trench', 'Challenger Deep', 'Bathyscaphe Trieste', 'Jacques Piccard', 'Don Walsh', 'US Navy', 'Deep Sea Exploration'],
    readingTimeMinutes: 8,
    lastUpdated: '2026-08-18',
    author: 'Oceanographic & Classified Deep Sea Desk',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The Bathyscaphe Trieste being prepped by the US Navy in Guam prior to Project Nekton in January 1960.',
    imageCredit: 'US Naval History & Heritage Command',
    featured: false,
    popular: false,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'Project Nekton was funded by the US Office of Naval Research not purely for scientific wonder, but to understand deep ocean sound channels (SOFAR) for submarine acoustic warfare during the height of the Cold War.',
    relatedCategories: ['Behind the Mysteries', 'Behind the Evidence'],
    views: 64200,
    infobox: {
      title: 'Mariana Trench (Project Nekton)',
      subtitle: 'Behind the Curtains: 1960 Dive',
      articleType: 'place',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'Trieste spherical pressure cabin inspection',
      imageAlt: 'Submersible under crane in ocean',
      imageCredit: 'US Navy Archives',
      details: [
        { label: 'Max Depth Reached', value: '10,911 meters (35,797 feet)' },
        { label: 'Divers', value: 'Jacques Piccard (Swiss oceanographer), Lt. Don Walsh (US Navy)' },
        { label: 'Vessel', value: 'Bathyscaphe Trieste (Krupp forged steel sphere)' },
        { label: 'Hydrostatic Pressure', value: '1,086 bar (over 8 tons per square inch)' },
      ],
    },
    sections: [
      {
        id: 'the-cracked-window',
        title: 'Behind the Scenes: The Loud Bang at 9,000 Meters',
        content: [
          'At a depth of 9,000 meters (nearly 30,000 feet down), a sharp, violent shock rocked the Trieste. Piccard and Walsh checked instruments and found the Krupp forged-steel inner sphere intact, but an outer Plexiglas viewing window had cracked due to differential thermal contraction. Deciding not to panic surface mission control, they continued descending another 1,900 meters to the seabed.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'Seven Miles Down: The Story of the Bathyscaph Trieste',
        author: 'Jacques Piccard and Robert S. Dietz',
        publisher: 'G.P. Putnam’s Sons',
        year: '1961',
        url: 'https://example.org/ref/piccard-seven-miles-down',
      },
    ],
    relatedArticleSlugs: ['apollo-11-moon-landing', 'james-webb-space-telescope'],
  },

  // ==========================================
  // 12. UNITED NATIONS CHARTER (1945)
  // ==========================================
  {
    id: 'art-un-charter',
    slug: 'united-nations-charter',
    title: 'Behind the Curtains: The Dumbarton Oaks Bargains and the UN Veto',
    pronunciation: '/juːˌnaɪtɪd ˈneɪʃənz/',
    summary: 'The confidential 1944–1945 diplomatic transcripts from Dumbarton Oaks and Yalta: how the Great Powers made the permanent Security Council veto a non-negotiable prerequisite to prevent sovereign disarmament.',
    articleType: 'event',
    region: 'Global',
    category: 'Behind History',
    categorySlug: 'behind-history',
    subCategory: 'Diplomatic Pacts & Treaties',
    tags: ['United Nations', 'UN Charter', 'Dumbarton Oaks', 'Yalta Conference', 'Security Council Veto', 'Diplomatic History'],
    readingTimeMinutes: 9,
    lastUpdated: '2026-08-18',
    author: 'International Treaties & Diplomatic History Desk',
    image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The San Francisco Opera House during the signing of the United Nations Charter on June 26, 1945.',
    imageCredit: 'United Nations Archives',
    featured: false,
    popular: false,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'Behind the noble rhetoric of global peace, both the United States and the Soviet Union explicitly informed conference organizers that neither nation would ratify the Charter without an absolute, unilateral veto over Security Council military resolutions.',
    relatedCategories: ['Behind History', 'Behind the Evidence'],
    views: 48900,
    infobox: {
      title: 'UN Charter Negotiations',
      subtitle: 'Behind the Curtains: 1945 San Francisco',
      articleType: 'event',
      image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'Delegates signing the Charter in San Francisco',
      imageAlt: 'Diplomats at conference table',
      imageCredit: 'UN Photo Archives',
      details: [
        { label: 'Key Conferences', value: 'Dumbarton Oaks (1944), Yalta (Feb 1945), San Francisco (April–June 1945)' },
        { label: 'Key Negotiators', value: 'Alger Hiss, Andrei Gromyko, Edward Stettinius, Sir Alexander Cadogan' },
        { label: 'Core Veto Clause', value: 'Article 27(3) - The Great Power Veto' },
      ],
    },
    sections: [
      {
        id: 'the-yalta-compromise',
        title: 'Behind the Scenes: The Yalta Voting Formula',
        content: [
          'At the Yalta Conference in February 1945, Winston Churchill, Franklin D. Roosevelt, and Joseph Stalin hammered out the voting formula for the future Security Council. Stalin insisted on a veto that extended even to the discussion of disputes, while the US argued that peaceful discussion could not be blocked. The resulting compromise enshrined the permanent-five veto power.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'The Charter of the United Nations: A Commentary',
        author: 'Bruno Simma et al.',
        publisher: 'Oxford University Press',
        year: '2012',
        url: 'https://example.org/ref/simma-un-charter',
      },
    ],
    relatedArticleSlugs: ['gandhi-bhagat-singh-delhi-pact', 'olympic-games-history'],
  },

  // ==========================================
  // 13. SOGDIAN MERCHANTS & SILK ROAD
  // ==========================================
  {
    id: 'art-silk-road-trade',
    slug: 'silk-road-trade-routes',
    title: 'Behind the Curtains: The Sogdian Ancient Letters and Silk Road Debt Ledgers',
    pronunciation: '/sɒɡˈdiːən/',
    summary: 'How ancient Sogdian merchant guilds from Samarkand operated the shadow banking system, letter-of-credit networks, and diplomatic espionage across 4,000 miles of Eurasian trade routes.',
    articleType: 'place',
    region: 'Asia',
    category: 'Behind History',
    categorySlug: 'behind-history',
    subCategory: 'Shadow Economies & Ancient Caravans',
    tags: ['Silk Road', 'Sogdian Letters', 'Ancient Banking', 'Dunhuang', 'Caravanserai', 'Central Asian History'],
    readingTimeMinutes: 8,
    lastUpdated: '2026-08-18',
    author: 'Central Asian & Ancient Trade Desk',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Excavated 4th-century CE Sogdian Ancient Letters discovered by Sir Aurel Stein near a watchtower outside Dunhuang.',
    imageCredit: 'British Library International Dunhuang Project',
    featured: false,
    popular: false,
    isBehindCurtains: true,
    curtainLayer: 'behind_curtains',
    knowledgeDepth: 'Documented Fact',
    behindCurtainsContext: 'While popular imagination pictures individual Chinese travelers riding camels across the desert, Silk Road trade was dominated by a multilingual Iranian merchant network (the Sogdians) who pioneered paper debt reconciliation and commercial contracts.',
    relatedCategories: ['Hidden Details & Untold Stories', 'Declassified Archives & Primary Evidence'],
    views: 52100,
    infobox: {
      title: 'Sogdian Silk Road Network',
      subtitle: 'Behind the Curtains: Ancient Archives',
      articleType: 'place',
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
      imageCaption: 'Dunhuang watchtower manuscript fragments',
      imageAlt: 'Ancient parchment letter in Aramaic script',
      imageCredit: 'International Dunhuang Project',
      details: [
        { label: 'Dominant Guild', value: 'Sogdian Caravaneers (originating in modern Uzbekistan/Tajikistan)' },
        { label: 'Primary Evidence', value: 'The 8 Sogdian Ancient Letters (discovered 1907 by Aurel Stein)' },
        { label: 'Key Financial Inventions', value: 'Early promissory bills, multi-party debt syndication, cargo insurance' },
      ],
    },
    sections: [
      {
        id: 'the-ancient-letters',
        title: 'Behind the Scenes: The Lost Postbag of 313 CE',
        content: [
          'In 1907, archaeologist Sir Aurel Stein discovered an abandoned leather postbag in a watchtower along the Great Wall outside Dunhuang. The letters, dated to 313 CE and written in Sogdian script, detailed merchant disputes, exchange rates for silver vs silk, and a wife’s desperate letter to her husband who had abandoned her in China while chasing profits.',
        ],
      },
    ],
    citations: [
      {
        id: 1,
        title: 'The Sogdian Merchants: A History',
        author: 'Étienne de la Vaissière',
        publisher: 'Brill',
        year: '2005',
        url: 'https://example.org/ref/vaissiere-sogdians',
      },
    ],
    relatedArticleSlugs: ['library-of-alexandria', 'harshad-mehta-1992-securities-scam'],
  },
];

/**
 * Enhanced category resolver that maps any query strictly to the Behind the Curtains paradigm.
 */
export function resolveCategoryBySlug(
  slug: string,
  options?: { curtainsOnly?: boolean; layer?: string }
): {
  category?: Category;
  subcategory?: Subcategory;
  parentCategory?: Category;
  isSubcategory: boolean;
  isCurtainsLayer: boolean;
  activeLayer: string;
  articles: Article[];
  popularArticles: Article[];
  recentArticles: Article[];
  totalCategoryArticles: number;
  curtainsArticlesCount: number;
} {
  const normSlug = (slug || 'all').toLowerCase().trim();

  // Root / All Dossiers / Behind the Curtains
  if (
    normSlug === 'all' ||
    normSlug === 'behind-the-curtains' ||
    normSlug === 'curtains' ||
    normSlug === 'featured' ||
    normSlug === 'dossiers'
  ) {
    const allArticles = DEMO_ARTICLES;
    return {
      category: {
        id: 'cat-behind-the-curtains-master',
        slug: 'behind-the-curtains',
        name: 'Behind the Curtains',
        description: 'The Open Knowledge Codex dedicated exclusively to revealing what happens behind the scenes, behind closed doors, behind public images, and behind finished stories.',
        iconName: 'Sparkles',
        articleCount: allArticles.length,
        featuredArticleSlug: allArticles[0]?.slug,
      },
      isSubcategory: false,
      isCurtainsLayer: true,
      activeLayer: 'behind_curtains',
      articles: allArticles,
      popularArticles: allArticles.filter((a) => a.popular).slice(0, 4),
      recentArticles: [...allArticles].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 4),
      totalCategoryArticles: allArticles.length,
      curtainsArticlesCount: allArticles.length,
    };
  }

  // Exact category lookup
  const matchedCat = DEMO_CATEGORIES.find((c) => c.slug === normSlug || c.id === normSlug);
  if (matchedCat) {
    const catArticles = DEMO_ARTICLES.filter((a) => a.categorySlug === matchedCat.slug);
    return {
      category: matchedCat,
      isSubcategory: false,
      isCurtainsLayer: true,
      activeLayer: 'behind_curtains',
      articles: catArticles,
      popularArticles: catArticles.filter((a) => a.popular).slice(0, 3),
      recentArticles: [...catArticles].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 3),
      totalCategoryArticles: catArticles.length,
      curtainsArticlesCount: catArticles.length,
    };
  }

  // Subcategory lookup
  for (const cat of DEMO_CATEGORIES) {
    if (cat.subcategories) {
      const sub = cat.subcategories.find((s) => s.slug === normSlug || s.id === normSlug);
      if (sub) {
        const subArticles = DEMO_ARTICLES.filter(
          (a) => a.subCategory?.toLowerCase() === sub.name.toLowerCase() || a.categorySlug === cat.slug
        );
        return {
          category: undefined,
          subcategory: sub,
          parentCategory: cat,
          isSubcategory: true,
          isCurtainsLayer: true,
          activeLayer: 'behind_curtains',
          articles: subArticles,
          popularArticles: subArticles.filter((a) => a.popular).slice(0, 3),
          recentArticles: [...subArticles].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 3),
          totalCategoryArticles: subArticles.length,
          curtainsArticlesCount: subArticles.length,
        };
      }
    }
  }

  // Backward compatibility fallback: Map older generic slugs to Behind-the-Curtains categories
  const legacySlugMap: Record<string, string> = {
    'behind-the-creation': 'behind-the-evidence',
    'behind-the-decision': 'behind-history',
    'behind-the-controversy': 'behind-financial-markets',
    'behind-the-production': 'behind-the-evidence',
    'hidden-details': 'behind-the-mysteries',
    'declassified-evidence': 'behind-the-evidence',
    'behind-the-failure': 'behind-corporations',
    'people': 'behind-the-evidence',
    'history': 'behind-history',
    'politics': 'behind-history',
    'business': 'behind-corporations',
    'science': 'behind-the-evidence',
    'technology': 'behind-the-evidence',
    'education': 'behind-the-mysteries',
    'financial-scandals': 'behind-financial-markets',
    'corporate-stories': 'behind-corporations',
    'historical-controversies': 'behind-history',
    'conspiracies-secret-societies': 'behind-the-mysteries',
    'documents-evidence': 'behind-the-evidence',
  };

  if (legacySlugMap[normSlug]) {
    return resolveCategoryBySlug(legacySlugMap[normSlug], options);
  }

  // General fallback to Master Behind the Curtains
  return resolveCategoryBySlug('behind-the-curtains', options);
}
