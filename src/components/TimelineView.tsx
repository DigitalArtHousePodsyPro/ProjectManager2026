import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, ShoppingBag, Video, Globe, Cpu, 
  ArrowRight, CheckSquare, Star, ArrowUpDown, Filter, Sparkles, Bell 
} from 'lucide-react';
import { IdeaItem, DomainType, StatusType } from '../types';

interface TimelineViewProps {
  ideas: IdeaItem[];
  onSelectIdea: (idea: IdeaItem) => void;
  onAdvanceStatus: (id: string, newStatus: StatusType) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteIdea: (id: string) => void;
  onGeneratePlan: (idea: IdeaItem) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  ideas,
  onSelectIdea,
  onAdvanceStatus,
  onToggleFavorite,
  onDeleteIdea,
  onGeneratePlan
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const domainConfig: Record<DomainType, { label: string; icon: any; color: string; badge: string }> = {
    etsy_pod: { 
      label: 'Etsy POD', 
      icon: ShoppingBag, 
      color: 'text-amber-400',
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300' 
    },
    youtube_automation: { 
      label: 'YouTube', 
      icon: Video, 
      color: 'text-rose-400',
      badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300' 
    },
    indonesia: { 
      label: 'Indonesia', 
      icon: Globe, 
      color: 'text-emerald-400',
      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
    },
    ai_apps: { 
      label: 'AI App', 
      icon: Cpu, 
      color: 'text-indigo-400',
      badge: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' 
    }
  };

  const statusLabels: Record<StatusType, string> = {
    inbox: 'Gelen Kutusu',
    research: 'Araştırma & Niche',
    in_progress: 'Üretimde',
    completed: 'Tamamlandı'
  };

  const nextStatusMap: Record<StatusType, { next: StatusType; label: string } | null> = {
    inbox: { next: 'research', label: 'Araştırmaya Al' },
    research: { next: 'in_progress', label: 'Üretime Başla' },
    in_progress: { next: 'completed', label: 'Tamamla' },
    completed: null
  };

  // Group ideas by date string (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, IdeaItem[]> = {};

    ideas.forEach((idea) => {
      const dateStr = idea.createdAt.slice(0, 10);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(idea);
    });

    // Sort dates
    const dateKeys = Object.keys(groups).sort((a, b) => {
      const timeA = new Date(a).getTime();
      const timeB = new Date(b).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return dateKeys.map((dateKey) => {
      const items = groups[dateKey];
      const parsedDate = new Date(dateKey);
      const formattedDate = parsedDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Special contextual title for user's key project milestones
      let milestoneLabel = '';
      if (dateKey.includes('2026-11-02')) milestoneLabel = 'Bugün Eklenen Taze Fikirler';
      else if (dateKey.includes('2026-06-24')) milestoneLabel = 'Şehir & Botanik Tasarım Dalgası';
      else if (dateKey.includes('2026-05-30')) milestoneLabel = 'YouTube Hikayeleri & Endonezya Kitabı';
      else if (dateKey.includes('2026-05-05')) milestoneLabel = 'İçerik Üretici Ödül Projesi';
      else if (dateKey.includes('2026-05-04')) milestoneLabel = 'Büyük Etsy Bestseller Koleksiyonu';

      return {
        dateKey,
        formattedDate,
        milestoneLabel,
        items,
        count: items.length
      };
    });
  }, [ideas, sortOrder]);

  const maxGroupCount = useMemo(() => {
    return Math.max(...groupedByDate.map((g) => g.count), 1);
  }, [groupedByDate]);

  if (ideas.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl">
        Zaman çizelgesinde görüntülenecek proje bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Timeline Control Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Kronolojik Gelişim Çizelgesi</h2>
            <p className="text-xs text-slate-400">
              Oluşturulma tarihine göre projelerinizin zaman içindeki üretim ivmesi ve yoğunluğu
            </p>
          </div>
        </div>

        {/* Sort & Order controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortOrder === 'desc' ? 'En Yeniden Eskiye' : 'Kronolojik (Eskiden Yeniye)'}</span>
          </button>
        </div>
      </div>

      {/* Vertical Spine Timeline */}
      <div className="relative pl-6 md:pl-10 space-y-12 before:absolute before:left-3 md:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-slate-700 before:to-indigo-500">
        {groupedByDate.map((group) => {
          const densityPercent = Math.round((group.count / maxGroupCount) * 100);

          return (
            <div key={group.dateKey} className="relative space-y-4">
              {/* Timeline Node Marker */}
              <div className="absolute -left-6 md:-left-10 top-0.5 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-md">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
              </div>

              {/* Date Header & Density Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-white tracking-tight">
                    {group.formattedDate}
                  </span>
                  {group.milestoneLabel && (
                    <span className="text-xs text-amber-400/90 font-medium">
                      · {group.milestoneLabel}
                    </span>
                  )}
                </div>

                {/* Density Bar */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Yoğunluk:</span>
                    <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" 
                        style={{ width: `${densityPercent}%` }} 
                      />
                    </div>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-slate-300 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {group.count} proje
                  </span>
                </div>
              </div>

              {/* Items Cards Grid for This Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {group.items.map((idea) => {
                  const { icon: DomainIcon, color, badge } = domainConfig[idea.domain];
                  const nextStatus = nextStatusMap[idea.status];
                  const totalTasks = idea.actionPlan?.checklist?.length || 0;
                  const doneTasks = idea.actionPlan?.checklist?.filter(t => t.done).length || 0;

                  return (
                    <div
                      key={idea.id}
                      onClick={() => onSelectIdea(idea)}
                      className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all duration-150 cursor-pointer shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Quiet Domain + Priority Header */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 font-medium truncate">
                            <DomainIcon className={`w-3.5 h-3.5 ${color}`} />
                            <span className={color}>{domainConfig[idea.domain].label}</span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {statusLabels[idea.status]}
                            </span>
                            {idea.reminder && !idea.reminder.isCompleted && (
                              <>
                                <span aria-hidden="true" className="text-slate-600">·</span>
                                <span 
                                  className={`inline-flex items-center gap-1 font-mono text-[10px] ${
                                    new Date(idea.reminder.dateTime).getTime() < Date.now()
                                      ? 'text-rose-400 font-semibold'
                                      : 'text-amber-400'
                                  }`}
                                  title={`Hatırlatıcı: ${new Date(idea.reminder.dateTime).toLocaleString('tr-TR')}`}
                                >
                                  <Bell className="w-2.5 h-2.5 shrink-0" />
                                  <span>{new Date(idea.reminder.dateTime).toLocaleDateString('tr-TR', { month: 'numeric', day: 'numeric' })}</span>
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onToggleFavorite(idea.id)}
                              className="text-slate-600 hover:text-amber-400 transition-colors cursor-pointer"
                            >
                              <Star className={`w-3.5 h-3.5 ${idea.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                          {idea.title}
                        </h4>

                        {/* Summary / Raw */}
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {idea.actionPlan?.summary || idea.rawInput}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        {totalTasks > 0 ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 tabular-nums">
                            <CheckSquare className="w-3 h-3 text-emerald-400" />
                            <span>{doneTasks}/{totalTasks}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {idea.priority === 'high' ? '🔥 Yüksek' : 'Normal'}
                          </span>
                        )}

                        {nextStatus && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdvanceStatus(idea.id, nextStatus.next);
                            }}
                            className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            <span>{nextStatus.label}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
