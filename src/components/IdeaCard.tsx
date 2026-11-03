import React from 'react';
import { ShoppingBag, Video, Cpu, Globe, CheckSquare, ArrowRight, Star, Trash2, Sparkles, Tag, Bell } from 'lucide-react';
import { IdeaItem, StatusType, DomainType } from '../types';
import { calculateMaturityScore } from '../services/storage';

interface IdeaCardProps {
  idea: IdeaItem;
  onClick: () => void;
  onAdvanceStatus: (id: string, newStatus: StatusType) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onGeneratePlan: (idea: IdeaItem) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onClick,
  onAdvanceStatus,
  onToggleFavorite,
  onDelete,
  onGeneratePlan
}) => {
  const domainConfig: Record<DomainType, { label: string; icon: any; color: string }> = {
    etsy_pod: { label: 'Etsy POD', icon: ShoppingBag, color: 'text-amber-400' },
    youtube_automation: { label: 'YouTube', icon: Video, color: 'text-rose-400' },
    ai_apps: { label: 'AI App', icon: Cpu, color: 'text-indigo-400' },
    indonesia: { label: 'Indonesia', icon: Globe, color: 'text-emerald-400' }
  };

  const nextStatusMap: Record<StatusType, { next: StatusType; label: string } | null> = {
    inbox: { next: 'research', label: 'Arastirmaya Al' },
    research: { next: 'in_progress', label: 'Uretime Basla' },
    in_progress: { next: 'completed', label: 'Tamamla & Yayinla' },
    completed: null
  };

  const nextStatus = nextStatusMap[idea.status];
  const { icon: DomainIcon, color: domainColor, label: domainLabel } = domainConfig[idea.domain];

  // Checklist counts
  const totalTasks = idea.actionPlan?.checklist?.length || 0;
  const doneTasks = idea.actionPlan?.checklist?.filter(t => t.done).length || 0;
  const maturity = calculateMaturityScore(idea);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', idea.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onClick}
      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all duration-150 cursor-grab active:cursor-grabbing shadow-xs flex flex-col justify-between"
    >
      <div>
        {/* Top quiet metadata row (Zero-pill discipline: unboxed text with · separators) */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <DomainIcon className={`w-3.5 h-3.5 shrink-0 ${domainColor}`} />
            <span className={domainColor}>{domainLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-[11px] text-slate-500">
              {new Date(idea.createdAt).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
            </span>
            {idea.status === 'research' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[10px] text-sky-400 flex items-center gap-0.5 font-medium" title="Google Search Grounding (gemini-3.8-flash)">
                  <Globe className="w-2.5 h-2.5 shrink-0 text-sky-400" />
                  <span>{idea.groundedResearch ? 'Grounded Veri' : 'Araştırma'}</span>
                </span>
              </>
            )}
            {idea.reminder && !idea.reminder.isCompleted && (
              <>
                <span aria-hidden="true">·</span>
                <span 
                  className={`inline-flex items-center gap-1 font-mono text-[10px] ${
                    new Date(idea.reminder.dateTime).getTime() < Date.now()
                      ? 'text-rose-400 font-semibold'
                      : 'text-amber-400'
                  }`}
                  title={`Hatırlatıcı: ${new Date(idea.reminder.dateTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}`}
                >
                  <Bell className="w-2.5 h-2.5 shrink-0" />
                  <span>{new Date(idea.reminder.dateTime).toLocaleDateString('tr-TR', { month: 'numeric', day: 'numeric' })}</span>
                </span>
              </>
            )}
            <>
              <span aria-hidden="true">·</span>
              <span className={`text-[10px] font-bold font-mono ${maturity.isReadyToPublish ? 'text-emerald-400' : 'text-slate-400'}`} title="Olgunluk Skoru">
                %{maturity.score}
              </span>
            </>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onToggleFavorite(idea.id)}
              className="p-1 text-slate-500 hover:text-amber-400 transition-colors rounded cursor-pointer"
              title="Yildizla"
            >
              <Star className={`w-3.5 h-3.5 ${idea.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => onDelete(idea.id)}
              className="p-1 text-slate-600 hover:text-rose-400 transition-colors rounded opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Fikri Sil"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Title */}
        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug mb-1.5">
          {idea.title}
        </h3>

        {/* Raw snippet or summary */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {idea.actionPlan?.summary || idea.rawInput}
        </p>

        {/* Quiet tags list */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] text-slate-500">
            {idea.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="hover:text-slate-300 transition-colors">
                #{tag}
              </span>
            ))}
            {idea.tags.length > 3 && (
              <span className="text-slate-600 font-mono text-[10px]">
                +{idea.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Bottom: Checklist status & Next pipeline stage trigger */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
        {totalTasks > 0 ? (
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] tabular-nums">
            <CheckSquare className="w-3 h-3 text-emerald-500" />
            <span>{doneTasks}/{totalTasks} adim</span>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGeneratePlan(idea);
            }}
            className="flex items-center gap-1 text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors font-medium cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Plani Uret</span>
          </button>
        )}

        {nextStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStatus(idea.id, nextStatus.next);
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2 py-1 rounded transition-colors cursor-pointer"
            title={`${nextStatus.label} asamasina tasi`}
          >
            <span>{nextStatus.label}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
