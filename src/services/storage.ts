import { IdeaItem, DomainType, StatusType, MaturityScoreBreakdown } from '../types';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'omnifocus_ideas_v3';

export const calculateMaturityScore = (idea: IdeaItem): MaturityScoreBreakdown => {
  let score = 0;
  const breakdown: MaturityScoreBreakdown = {
    score: 0,
    isReadyToPublish: false,
    researchDone: !!(idea.groundedResearch || idea.dataComparison),
    listingDraftDone: !!idea.etsyListing,
    visualConceptsDone: !!(idea.visualConcepts && idea.visualConcepts.length >= 10),
    designBriefDone: !!idea.designBrief,
    subIdeasDone: !!(idea.subIdeas && idea.subIdeas.length > 0),
  };

  if (breakdown.researchDone) score += 20;
  if (breakdown.listingDraftDone) score += 25;
  if (breakdown.visualConceptsDone) score += 25;
  if (breakdown.designBriefDone) score += 15;
  if (breakdown.subIdeasDone) score += 15;

  breakdown.score = score;
  breakdown.isReadyToPublish = score >= 100;
  return breakdown;
};

// Row converters for Supabase snake_case schema
export function ideaItemToRow(userId: string, idea: IdeaItem) {
  const actionPlanMerged = idea.actionPlan ? {
    ...idea.actionPlan,
    notes: idea.notes,
    reminders: idea.reminders,
    youtubeStudio: idea.youtubeStudio,
    aiAppStudio: idea.aiAppStudio,
    indonesiaStudio: idea.indonesiaStudio,
    dataComparison: idea.dataComparison,
  } : (idea.notes || idea.reminders || idea.youtubeStudio || idea.aiAppStudio ? {
    summary: '',
    tags: idea.tags || [],
    domainSpecifics: {},
    checklist: [],
    generatedAt: new Date().toISOString(),
    notes: idea.notes,
    reminders: idea.reminders,
    youtubeStudio: idea.youtubeStudio,
    aiAppStudio: idea.aiAppStudio,
    indonesiaStudio: idea.indonesiaStudio,
    dataComparison: idea.dataComparison,
  } : null);

  return {
    id: idea.id,
    user_id: userId,
    title: idea.title || '',
    raw_input: idea.rawInput || '',
    domain: idea.domain || 'etsy_pod',
    status: idea.status || 'inbox',
    priority: idea.priority || 'medium',
    tags: Array.isArray(idea.tags) ? idea.tags : [],
    action_plan: actionPlanMerged,
    grounded_research: idea.groundedResearch || null,
    sub_ideas: idea.subIdeas || null,
    etsy_listing: idea.etsyListing || null,
    visual_concepts: idea.visualConcepts || null,
    design_brief: idea.designBrief || null,
    maturity_score: typeof idea.maturityScore === 'number' ? idea.maturityScore : calculateMaturityScore(idea).score,
    is_favorite: !!idea.isFavorite,
    parent_id: idea.parentId || null,
    created_at: idea.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function rowToIdeaItem(row: any): IdeaItem {
  const actionPlan = row.action_plan || undefined;
  return {
    id: row.id,
    title: row.title || '',
    rawInput: row.raw_input || '',
    domain: row.domain || 'etsy_pod',
    status: row.status || 'inbox',
    priority: row.priority || 'medium',
    tags: Array.isArray(row.tags) ? row.tags : [],
    actionPlan: actionPlan ? {
      summary: actionPlan.summary || '',
      tags: actionPlan.tags || [],
      domainSpecifics: actionPlan.domainSpecifics || {},
      checklist: actionPlan.checklist || [],
      strategicNotes: actionPlan.strategicNotes,
      generatedAt: actionPlan.generatedAt || row.updated_at || '',
    } : undefined,
    notes: actionPlan?.notes || row.notes || undefined,
    reminders: actionPlan?.reminders || undefined,
    youtubeStudio: actionPlan?.youtubeStudio || undefined,
    aiAppStudio: actionPlan?.aiAppStudio || undefined,
    indonesiaStudio: actionPlan?.indonesiaStudio || undefined,
    dataComparison: actionPlan?.dataComparison || undefined,
    groundedResearch: row.grounded_research || undefined,
    subIdeas: row.sub_ideas || undefined,
    etsyListing: row.etsy_listing || undefined,
    visualConcepts: row.visual_concepts || undefined,
    designBrief: row.design_brief || undefined,
    maturityScore: typeof row.maturity_score === 'number' ? row.maturity_score : undefined,
    isFavorite: !!row.is_favorite,
    parentId: row.parent_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// SUPABASE CRUD OPERATIONS
export const subscribeToIdeas = (userId: string, callback: (ideas: IdeaItem[]) => void) => {
  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching ideas from Supabase:', error);
        return;
      }
      if (data) {
        callback(data.map(rowToIdeaItem));
      }
    } catch (err) {
      console.error('Failed to query ideas from Supabase:', err);
    }
  };

  // Initial load
  fetchIdeas();

  // Supabase Realtime channel subscription
  const channel = supabase
    .channel(`ideas_realtime_${userId}_${Math.random().toString(36).substring(2, 9)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ideas',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        fetchIdeas();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const saveIdeaToSupabase = async (userId: string, idea: IdeaItem) => {
  const row = ideaItemToRow(userId, idea);
  const { data, error } = await supabase
    .from('ideas')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('Supabase save error:', error);
    throw error;
  }
  return data;
};

export const deleteIdeaFromSupabase = async (userId: string, ideaId: string) => {
  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', ideaId)
    .eq('user_id', userId);

  if (error) {
    console.error('Supabase delete error:', error);
    throw error;
  }
};

// Aliases for backwards compatibility
export const saveIdeaToFirebase = saveIdeaToSupabase;
export const deleteIdeaFromFirebase = deleteIdeaFromSupabase;

// LOCAL STORAGE FALLBACKS (Migration support)
export const getStoredIdeas = (): IdeaItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const clearLocalStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const REAL_USER_PROJECTS: IdeaItem[] = [];

export const exportIdeasToMarkdown = (ideas: IdeaItem[], domainFilter: DomainType | 'all' = 'all') => {
  const filtered = domainFilter === 'all' ? ideas : ideas.filter(i => i.domain === domainFilter);
  let md = `# OmniFocus Projeleri - ${new Date().toLocaleDateString('tr-TR')}\n\n`;
  
  filtered.forEach(i => {
    md += `## ${i.title}\n`;
    md += `- **Durum:** ${i.status}\n`;
    md += `- **Domain:** ${i.domain}\n`;
    md += `- **Ham Not:** ${i.rawInput}\n\n`;
    if (i.actionPlan) {
      md += `### Aksiyon Planı\n${i.actionPlan.summary}\n\n`;
      md += `#### Görevler\n`;
      i.actionPlan.checklist.forEach(c => {
        md += `- [${c.done ? 'x' : ' '}] ${c.text}${c.tool ? ` (@${c.tool})` : ''}\n`;
      });
      md += `\n`;
    }
    if (i.etsyListing) {
      md += `### Etsy Listing\n`;
      md += `**Title:** ${i.etsyListing.title}\n\n`;
      md += `**Tags:** ${i.etsyListing.tags.join(', ')}\n\n`;
    }
    md += `---\n\n`;
  });
  return md;
};

export const exportIdeasToCsv = (ideas: IdeaItem[], domainFilter: DomainType | 'all' = 'all') => {
  const filtered = domainFilter === 'all' ? ideas : ideas.filter(i => i.domain === domainFilter);
  const headers = ['ID', 'Title', 'Domain', 'Status', 'CreatedAt', 'RawInput', 'Maturity'];
  const rows = filtered.map(i => [
    i.id,
    `"${(i.title || '').replace(/"/g, '""')}"`,
    i.domain,
    i.status,
    i.createdAt,
    `"${(i.rawInput || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    calculateMaturityScore(i).score
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};
