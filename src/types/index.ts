export type DomainType = 'etsy_pod' | 'youtube_automation' | 'ai_apps' | 'indonesia';

export type StatusType = 'inbox' | 'research' | 'in_progress' | 'completed';

export type PriorityType = 'low' | 'medium' | 'high';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string; // ISO date string e.g. "2026-11-10"
  tool?: string; // e.g. "Canva", "Midjourney", "Printify", "CapCut", "ElevenLabs", "Cursor", "Figma", "TMDB"
  priority?: PriorityType;
  notes?: string;
}

export interface AudioNote {
  id: string;
  transcript: string;
  audioUrl?: string; // If we store to Firebase Storage later
  createdAt: string;
}

export interface YouTubeStudioOutput {
  thumbnailConcepts20: VisualConceptItem[];
  first30sHook: string;
  scriptOutline: { section: string; duration: string; bulletPoints: string[] }[];
  seoTitlesAndTags: { titles: string[]; tags: string[]; descriptionDraft: string };
  storyboard: { scene: number; visual: string; audio: string; onScreenText: string }[];
  generatedAt: string;
}

export interface AIAppStudioOutput {
  prd: { overview: string; keyFeatures: string[]; userStories: string[]; nonFunctionalReqs: string[] };
  wireframeFlow: { screen: string; components: string[]; userActions: string }[];
  techStackArchitecture: { frontend: string; backend: string; aiModels: string; db: string; deployment: string };
  gtmStrategy: { launchChannels: string[]; pricingModel: string; initialTargetUsers: string };
  generatedAt: string;
}

export interface IndonesiaStudioOutput {
  shopeeListing: { title: string; description: string; category: string; tags: string[]; priceIdr: string };
  tokopediaHashtags: string[];
  localTrendAngle: string;
  bahasaCampaignCopy: string;
  generatedAt: string;
}

export interface DomainSpecifics {
  // Etsy POD specifics
  niche?: string;
  productType?: string;
  targetAudience?: string;
  tags?: string[];
  designConcept?: string;
  competitionInsight?: string;

  // YouTube Automation specifics
  titleIdeas?: string[];
  first30sHook?: string;
  scriptOutline?: string[];
  automationWorkflow?: {
    voiceover?: string;
    visuals?: string;
    music?: string;
  };
  thumbnailConcept?: string;

  // AI Apps specifics
  problemStatement?: string;
  coreSolution?: string;
  targetPersona?: string;
  techStack?: {
    frontend?: string;
    backend?: string;
    aiEngine?: string;
    database?: string;
  };
  mvpFeatures?: string[];
  monetizationIdea?: string;

  // Legacy/Custom specifics (like the previous Indonesia idea)
  shopeeCategory?: string;
  tokopediaHashtags?: string[];
  targetCity?: string;
  localPriceIdr?: string;
  logisticsType?: string;
  bahasaCampaignBrief?: string;
}

export interface ActionPlan {
  summary: string;
  tags: string[];
  domainSpecifics: DomainSpecifics;
  checklist: ChecklistItem[];
  strategicNotes?: string;
  generatedAt: string;
}

export interface Reminder {
  id: string;
  dateTime: string; // ISO string e.g. "2026-11-03T10:00"
  note?: string;
  isCompleted?: boolean;
  notified?: boolean;
  createdAt: string;
}

// 1. Etsy Keyword & Data Priority System
export interface UserKeywordMetric {
  keyword: string;
  searchVolume: number;
  competitionResults: number;
  conversionRate: number; // e.g. 3.8 (%)
  source: 'user_keyword_data'; // Highest weight
  notes?: string;
}

export interface AiExternalMetric {
  keyword: string;
  estimatedVolume: string; // e.g. "10k - 20k/ay"
  competitionLevel: 'low' | 'medium' | 'high';
  trendDirection: 'up' | 'stable' | 'down';
  source: 'ai_web_research'; // Secondary weight
}

export interface DataPriorityComparison {
  userKeywords: UserKeywordMetric[];
  aiExternalKeywords: AiExternalMetric[];
  primaryWeightScore: number; // e.g. 85 (%) weight to user data
  strategicVerdict: string;
  opportunityRating: 'Cok Guclu' | 'Iyi' | 'Orta' | 'Riskli';
  analyzedAt: string;
}

export interface GroundingWebSource {
  title: string;
  uri: string;
}

export interface GroundedResearchResult {
  report: string;
  searchQueriesUsed: string[];
  groundingSources: GroundingWebSource[];
  marketTrend: string;
  recommendedAction: string;
  opportunityScore: number;
  analyzedAt: string;
  userKeywordPriorityNotice?: string;
}

// 2. Sub-Ideas & Niche Combination
export interface SubIdea {
  id: string;
  angle: string; // e.g. "Evlilik Teklifi Versiyonu"
  description: string;
  targetAudience: string;
  potential: 'high' | 'medium' | 'experimental';
  status: 'recommended' | 'pruned';
  rationale: string;
}

// 3. Complete Etsy Listing Draft
export interface EtsyListingDraft {
  title: string; // Up to 140 chars, keyword rich
  description: string; // Full structured listing description
  tags: string[]; // Exactly 13 tags
  targetAudience: string;
  suggestedPrice: {
    digitalDownload: string;
    unframedPoster: string;
    framedPoster: string;
    canvasOrSpecialty?: string;
    currency: string;
  };
  keyFeatures: string[];
  shippingAndProcessingNote?: string;
  readyToPaste: boolean;
  generatedAt: string;
}

export type VisualConceptType = 'hero' | 'product_design' | 'lifestyle_mockup' | 'infographic';

export interface VisualConceptItem {
  slot: number; // 1 to 20
  type: VisualConceptType;
  title: string;
  description: string;
  promptOrSpec: string; // Ready for Midjourney or Canva
  specs: string; // e.g. "300 DPI, 24x36 ratio" or "Infografik: Boyut tablosu"
  altText?: string;
}

// 5. Design Brief Automation
export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface DesignBrief {
  style: string;
  colorPalette: ColorSwatch[];
  typographySuggestions: {
    primaryFont: string;
    secondaryFont: string;
    pairingNotes: string;
  };
  compositionRules: string[];
  canvaPrompt: string;
  midjourneyPrompt: string;
  generatedAt: string;
}

// 6. Seasonal US Calendar & Countdown
export interface SeasonalCountdown {
  eventName: string;
  eventDate: string; // "2026-10-31"
  targetLaunchDate: string; // "2026-09-01" (2 months advance)
  startResearchDate: string; // "2026-08-01"
  startDesignDate: string; // "2026-08-15"
  daysUntilDeadline: number;
  proactiveIdea: string;
  urgencyStatus: 'upcoming' | 'urgent' | 'active_now' | 'past';
}

// 7. Maturity Score Breakdown (0 - 100)
export interface MaturityScoreBreakdown {
  score: number; // 0 to 100
  isReadyToPublish: boolean; // score === 100
  researchDone: boolean; // 20 pts
  listingDraftDone: boolean; // 25 pts
  visualConceptsDone: boolean; // 25 pts
  designBriefDone: boolean; // 15 pts
  subIdeasDone: boolean; // 15 pts
}

export interface IdeaItem {
  id: string;
  title: string;
  rawInput: string;
  domain: DomainType;
  status: StatusType;
  priority: PriorityType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  actionPlan?: ActionPlan;
  notes?: string;
  isFavorite?: boolean;
  reminder?: Reminder; // Backward compatibility
  reminders?: Reminder[]; // Multiple reminders support
  parentId?: string; // Relationship mapping
  audioNotes?: AudioNote[]; // Extra context via voice

  // New Etsy & Advanced Strategy capabilities
  userKeywords?: UserKeywordMetric[];
  dataComparison?: DataPriorityComparison;
  groundedResearch?: GroundedResearchResult;
  subIdeas?: SubIdea[];
  etsyListing?: EtsyListingDraft;
  visualConcepts?: VisualConceptItem[]; // 20 concepts
  designBrief?: DesignBrief;
  seasonalCountdown?: SeasonalCountdown;
  maturityScore?: number;

  // Domain-specific Studio Outputs
  youtubeStudio?: YouTubeStudioOutput;
  aiAppStudio?: AIAppStudioOutput;
  indonesiaStudio?: IndonesiaStudioOutput;
}

export interface Settings {
  apiKeys: string[];
  selectedModel: string; // e.g. "gemini-3-flash-preview"
  autoBackupEnabled: boolean;
  autoBackupIntervalMinutes: number;
  lastBackupTimestamp?: string;
  lastDriveBackupTimestamp?: string;
  isDriveBackupEnabled: boolean;
}

export interface BackupItem {
  timestamp: string;
  count: number;
  dataJson: string;
}

export type ViewMode = 'kanban' | 'list' | 'timeline' | 'insights' | 'us_calendar';

export interface WorkspaceConfig {
  id: DomainType | 'all';
  name: string;
  label: string;
  shortLabel: string;
  description: string;
  accentClass: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
}

