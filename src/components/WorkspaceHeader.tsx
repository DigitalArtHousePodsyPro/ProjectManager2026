import { ShoppingBag, Video, Cpu, Globe, LayoutGrid, Search, Kanban, List, Plus, TrendingUp, Calendar } from 'lucide-react';
import { DomainType, ViewMode } from '../types';

interface WorkspaceHeaderProps {
  activeDomain: DomainType | 'all';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenQuickCapture: () => void;
  filteredCount: number;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  activeDomain,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onOpenQuickCapture,
  filteredCount
}) => {
  const domainInfo: Record<string, { title: string; desc: string; icon: any; color: string }> = {
    all: {
      title: 'Tüm Projeler & Fikir Havuzu',
      desc: 'Etsy, YouTube ve Endonezya projeleriniz için 21 gerçek projenin merkezi pipeline akışı.',
      icon: LayoutGrid,
      color: 'text-slate-300'
    },
    etsy_pod: {
      title: '🛍️ Etsy Products',
      desc: 'Posterler, takvimler, özel Spotify/albüm/film/araba tasarımları ve duvar kağıdı projeleri.',
      icon: ShoppingBag,
      color: 'text-amber-400'
    },
    youtube_automation: {
      title: '📺 YouTube Otomasyonu',
      desc: 'Utanç hikayeleri, gizli itiraflar ve interaktif sorgu odası polisiye dizisi.',
      icon: Video,
      color: 'text-rose-400'
    },
    indonesia: {
      title: '🌏 Indonesia',
      desc: 'Çocuklar için resimli Endonezya tarihi kitabı (Amazon KDP & dijital yayın).',
      icon: Globe,
      color: 'text-emerald-400'
    },
    ai_apps: {
      title: '⚡ AI Apps & Micro-SaaS',
      desc: 'Problem tanımı, teknoloji mimarisi, MVP yol haritası ve yapay zeka araçları.',
      icon: Cpu,
      color: 'text-indigo-400'
    }
  };

  const current = domainInfo[activeDomain] || domainInfo['all'];
  const Icon = current.icon;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
      {/* Title & Domain Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${current.color}`} />
          <h1 className="text-lg font-bold text-white tracking-tight">
            {current.title}
          </h1>
          <span className="font-mono text-xs tabular-nums text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {filteredCount}
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          {current.desc}
        </p>
      </div>

      {/* Interactive Controls Toolbar (Single-line controls) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Fikir, etiket veya not ara..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/80"
          />
        </div>

        {/* View Mode Toggle: Pano | Tablo | Zaman Çizelgesi | Insights */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Kanban Panosu"
          >
            <Kanban className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pano</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Kompakt Liste Tablosu"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablo</span>
          </button>
          <button
            onClick={() => onViewModeChange('timeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Kronolojik Zaman Çizelgesi"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zaman Çizelgesi</span>
          </button>
          <button
            onClick={() => onViewModeChange('insights')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              viewMode === 'insights'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Proje Hızı & İstatistik Analizi"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Insights</span>
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Fikir Ekle</span>
        </button>
      </div>
    </div>
  );
};
