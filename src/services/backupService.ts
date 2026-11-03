import { IdeaItem, Settings, BackupItem } from '../types';

const SETTINGS_KEY = 'omnifocus_settings_v1';
const BACKUPS_KEY = 'omnifocus_backups_v1';
const MAX_BACKUPS = 10;

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        apiKeys: Array.isArray(parsed.apiKeys) ? parsed.apiKeys : [],
        selectedModel: parsed.selectedModel || 'gemini-3-flash-preview',
        autoBackupEnabled: parsed.autoBackupEnabled !== false,
        autoBackupIntervalMinutes: parsed.autoBackupIntervalMinutes || 1,
        lastBackupTimestamp: parsed.lastBackupTimestamp,
        lastDriveBackupTimestamp: parsed.lastDriveBackupTimestamp,
        isDriveBackupEnabled: !!parsed.isDriveBackupEnabled,
      };
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }

  return {
    apiKeys: [],
    selectedModel: 'gemini-3-flash-preview',
    autoBackupEnabled: true,
    autoBackupIntervalMinutes: 1,
    isDriveBackupEnabled: false,
  };
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function createLocalBackupSnapshot(ideas: IdeaItem[]): BackupItem {
  const timestamp = new Date().toISOString();
  const dataJson = JSON.stringify(ideas, null, 2);
  const backup: BackupItem = {
    timestamp,
    count: ideas.length,
    dataJson,
  };

  try {
    const existing = getBackupHistory();
    const updated = [backup, ...existing.filter((b) => b.timestamp !== timestamp)].slice(0, MAX_BACKUPS);
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(updated));

    // Update settings lastBackupTimestamp
    const currentSettings = getSettings();
    saveSettings({
      ...currentSettings,
      lastBackupTimestamp: timestamp,
    });
  } catch (e) {
    console.error('Error creating backup snapshot:', e);
  }

  return backup;
}

export function getBackupHistory(): BackupItem[] {
  try {
    const raw = localStorage.getItem(BACKUPS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error getting backup history:', e);
  }
  return [];
}

export function downloadJsonFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAllDataAsJson(ideas: IdeaItem[]): void {
  const backupData = {
    version: '3.0',
    exportedAt: new Date().toISOString(),
    totalIdeas: ideas.length,
    ideas,
  };
  const jsonStr = JSON.stringify(backupData, null, 2);
  const filename = `omnifocus_ideas_backup_${new Date().toISOString().slice(0, 10)}.json`;
  downloadJsonFile(filename, jsonStr);
}

export function importDataFromJson(jsonString: string): IdeaItem[] {
  const parsed = JSON.parse(jsonString);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && Array.isArray(parsed.ideas)) {
    return parsed.ideas;
  }
  throw new Error('Geçersiz JSON formatı. "ideas" dizisi bulunamadı.');
}
