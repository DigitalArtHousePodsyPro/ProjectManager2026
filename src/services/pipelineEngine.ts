import { supabase } from '../lib/supabase';
import { IdeaItem } from '../types';
import { saveIdeaToSupabase } from './storage';
import { fetchRelevantKeywordsForIdea } from './keywordRepository';
import {
  requestAiActionPlan,
  requestGroundedResearch,
  requestSubIdeas,
  requestEtsyListingDraft,
  requestVisualConcepts20,
  requestDesignBrief
} from './aiService';

export interface PipelineLog {
  id: string;
  idea_id: string;
  user_id: string;
  step: string;
  status: 'started' | 'success' | 'failed';
  error: string | null;
  created_at: string;
}

export const logPipelineStep = async (
  ideaId: string,
  userId: string,
  step: string,
  status: 'started' | 'success' | 'failed',
  error?: string
) => {
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const { error: err } = await supabase.from('pipeline_logs').upsert({
      id: logId,
      idea_id: ideaId,
      user_id: userId,
      step,
      status,
      error: error || null,
      created_at: new Date().toISOString(),
    });
    if (err) {
      console.warn('Could not record pipeline log in Supabase:', err);
    }
  } catch (e) {
    console.warn('Pipeline log error:', e);
  }
};

export const fetchPipelineLogs = async (userId: string, ideaId?: string): Promise<PipelineLog[]> => {
  try {
    let query = supabase
      .from('pipeline_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ideaId) {
      query = query.eq('idea_id', ideaId);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;
    return (data || []) as PipelineLog[];
  } catch (err) {
    console.error('Failed to fetch pipeline logs:', err);
    return [];
  }
};

/**
 * Runs the automated full research & asset generation pipeline for an idea.
 * Saves progress at each step to Supabase 'ideas' and logs to 'pipeline_logs'.
 */
export const runFullPipelineForIdea = async (
  userId: string,
  initialIdea: IdeaItem,
  onProgress?: (stepName: string, progress: number) => void
): Promise<IdeaItem> => {
  let currentIdea: IdeaItem = { ...initialIdea };

  // Helper to persist intermediate state
  const persist = async () => {
    currentIdea.updatedAt = new Date().toISOString();
    await saveIdeaToSupabase(userId, currentIdea);
  };

  try {
    // -------------------------------------------------------------
    // Step 1: Action Plan
    // -------------------------------------------------------------
    onProgress?.('Aksiyon Planı Oluşturuluyor...', 15);
    await logPipelineStep(currentIdea.id, userId, 'action_plan', 'started');
    try {
      const plan = await requestAiActionPlan(
        currentIdea.rawInput,
        currentIdea.domain,
        currentIdea.title
      );
      currentIdea.actionPlan = plan;
      if (plan.tags && plan.tags.length > 0) {
        currentIdea.tags = Array.from(new Set([...currentIdea.tags, ...plan.tags]));
      }
      await persist();
      await logPipelineStep(currentIdea.id, userId, 'action_plan', 'success');
    } catch (err: any) {
      await logPipelineStep(currentIdea.id, userId, 'action_plan', 'failed', err.message);
    }

    // -------------------------------------------------------------
    // Step 2: Keywords & Grounded Research
    // -------------------------------------------------------------
    onProgress?.('Anahtar Kelime ve Pazar Araştırması...', 35);
    await logPipelineStep(currentIdea.id, userId, 'keyword_research', 'started');
    try {
      const relevantKeywords = await fetchRelevantKeywordsForIdea(
        userId,
        `${currentIdea.title} ${currentIdea.rawInput}`
      );
      if (relevantKeywords.length > 0) {
        currentIdea.userKeywords = relevantKeywords;
      }

      const research = await requestGroundedResearch(
        currentIdea.title,
        currentIdea.rawInput,
        currentIdea.domain,
        currentIdea.userKeywords
      );
      currentIdea.groundedResearch = research;
      currentIdea.status = 'research';
      await persist();
      await logPipelineStep(currentIdea.id, userId, 'keyword_research', 'success');
    } catch (err: any) {
      await logPipelineStep(currentIdea.id, userId, 'keyword_research', 'failed', err.message);
    }

    // -------------------------------------------------------------
    // Step 3: Sub-Ideas & Niche Kombinasyonları
    // -------------------------------------------------------------
    onProgress?.('Alt Fikirler ve Nişler Üretiliyor...', 55);
    await logPipelineStep(currentIdea.id, userId, 'sub_ideas', 'started');
    try {
      const subIdeas = await requestSubIdeas(
        currentIdea.title,
        currentIdea.rawInput,
        currentIdea.userKeywords,
        [],
        currentIdea.domain
      );
      currentIdea.subIdeas = subIdeas;
      await persist();
      await logPipelineStep(currentIdea.id, userId, 'sub_ideas', 'success');
    } catch (err: any) {
      await logPipelineStep(currentIdea.id, userId, 'sub_ideas', 'failed', err.message);
    }

    // -------------------------------------------------------------
    // Step 4: Listing Draft (or Studio Assets)
    // -------------------------------------------------------------
    onProgress?.('Etsy / Ürün Taslağı Hazırlanıyor...', 75);
    await logPipelineStep(currentIdea.id, userId, 'listing_draft', 'started');
    try {
      const listing = await requestEtsyListingDraft(
        currentIdea.title,
        currentIdea.rawInput,
        currentIdea.userKeywords,
        currentIdea.actionPlan?.domainSpecifics?.designConcept,
        currentIdea.actionPlan?.domainSpecifics?.productType
      );
      currentIdea.etsyListing = listing;
      await persist();
      await logPipelineStep(currentIdea.id, userId, 'listing_draft', 'success');
    } catch (err: any) {
      await logPipelineStep(currentIdea.id, userId, 'listing_draft', 'failed', err.message);
    }

    // -------------------------------------------------------------
    // Step 5: Visual Concepts & Design Brief
    // -------------------------------------------------------------
    onProgress?.('20 Görsel Konsept ve Tasarım Briefi...', 90);
    await logPipelineStep(currentIdea.id, userId, 'visual_and_brief', 'started');
    try {
      const [visuals, brief] = await Promise.all([
        requestVisualConcepts20(
          currentIdea.title,
          currentIdea.rawInput,
          currentIdea.actionPlan?.domainSpecifics?.designConcept,
          currentIdea.actionPlan?.domainSpecifics?.productType,
          currentIdea.domain
        ),
        requestDesignBrief(
          currentIdea.title,
          currentIdea.rawInput,
          currentIdea.actionPlan?.domainSpecifics?.productType,
          currentIdea.domain
        )
      ]);
      currentIdea.visualConcepts = visuals;
      currentIdea.designBrief = brief;
      currentIdea.status = 'in_progress';
      await persist();
      await logPipelineStep(currentIdea.id, userId, 'visual_and_brief', 'success');
    } catch (err: any) {
      await logPipelineStep(currentIdea.id, userId, 'visual_and_brief', 'failed', err.message);
    }

    onProgress?.('Pipeline Başarıyla Tamamlandı!', 100);
    return currentIdea;
  } catch (fatalError: any) {
    console.error('Fatal pipeline error:', fatalError);
    await logPipelineStep(currentIdea.id, userId, 'pipeline_fatal', 'failed', fatalError.message);
    return currentIdea;
  }
};
