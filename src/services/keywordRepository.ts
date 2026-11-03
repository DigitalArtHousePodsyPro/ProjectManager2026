import { supabase } from '../lib/supabase';
import { UserKeywordMetric } from '../types';

export interface KeywordRecord {
  id: string;
  user_id: string;
  keyword: string;
  search_volume: number;
  search_result: number;
  conversion_rate: number;
  uploaded_at: string;
  weight: number;
}

export const saveKeywordsToSupabase = async (
  userId: string,
  keywords: Array<Omit<KeywordRecord, 'user_id'> | Partial<KeywordRecord>>
) => {
  const rows = keywords.map((k) => ({
    id: k.id || `kw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    keyword: k.keyword || '',
    search_volume: Number(k.search_volume ?? (k as any).searchVolume ?? 0),
    search_result: Number(k.search_result ?? (k as any).competitionResults ?? 0),
    conversion_rate: Number(k.conversion_rate ?? (k as any).conversionRate ?? 0),
    uploaded_at: k.uploaded_at || new Date().toISOString(),
    weight: Number(k.weight ?? 1.0),
  }));

  try {
    const { data, error } = await supabase
      .from('keywords')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase keywords save notice:', error.message);
    }
    return data;
  } catch (err) {
    console.warn('Supabase keywords save exception:', err);
  }
};

export const saveKeywordsToFirebase = saveKeywordsToSupabase;

export const subscribeToKeywords = (
  userId: string,
  callback: (keywords: KeywordRecord[]) => void
) => {
  const fetchKeywords = async () => {
    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('user_id', userId)
        .order('search_volume', { ascending: false });

      if (error) {
        console.error('Error fetching keywords from Supabase:', error);
        return;
      }
      if (data) {
        callback(data as KeywordRecord[]);
      }
    } catch (err) {
      console.error('Failed to query keywords:', err);
    }
  };

  fetchKeywords();

  const channel = supabase
    .channel(`keywords_realtime_${userId}_${Math.random().toString(36).substring(2, 8)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'keywords',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        fetchKeywords();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const fetchRelevantKeywordsForIdea = async (
  userId: string,
  ideaText: string
): Promise<UserKeywordMetric[]> => {
  try {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('user_id', userId)
      .order('search_volume', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      return [];
    }

    const lowerIdea = (ideaText || '').toLowerCase();
    const words = lowerIdea.split(/[\s,.-]+/).filter((w) => w.length > 2);

    // Filter relevant keywords by checking if keyword matches words in ideaText
    const matched = data.filter((row: KeywordRecord) => {
      const kwLower = row.keyword.toLowerCase();
      if (lowerIdea.includes(kwLower)) return true;
      return words.some((w) => kwLower.includes(w));
    });

    const chosen = (matched.length > 0 ? matched : data.slice(0, 5)) as KeywordRecord[];

    return chosen.slice(0, 10).map((row) => ({
      keyword: row.keyword,
      searchVolume: Number(row.search_volume),
      competitionResults: Number(row.search_result),
      conversionRate: Number(row.conversion_rate),
      source: 'user_keyword_data',
      notes: `Depodan eşleşti (Ağırlık: ${row.weight || 1.0})`,
    }));
  } catch (err) {
    console.error('Error in fetchRelevantKeywordsForIdea:', err);
    return [];
  }
};

export const deleteKeyword = async (userId: string, id: string) => {
  const { error } = await supabase
    .from('keywords')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting keyword:', error);
    throw error;
  }
};
