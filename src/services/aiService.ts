import { DomainType, ActionPlan, YouTubeStudioOutput, AIAppStudioOutput, IndonesiaStudioOutput } from '../types';
import { getSettings } from './backupService';

function getHeaders(): Record<string, string> {
  const settings = getSettings();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const keys = [...(settings.apiKeys || [])];
  if (envKey && !keys.includes(envKey)) {
    keys.unshift(envKey);
  }
  if (keys.length > 0) {
    headers['x-gemini-api-keys'] = JSON.stringify(keys);
  }
  return headers;
}

export interface TransformResponse {
  title?: string;
  summary: string;
  tags?: string[];
  domainSpecifics: any;
  checklist?: { text: string; done: boolean; dueDate?: string; tool?: string; priority?: any; notes?: string }[];
  strategicNotes?: string;
}

export async function requestAiActionPlan(
  rawInput: string,
  domain: DomainType,
  currentTitle?: string
): Promise<ActionPlan> {
  const response = await fetch('/api/ai/transform', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ rawInput, domain, currentTitle }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Yapay zeka analiz servisine ulasilamadi.');
  }

  const data: TransformResponse = await response.json();

  const formattedChecklist = (data.checklist || []).map((item, index) => ({
    id: `chk-${Date.now()}-${index}`,
    text: item.text,
    done: !!item.done,
    dueDate: item.dueDate,
    tool: item.tool || 'Canva',
    priority: item.priority || 'medium',
    notes: item.notes,
  }));

  return {
    summary: data.summary || 'Aksiyon plani olusturuldu.',
    tags: Array.isArray(data.tags) ? data.tags : [],
    domainSpecifics: data.domainSpecifics || {},
    checklist: formattedChecklist,
    strategicNotes: data.strategicNotes,
    generatedAt: new Date().toISOString(),
  };
}

export async function requestAudioTranscription(
  audioBase64: string,
  mimeType: string = 'audio/webm'
): Promise<{ transcript: string; suggestedDomain?: DomainType; quickTitle?: string }> {
  const response = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ audioBase64, mimeType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ses transkripsiyon servisinde bir sorun olustu.');
  }

  return await response.json();
}

export async function requestResearchComparison(
  title: string,
  rawInput: string,
  userKeywords?: any[]
) {
  const response = await fetch('/api/ai/research-compare', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rawInput, userKeywords }),
  });
  if (!response.ok) {
    throw new Error('Pazar araştırma servisine ulaşılamadı.');
  }
  return await response.json();
}

export async function requestSubIdeas(
  title: string,
  rawInput: string,
  userKeywords?: any[],
  nicheHistory?: string[],
  domain?: string
) {
  const response = await fetch('/api/ai/sub-ideas', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rawInput, userKeywords, nicheHistory, domain }),
  });
  if (!response.ok) {
    throw new Error('Alt fikir motoruna ulaşılamadı.');
  }
  return await response.json();
}

export async function requestEtsyListing(
  title: string,
  rawInput: string,
  userKeywords?: any[],
  designConcept?: string,
  productType?: string
) {
  const response = await fetch('/api/ai/etsy-listing', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rawInput, userKeywords, designConcept, productType }),
  });
  if (!response.ok) {
    throw new Error('Etsy listeleme motoruna ulaşılamadı.');
  }
  return await response.json();
}

export async function requestVisualConcepts(
  title: string,
  rawInput: string,
  designConcept?: string,
  productType?: string,
  domain?: string
) {
  const response = await fetch('/api/ai/visual-concepts', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rawInput, designConcept, productType, domain }),
  });
  if (!response.ok) {
    throw new Error('20 Görsel konsept motoruna ulaşılamadı.');
  }
  return await response.json();
}

export async function requestDesignBrief(
  title: string,
  rawInput: string,
  productType?: string,
  domain?: string
) {
  const response = await fetch('/api/ai/design-brief', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rawInput, productType, domain }),
  });
  if (!response.ok) {
    throw new Error('Tasarım brief motoruna ulaşılamadı.');
  }
  return await response.json();
}

export async function requestSeasonalIdeas(
  eventName: string,
  eventDate: string
) {
  const response = await fetch('/api/ai/seasonal-ideas', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ eventName, eventDate }),
  });
  if (!response.ok) {
    throw new Error('Sezonluk takvim motoruna ulaşılamadı.');
  }
  return await response.json();
}

export async function requestGroundedResearch(
  title: string,
  rawInput: string,
  domain: string,
  userKeywords?: any[]
) {
  const response = await fetch('/api/ai/grounded-research', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rawInput, domain, userKeywords }),
  });
  if (!response.ok) {
    throw new Error('Google Search Grounding pazar araştırma servisine ulaşılamadı.');
  }
  return await response.json();
}

export async function requestYouTubeStudio(
  title: string,
  rawInput: string
): Promise<YouTubeStudioOutput> {
  const response = await fetch('/api/ai/youtube-studio', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rawInput }),
  });
  if (!response.ok) {
    throw new Error('YouTube Studio servisine ulaşılamadı.');
  }
  return await response.json();
}

export async function requestAIAppStudio(
  title: string,
  rawInput: string
): Promise<AIAppStudioOutput> {
  const response = await fetch('/api/ai/ai-app-studio', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rawInput }),
  });
  if (!response.ok) {
    throw new Error('AI App Studio servisine ulaşılamadı.');
  }
  return await response.json();
}

export async function requestIndonesiaStudio(
  title: string,
  rawInput: string
): Promise<IndonesiaStudioOutput> {
  const response = await fetch('/api/ai/indonesia-studio', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, rawInput }),
  });
  if (!response.ok) {
    throw new Error('Indonesia Studio servisine ulaşılamadı.');
  }
  return await response.json();
}

// Aliases for pipeline engine
export const requestEtsyListingDraft = requestEtsyListing;
export const requestVisualConcepts20 = requestVisualConcepts;
