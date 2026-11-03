import { supabase } from '../lib/supabase';
import { SeasonalCountdown } from '../types';

export interface SeasonalAutomationLog {
  id: string;
  user_id: string;
  event_name: string;
  triggered_at: string;
}

export const logSeasonalAutomation = async (userId: string, eventName: string) => {
  try {
    const logId = `seasonal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const { error } = await supabase.from('seasonal_automation_log').upsert({
      id: logId,
      user_id: userId,
      event_name: eventName,
      triggered_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('Could not log seasonal automation to Supabase:', error);
    }
  } catch (err) {
    console.warn('Seasonal automation log exception:', err);
  }
};

export const fetchSeasonalAutomationLogs = async (userId: string): Promise<SeasonalAutomationLog[]> => {
  try {
    const { data, error } = await supabase
      .from('seasonal_automation_log')
      .select('*')
      .eq('user_id', userId)
      .order('triggered_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SeasonalAutomationLog[];
  } catch (err) {
    console.error('Error fetching seasonal logs from Supabase:', err);
    return [];
  }
};

export const US_SEASONAL_EVENTS: Array<{ name: string; date: string; category: string }> = [
  { name: "Valentine's Day", date: '2026-02-14', category: 'Romantic & Gifts' },
  { name: "Mother's Day", date: '2026-05-10', category: 'Family & Custom Gifts' },
  { name: "Father's Day", date: '2026-06-21', category: 'Family & Custom Apparel' },
  { name: "4th of July (Independence Day)", date: '2026-07-04', category: 'Patriotic & Summer' },
  { name: "Back to School", date: '2026-08-15', category: 'Kids, Teachers & Stationary' },
  { name: "Halloween", date: '2026-10-31', category: 'Spooky, Costumes & Home Decor' },
  { name: "Thanksgiving", date: '2026-11-26', category: 'Autumn, Gratitude & Dining' },
  { name: "Christmas & Holiday Season", date: '2026-12-25', category: 'Q4 Golden Quarter Mega Gifting' },
];

export const checkAndTriggerSeasonalAlerts = async (
  userId: string,
  onAlert?: (event: { name: string; daysLeft: number; deadline: string }) => void
) => {
  const now = new Date();
  for (const ev of US_SEASONAL_EVENTS) {
    const eventDate = new Date(ev.date);
    // 60 days before event is the optimal design/launch deadline
    const launchDeadline = new Date(eventDate);
    launchDeadline.setDate(launchDeadline.getDate() - 60);

    const diffDays = Math.ceil((launchDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 30) {
      // Approaching or in urgent preparation window!
      await logSeasonalAutomation(userId, `${ev.name} (Deadline in ${diffDays} days)`);
      onAlert?.({
        name: ev.name,
        daysLeft: diffDays,
        deadline: launchDeadline.toLocaleDateString('tr-TR'),
      });
    }
  }
};
