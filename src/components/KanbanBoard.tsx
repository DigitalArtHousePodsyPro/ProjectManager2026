import React from 'react';
import { Plus, Inbox, Search, Clock, CheckCircle2 } from 'lucide-react';
import { IdeaItem, StatusType } from '../types';
import { IdeaCard } from './IdeaCard';

interface KanbanBoardProps {
  ideas: IdeaItem[];
  onSelectIdea: (idea: IdeaItem) => void;
  onAdvanceStatus: (id: string, newStatus: StatusType) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteIdea: (id: string) => void;
  onGeneratePlan: (idea: IdeaItem) => void;
  onQuickAddInStatus: (status: StatusType) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  ideas,
  onSelectIdea,
  onAdvanceStatus,
  onToggleFavorite,
  onDeleteIdea,
  onGeneratePlan,
  onQuickAddInStatus
}) => {
  const columns: { id: StatusType; label: string; icon: any; description: string }[] = [
    {
      id: 'inbox',
      label: 'Gelen Kutusu',
      icon: Inbox,
      description: 'Yeni kaydedilen ham notlar & sesler'
    },
    {
      id: 'research',
      label: 'Arastirma & Dogrulama',
      icon: Search,
      description: 'Niche analizi & hook/script taslagi'
    },
    {
      id: 'in_progress',
      label: 'Uretimde & Gelistirme',
      icon: Clock,
      description: 'Tasarim, video kurgusu veya kodlama'
    },
    {
      id: 'completed',
      label: 'Yayinlandi & Canlida',
      icon: CheckCircle2,
      description: 'Magazada, YouTube\'da veya yayinda'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start pb-8">
      {columns.map((col) => {
        const colIdeas = ideas.filter((i) => i.status === col.id);
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const ideaId = e.dataTransfer.getData('text/plain');
              if (ideaId) {
                onAdvanceStatus(ideaId, col.id);
              }
            }}
            className="bg-slate-950/40 border border-slate-800/80 hover:border-indigo-500/30 rounded-xl p-3 flex flex-col min-h-[500px] transition-colors"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-200">
                  {col.label}
                </h3>
              </div>
              <span className="font-mono text-xs tabular-nums text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {colIdeas.length}
              </span>
            </div>

            {/* Cards Stack */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-0.5">
              {colIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => onSelectIdea(idea)}
                  onAdvanceStatus={onAdvanceStatus}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDeleteIdea}
                  onGeneratePlan={onGeneratePlan}
                />
              ))}

              {colIdeas.length === 0 && (
                <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-800/60 rounded-lg text-slate-600 text-xs">
                  <span>Bu asamada henuz fikir yok</span>
                  <button
                    onClick={() => onQuickAddInStatus(col.id)}
                    className="mt-2 text-slate-400 hover:text-amber-400 font-medium transition-colors cursor-pointer"
                  >
                    + Fikir Ekle
                  </button>
                </div>
              )}
            </div>

            {/* Column Quick Add Button */}
            <button
              onClick={() => onQuickAddInStatus(col.id)}
              className="mt-3 w-full py-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-900/60 rounded-lg transition-colors border border-transparent hover:border-slate-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hizli Fikir Ekle</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
