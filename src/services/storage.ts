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

// LOCAL STORAGE CACHE HELPERS
export const getStoredIdeas = (): IdeaItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

const saveLocalIdea = (idea: IdeaItem) => {
  try {
    const list = getStoredIdeas();
    const index = list.findIndex(i => i.id === idea.id);
    if (index >= 0) {
      list[index] = idea;
    } else {
      list.unshift(idea);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }
};

const deleteLocalIdea = (ideaId: string) => {
  try {
    const list = getStoredIdeas().filter(i => i.id !== ideaId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage delete warning:', e);
  }
};

export const clearLocalStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// SUPABASE CRUD OPERATIONS WITH LOCAL FALLBACK
export const subscribeToIdeas = (userId: string, callback: (ideas: IdeaItem[]) => void) => {
  // 1. Immediately emit cached ideas for instant responsiveness
  const cached = getStoredIdeas();
  if (cached.length > 0) {
    callback(cached);
  }

  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        // If table doesn't exist yet or any connection notice, use cached
        console.warn('Supabase fetch ideas info:', error.message);
        callback(getStoredIdeas());
        return;
      }
      if (data && data.length > 0) {
        const ideas = data.map(rowToIdeaItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
        callback(ideas);
      } else if (cached.length > 0) {
        // Sync cached ideas to Supabase in the background
        for (const item of cached) {
          supabase.from('ideas').upsert(ideaItemToRow(userId, item)).then();
        }
        callback(cached);
      } else {
        callback([]);
      }
    } catch (err) {
      console.warn('Querying ideas fallback to local storage:', err);
      callback(getStoredIdeas());
    }
  };

  fetchIdeas();

  // Supabase Realtime channel subscription
  try {
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
  } catch {
    return () => {};
  }
};

export const saveIdeaToSupabase = async (userId: string, idea: IdeaItem) => {
  // Always update local cache first for zero latency
  saveLocalIdea(idea);

  try {
    const row = ideaItemToRow(userId, idea);
    const { data, error } = await supabase
      .from('ideas')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save note (saved to local cache):', error.message);
    }
    return data;
  } catch (err) {
    console.warn('Supabase save exception (persisted locally):', err);
  }
};

export const deleteIdeaFromSupabase = async (userId: string, ideaId: string) => {
  deleteLocalIdea(ideaId);

  try {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', ideaId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase delete notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase delete exception:', err);
  }
};

// Aliases for backwards compatibility
export const saveIdeaToFirebase = saveIdeaToSupabase;
export const deleteIdeaFromFirebase = deleteIdeaFromSupabase;

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
