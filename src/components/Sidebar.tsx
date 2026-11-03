import { ShoppingBag, Video, Cpu, LayoutGrid, Inbox, Search, Clock, CheckCircle2, Star, Sparkles, Globe, TrendingUp, Calendar } from 'lucide-react';
import { DomainType, StatusType, ViewMode } from '../types';

interface SidebarProps {
  activeDomain: DomainType | 'all';
  onSelectDomain: (domain: DomainType | 'all') => void;
  activeStatusFilter: StatusType | 'all';
  onSelectStatusFilter: (status: StatusType | 'all') => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  counts: {
    all: number;
    etsy_pod: number;
    youtube_automation: number;
    ai_apps: number;
    inbox: number;
    research: number;
    in_progress: number;
    completed: number;
    favorites: number;
  };
  onResetToRealProjects?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeDomain,
  onSelectDomain,
  activeStatusFilter,
  onSelectStatusFilter,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  viewMode,
  onSelectViewMode,
  counts,
  onResetToRealProjects
}) => {
  const workspaces = [
    {
      id: 'all' as const,
      label: 'Tüm Projeler',
      subtitle: 'Merkezi havuz & pipeline',
      icon: LayoutGrid,
      count: counts.all,
      accent: 'text-slate-300'
    },
    {
      id: 'etsy_pod' as const,
      label: '🛍️ Etsy Products',
      subtitle: 'Poster, takvim & mockup projeleri',
      icon: ShoppingBag,
      count: counts.etsy_pod,
      accent: 'text-amber-400'
    },
    {
      id: 'youtube_automation' as const,
      label: '📺 YouTube',
      subtitle: 'İtiraf, utanç & sorgu odası',
      icon: Video,
      count: counts.youtube_automation,
      accent: 'text-rose-400'
    },
    {
      id: 'ai_apps' as const,
      label: '⚡ AI Apps',
      subtitle: 'Otomasyon araçları & micro-SaaS',
      icon: Cpu,
      count: counts.ai_apps,
      accent: 'text-indigo-400'
    }
  ];

  const stages = [
    { id: 'all' as const, label: 'Tum Asamalar', icon: LayoutGrid, count: counts.all },
    { id: 'inbox' as const, label: 'Gelen Kutusu', icon: Inbox, count: counts.inbox },
    { id: 'research' as const, label: 'Arastirma & Niche', icon: Search, count: counts.research },
    { id: 'in_progress' as const, label: 'Uretimde', icon: Clock, count: counts.in_progress },
    { id: 'completed' as const, label: 'Tamamlandi', icon: CheckCircle2, count: counts.completed }
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between p-4 min-h-[calc(100vh-53px)] select-none">
      <div className="space-y-6">
        {/* Workspace Switcher */}
        <div>
          <div className="px-2.5 mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Is Alanlari
          </div>
          <div className="space-y-1">
            {workspaces.map((ws) => {
              const Icon = ws.icon;
              const isActive = activeDomain === ws.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => onSelectDomain(ws.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${ws.accent}`} />
                    <span className="truncate text-xs">{ws.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums ml-2 shrink-0">
                    {ws.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pipeline Stage Filters */}
        <div>
          <div className="px-2.5 mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Durum Filtresi
          </div>
          <div className="space-y-0.5">
            {stages.map((st) => {
              const Icon = st.icon;
              const isActive = activeStatusFilter === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStatusFilter(st.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-left text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/80 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{st.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Favorites shortcut */}
        <div className="pt-2 border-t border-slate-800/60 space-y-1">
          <button
            onClick={onToggleFavoritesOnly}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
              showFavoritesOnly
                ? 'bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
              <span>Yıldızlanan Projeler</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
              {counts.favorites}
            </span>
          </button>

          {/* Timeline shortcut */}
          <button
            onClick={() => onSelectViewMode(viewMode === 'timeline' ? 'kanban' : 'timeline')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700/80'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Zaman Çizelgesi</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500 tabular-nums">
              Eksen
            </span>
          </button>

          {/* Insights shortcut */}
          <button
            onClick={() => onSelectViewMode(viewMode === 'insights' ? 'kanban' : 'insights')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
              viewMode === 'insights'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-3.5 h-3.5 ${viewMode === 'insights' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Insights & Proje Hızı</span>
            </div>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              viewMode === 'insights' ? 'bg-amber-500/30 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              Grafik
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-800/60">
        {onResetToRealProjects && (
          <button
            onClick={() => {
              if (confirm('Tüm projeler başlangıçtaki 21 gerçek projenize sıfırlansın mı?')) {
                onResetToRealProjects();
              }
            }}
            className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1.5 rounded hover:bg-slate-800/40 cursor-pointer"
            title="21 gerçek projeyi varsayılan durumuna geri yükler"
          >
            <span>↺</span>
            <span>21 Gerçek Projeyi Sıfırla</span>
          </button>
        )}

        {/* Solopreneur Workflow Tips Box */}
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Fikir Yakalama Prensibi</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Fikir aklına geldiği anda kaydet. Detaylı planlama için Gemini 3.8 Flash aksiyon planlayıcıyı çalıştır.
          </p>
        </div>
      </div>
    </aside>
  );
};
