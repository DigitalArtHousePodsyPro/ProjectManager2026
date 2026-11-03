import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Download, Upload, RotateCcw, Save, Plus, Trash2, Check, AlertCircle, RefreshCw, Database, Globe, Copy } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Settings, BackupItem, IdeaItem } from '../types';
import { getSettings, saveSettings, getBackupHistory, createLocalBackupSnapshot, downloadJsonFile, exportAllDataAsJson, importDataFromJson } from '../services/backupService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: IdeaItem[];
  onRestoreIdeas: (ideas: IdeaItem[]) => void;
  user: User | null;
  accessToken: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  ideas,
  onRestoreIdeas,
  user,
  accessToken
}) => {
  const [settings, setSettingsState] = useState<Settings>(getSettings());
  const [newApiKey, setNewApiKey] = useState('');
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = () => {
    const sql = `-- OmniFocus Supabase Database Tables
create table if not exists ideas (
  id text primary key,
  user_id text not null,
  title text,
  raw_input text,
  domain text,
  status text,
  priority text,
  tags text[],
  action_plan jsonb,
  grounded_research jsonb,
  sub_ideas jsonb,
  etsy_listing jsonb,
  visual_concepts jsonb,
  design_brief jsonb,
  maturity_score integer,
  is_favorite boolean default false,
  parent_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists keywords (
  id text primary key,
  user_id text not null,
  keyword text not null,
  search_volume integer,
  search_result integer,
  conversion_rate numeric,
  uploaded_at timestamptz default now(),
  weight numeric default 1.0
);

create table if not exists pipeline_logs (
  id text primary key,
  idea_id text not null,
  user_id text not null,
  step text not null,
  status text not null,
  error text,
  created_at timestamptz default now()
);

create table if not exists seasonal_automation_log (
  id text primary key,
  user_id text not null,
  event_name text not null,
  triggered_at timestamptz default now()
);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      setSettingsState(getSettings());
      setBackups(getBackupHistory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddKey = () => {
    if (!newApiKey.trim()) return;
    const updated = [...settings.apiKeys, newApiKey.trim()];
    const newSettings = { ...settings, apiKeys: updated };
    setSettingsState(newSettings);
    saveSettings(newSettings);
    setNewApiKey('');
  };

  const handleRemoveKey = (index: number) => {
    const updated = settings.apiKeys.filter((_, i) => i !== index);
    const newSettings = { ...settings, apiKeys: updated };
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleManualBackupNow = () => {
    createLocalBackupSnapshot(ideas);
    setBackups(getBackupHistory());
    setSettingsState(getSettings());
  };

  const handleExportJson = () => {
    exportAllDataAsJson(ideas);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importDataFromJson(text);
        if (Array.isArray(imported) && imported.length > 0) {
          onRestoreIdeas(imported);
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Dosya içinde fikir bulunamadı.');
        }
      } catch (err: any) {
        setImportError(err.message || 'JSON dosyası okunamadı.');
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreFromBackup = (backup: BackupItem) => {
    try {
      const imported = importDataFromJson(backup.dataJson);
      onRestoreIdeas(imported);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err: any) {
      setImportError(err.message || 'Yedek yüklenirken hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ayarlar & Veri Güvenliği</h2>
              <p className="text-xs text-slate-400">API Anahtar Havuzu, Gemini Model & Otomatik Yedekleme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: API Key Pool & Model */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Gemini API Anahtar Havuzu (Sıralı Rotasyon)</h3>
              </div>
              <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Sıralı (Round-Robin) Kullanım
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Birden fazla API anahtarı ekleyebilirsiniz. Sistem her yapay zeka işleminde sıradaki anahtarı otomatik kullanır. Kota aşımında diğeri devreye girer.
            </p>

            {/* Key List */}
            <div className="space-y-2">
              {settings.apiKeys.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 italic">
                  Henüz özel API anahtarı eklenmedi. Sistem sunucu varsayılan API anahtarını kullanır.
                </div>
              ) : (
                settings.apiKeys.map((key, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 font-mono text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-amber-400 font-bold">
                        {idx + 1}
                      </span>
                      <span>{key.slice(0, 8)}••••••••••••{key.slice(-4)}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveKey(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Anahtarı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Key Input */}
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Yeni Gemini API Key (AIzaSy...)"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddKey}
                disabled={!newApiKey.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>

            {/* Model Selection */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <label className="text-xs text-slate-300 font-medium">Varsayılan Model:</label>
              <select
                value={settings.selectedModel}
                onChange={(e) => setSettingsState({ ...settings, selectedModel: e.target.value })}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-indigo-300 focus:outline-none font-mono"
              >
                <option value="gemini-3-flash-preview">gemini-3-flash-preview (Önerilen)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash</option>
              </select>
            </div>
          </div>

          {/* Section 2: Data Loss Prevention & Auto Backups */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Otomatik Yerel Yedekleme & Veri Koruma</h3>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Sıfır Veri Kaybı Garantisi
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-white">Otomatik Periyodik Snapshots</span>
                <p className="text-slate-400 text-[11px]">Tarayıcı temizlense bile son yedeklerinize anında erişin.</p>
              </div>
              <button
                onClick={handleManualBackupNow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Şimdi Anlık Yedek Al</span>
              </button>
            </div>

            {/* Quick Export & Import Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Tüm Verileri JSON İndir</span>
              </button>

              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>JSON Dosyasından Yükle</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {importSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Veriler başarıyla yüklendi ve güncellendi!</span>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{importError}</span>
              </div>
            )}

            {/* Backup History */}
            {backups.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400">Yedekleme Geçmişi (Son {backups.length} Anlık Görüntü)</h4>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {backups.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                      <div className="text-slate-300">
                        <span className="font-mono">{new Date(b.timestamp).toLocaleString('tr-TR')}</span>
                        <span className="ml-2 text-slate-500">({b.count} fikir)</span>
                      </div>
                      <button
                        onClick={() => handleRestoreFromBackup(b)}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Geri Yükle</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Supabase Integration */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Supabase Veritabanı Durumu</h3>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                Doğrudan Erişim Aktif
              </span>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Proje Adresi:</span>
                <span className="font-mono text-emerald-400 font-medium">wwpmyscfemmvnncnvyur.supabase.co</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Çalışma Modu:</span>
                <span className="text-slate-200">Kullanıcı Girişi Olmadan Doğrudan Çalışma</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-400 max-w-xs">
                Yeni projede tablolar henüz açılmadıysa SQL kodunu kopyalayıp Supabase SQL Editor'de çalıştırabilirsiniz.
              </p>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Kopyalandı!' : 'SQL Kodunu Kopyala'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Google Drive Sync */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Google Drive Bulut Senkronizasyonu</h3>
              </div>
              {settings.isDriveBackupEnabled ? (
                <span className="text-[11px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  Bulut Yedekleme Aktif
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Pasif
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Verilerinizi her gün otomatik olarak Google Drive'ınıza (omnifocus_backup_*.json) yedekleyin. Cihaz değiştirseniz bile verileriniz güvende.
            </p>

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${settings.isDriveBackupEnabled ? 'bg-sky-600' : 'bg-slate-700'}`}
                     onClick={() => setSettingsState({ ...settings, isDriveBackupEnabled: !settings.isDriveBackupEnabled })}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.isDriveBackupEnabled ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-xs text-slate-200 font-medium">Günlük Otomatik Drive Yedeği</span>
              </div>
              
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Son Bulut Senk:</div>
                <div className="text-[11px] font-mono text-slate-300">
                  {settings.lastDriveBackupTimestamp ? new Date(settings.lastDriveBackupTimestamp).toLocaleDateString('tr-TR') : 'Hiç yedeklenmedi'}
                </div>
              </div>
            </div>

            {!accessToken && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-[11px] flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Drive yedeklemesi için oturum açarken "Google Drive dosyalarını görüntüleme ve yönetme" izni vermeniz gerekir.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <div className="text-xs text-slate-400">
            {settings.lastBackupTimestamp ? (
              <span>Son Yedek: {new Date(settings.lastBackupTimestamp).toLocaleTimeString('tr-TR')}</span>
            ) : (
              <span>Otomatik yerel koruma aktif.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saveSuccess ? 'Kaydedildi!' : 'Kaydet'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
