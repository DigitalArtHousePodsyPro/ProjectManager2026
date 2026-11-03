import React from 'react';
import { ShoppingBag, Video, Cpu, Globe, Star, Trash2, ArrowRight, Sparkles, CheckSquare, Bell } from 'lucide-react';
import { IdeaItem, StatusType, DomainType } from '../types';
import { calculateMaturityScore } from '../services/storage';

interface ListViewProps {
  ideas: IdeaItem[];
  onSelectIdea: (idea: IdeaItem) => void;
  onAdvanceStatus: (id: string, newStatus: StatusType) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteIdea: (id: string) => void;
  onGeneratePlan: (idea: IdeaItem) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  ideas,
  onSelectIdea,
  onAdvanceStatus,
  onToggleFavorite,
  onDeleteIdea,
  onGeneratePlan
}) => {
  const domainConfig: Record<DomainType, { label: string; icon: any; color: string }> = {
    etsy_pod: { label: 'Etsy POD', icon: ShoppingBag, color: 'text-amber-400' },
    youtube_automation: { label: 'YouTube', icon: Video, color: 'text-rose-400' },
    ai_apps: { label: 'AI App', icon: Cpu, color: 'text-indigo-400' },
    indonesia: { label: 'Indonesia', icon: Globe, color: 'text-emerald-400' }
  };

  const statusLabels: Record<StatusType, string> = {
    inbox: 'Gelen Kutusu',
    research: 'Arastirma',
    in_progress: 'Uretimde',
    completed: 'Tamamlandi'
  };

  if (ideas.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl">
        Filtrelere uygun fikir bulunamadi.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium">
            <tr>
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4">Baslik & Fikir</th>
              <th className="py-3 px-4 w-36">Is Alani</th>
              <th className="py-3 px-4 w-32">Durum</th>
              <th className="py-3 px-4 w-28">Gorevler</th>
              <th className="py-3 px-4 w-20 text-center">Olgunluk</th>
              <th className="py-3 px-4 w-28 font-mono">Tarih</th>
              <th className="py-3 px-4 w-24 text-right">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {ideas.map((idea) => {
              const { icon: DomainIcon, color, label } = domainConfig[idea.domain];
              const totalTasks = idea.actionPlan?.checklist?.length || 0;
              const doneTasks = idea.actionPlan?.checklist?.filter(t => t.done).length || 0;

              return (
                <tr
                  key={idea.id}
                  onClick={() => onSelectIdea(idea)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleFavorite(idea.id)}
                      className="text-slate-600 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star className={`w-3.5 h-3.5 ${idea.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100 group-hover:text-amber-300 transition-colors truncate max-w-md">
                      {idea.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                      {idea.actionPlan?.summary || idea.rawInput}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium">
                      <DomainIcon className={`w-3.5 h-3.5 ${color}`} />
                      <span className={color}>{label}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                    <span className="text-[11px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                      {statusLabels[idea.status]}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-400">
                    {totalTasks > 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-emerald-500" />
                        <span>{doneTasks}/{totalTasks}</span>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGeneratePlan(idea);
                        }}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Plani</span>
                      </button>
                    )}
                  </td>
                  
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <div className={`text-[11px] font-bold font-mono ${calculateMaturityScore(idea).isReadyToPublish ? 'text-emerald-400' : 'text-slate-400'}`}>
                      %{calculateMaturityScore(idea).score}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500 tabular-nums">
                    <div>{new Date(idea.createdAt).toLocaleDateString('tr-TR', { month: 'numeric', day: 'numeric' })}</div>
                    {idea.reminder && !idea.reminder.isCompleted && (
                      <div 
                        className={`flex items-center gap-1 text-[10px] mt-0.5 ${
                          new Date(idea.reminder.dateTime).getTime() < Date.now()
                            ? 'text-rose-400 font-semibold'
                            : 'text-amber-400'
                        }`}
                        title={`Hatırlatıcı: ${new Date(idea.reminder.dateTime).toLocaleString('tr-TR')}`}
                      >
                        <Bell className="w-2.5 h-2.5 shrink-0" />
                        <span>{new Date(idea.reminder.dateTime).toLocaleDateString('tr-TR', { month: 'numeric', day: 'numeric' })}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onDeleteIdea(idea.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 transition-colors rounded opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
