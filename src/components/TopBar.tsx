import { Mic, Plus, Sparkles, Download, Layers, Bell, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { DomainType } from '../types';

interface TopBarProps {
  onOpenQuickCapture: () => void;
  onOpenExport: () => void;
  onOpenSettings?: () => void;
  totalIdeasCount: number;
  activeDomain: DomainType | 'all';
  pendingRemindersCount?: number;
  onSignOut?: () => void;
  userEmail?: string | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenQuickCapture,
  onOpenExport,
  onOpenSettings,
  totalIdeasCount,
  activeDomain,
  pendingRemindersCount = 0,
  onSignOut,
  userEmail
}) => {
  const domainLabels: Record<string, string> = {
    all: 'Tüm Projeler',
    etsy_pod: 'Etsy Products',
    youtube_automation: 'YouTube',
    indonesia: 'Indonesia',
    ai_apps: 'AI Apps'
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      {/* Zone 1: Single text element brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="text-base font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-sm">
            Ω
          </span>
          <span>OmniFocus <span className="text-slate-400 font-normal">Idea OS</span></span>
        </a>
      </div>

      {/* Zone 2: Navigation & Context Breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
        <span className="text-slate-500">Calisma Alani</span>
        <span aria-hidden="true" className="text-slate-600">/</span>
        <span className="text-slate-200 font-medium">{domainLabels[activeDomain]}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="font-mono tabular-nums text-slate-400">{totalIdeasCount} aktif fikir</span>
      </div>

      {/* Zone 3: Primary Action buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        {pendingRemindersCount > 0 && (
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg"
            title={`${pendingRemindersCount} adet aktif hatırlatıcı zamanlanmış`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono tabular-nums">{pendingRemindersCount}</span>
            <span className="hidden lg:inline text-slate-400">hatırlatıcı</span>
          </div>
        )}

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          title="Verileri Dışarı Aktar / Yedekle"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Dışarı Aktar</span>
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Ayarlar & Gemini Key Havuzu"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Ayarlar</span>
          </button>
        )}

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title={`Çıkış Yap (${userEmail || 'Oturum'})`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Çıkış</span>
          </button>
        )}

        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer font-semibold"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Hızlı Fikir / Sesli Not</span>
          <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] font-mono bg-amber-500/30 text-slate-950 rounded border border-amber-500/40">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};

