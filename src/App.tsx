/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { DomainType, StatusType, IdeaItem, ViewMode, PriorityType } from './types';
import { 
  subscribeToIdeas, 
  saveIdeaToSupabase, 
  deleteIdeaFromSupabase, 
  getStoredIdeas, 
  resetToRealProjects 
} from './services/storage';
import { 
  supabase, 
  DEFAULT_USER,
  signInWithGoogle, 
  signInWithEmailPassword, 
  signUpWithEmail, 
  signOut 
} from './lib/supabase';
import { requestAiActionPlan } from './services/aiService';
import { runFullPipelineForIdea } from './services/pipelineEngine';
import { checkAndTriggerSeasonalAlerts } from './services/seasonalAutomation';
import { createLocalBackupSnapshot, getSettings, saveSettings } from './services/backupService';
import { uploadBackupToDrive } from './services/driveService';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { IdeaDetailModal } from './components/IdeaDetailModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { InsightsPanel } from './components/InsightsPanel';
import { TimelineView } from './components/TimelineView';
import { ReminderBanner } from './components/ReminderBanner';
import { Sparkles, CheckCircle2, Zap } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User>(DEFAULT_USER as unknown as User);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  
  const [pipelineProgress, setPipelineProgress] = useState<{ step: string; percent: number } | null>(null);

  // Persisted view states
  const [activeDomain, setActiveDomain] = useState<DomainType | 'all'>(
    (localStorage.getItem('activeDomain') as any) || 'all'
  );
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusType | 'all'>(
    (localStorage.getItem('activeStatusFilter') as any) || 'all'
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem('viewMode') as any) || 'kanban'
  );
  
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaItem | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Sync state to localStorage for persistence across reloads
  useEffect(() => {
    localStorage.setItem('activeDomain', activeDomain);
    localStorage.setItem('activeStatusFilter', activeStatusFilter);
    localStorage.setItem('viewMode', viewMode);
  }, [activeDomain, activeStatusFilter, viewMode]);

  // Supabase Auth & Session Detection
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
      if (session?.provider_token) {
        setAccessToken(session.provider_token);
      }
    }).catch(err => {
      console.warn('Supabase getSession notice:', err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(DEFAULT_USER as unknown as User);
      }
      if (session?.provider_token) {
        setAccessToken(session.provider_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Ideas subscription & Local Storage Migration
  useEffect(() => {
    if (!user) {
      setIdeas([]);
      return;
    }

    // Subscribe to Supabase realtime changes
    const unsubscribe = subscribeToIdeas(user.id, (newIdeas) => {
      setIdeas(newIdeas);
    });

    // Sync cached ideas to Supabase in background without clearing local storage
    const localIdeas = getStoredIdeas();
    if (localIdeas.length > 0) {
      (async () => {
        for (const idea of localIdeas) {
          try {
            await saveIdeaToSupabase(user.id, idea);
          } catch (e) {
            console.error('Sync error for idea:', idea.id, e);
          }
        }
      })();
    }

    // Seasonal alert trigger
    checkAndTriggerSeasonalAlerts(user.id);

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Periodic Drive Backup Logic
  useEffect(() => {
    if (!user || !accessToken) return;
    
    const settings = getSettings();
    if (!settings.isDriveBackupEnabled) return;

    const lastBackup = settings.lastDriveBackupTimestamp;
    const now = new Date();
    
    // Simple check: backup once per session/day
    if (!lastBackup || (now.getTime() - new Date(lastBackup).getTime() > 24 * 60 * 60 * 1000)) {
      const filename = `omnifocus_backup_${now.toISOString().slice(0, 10)}.json`;
      uploadBackupToDrive(accessToken, filename, JSON.stringify(ideas))
        .then(() => {
          saveSettings({ ...settings, lastDriveBackupTimestamp: now.toISOString() });
        })
        .catch(err => console.error('Drive Auto Backup failed:', err));
    }
  }, [user, accessToken, ideas]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Deep Search Filter
  const filteredIdeas = useMemo(() => {
    return ideas.filter((item) => {
      if (activeDomain !== 'all' && item.domain !== activeDomain) return false;
      if (activeStatusFilter !== 'all' && item.status !== activeStatusFilter) return false;
      if (showFavoritesOnly && !item.isFavorite) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        // 1. Basic fields
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesRaw = item.rawInput?.toLowerCase().includes(query);
        const matchesSummary = item.actionPlan?.summary?.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(query));

        // 2. Listing fields
        const matchesListingTitle = item.etsyListing?.title?.toLowerCase().includes(query);
        const matchesListingDesc = item.etsyListing?.description?.toLowerCase().includes(query);
        const matchesListingTags = item.etsyListing?.tags?.some((t) => t.toLowerCase().includes(query));

        // 3. Sub-ideas & Strategic notes
        const matchesSubIdeas = item.subIdeas?.some(
          (s) =>
            s.angle?.toLowerCase().includes(query) ||
            s.description?.toLowerCase().includes(query) ||
            s.rationale?.toLowerCase().includes(query)
        );
        const matchesStratNotes = item.actionPlan?.strategicNotes?.toLowerCase().includes(query);

        // 4. Checklist text & notes & tools
        const matchesChecklist = item.actionPlan?.checklist?.some(
          (c) =>
            c.text?.toLowerCase().includes(query) ||
            c.notes?.toLowerCase().includes(query) ||
            c.tool?.toLowerCase().includes(query)
        );

        // 5. Research report & Domain specifics
        const matchesGrounded = item.groundedResearch?.report?.toLowerCase().includes(query);
        const domainStr = JSON.stringify(item.actionPlan?.domainSpecifics || {}).toLowerCase();
        const matchesDomainSpecifics = domainStr.includes(query);

        if (
          !matchesTitle && !matchesRaw && !matchesSummary && !matchesNotes && !matchesTags &&
          !matchesListingTitle && !matchesListingDesc && !matchesListingTags &&
          !matchesSubIdeas && !matchesStratNotes && !matchesChecklist &&
          !matchesGrounded && !matchesDomainSpecifics
        ) {
          return false;
        }
      }
      return true;
    });
  }, [ideas, activeDomain, activeStatusFilter, showFavoritesOnly, searchQuery]);

  // Counts for sidebar badges
  const counts = useMemo(() => {
    return {
      all: ideas.length,
      etsy_pod: ideas.filter((i) => i.domain === 'etsy_pod').length,
      youtube_automation: ideas.filter((i) => i.domain === 'youtube_automation').length,
      ai_apps: ideas.filter((i) => i.domain === 'ai_apps').length,
      inbox: ideas.filter((i) => i.status === 'inbox').length,
      research: ideas.filter((i) => i.status === 'research').length,
      in_progress: ideas.filter((i) => i.status === 'in_progress').length,
      completed: ideas.filter((i) => i.status === 'completed').length,
      favorites: ideas.filter((i) => i.isFavorite).length,
    };
  }, [ideas]);

  const pendingRemindersCount = useMemo(() => {
    return ideas.reduce((acc, item) => {
      const list = item.reminders || (item.reminder ? [item.reminder] : []);
      const pending = list.filter((r) => !r.isCompleted).length;
      return acc + pending;
    }, 0);
  }, [ideas]);

  const handleSignOut = async () => {
    await signOut();
    setUser(DEFAULT_USER as unknown as User);
    setAccessToken(null);
  };

  const handleSaveNewIdea = async (data: {
    title: string;
    rawInput: string;
    domain: DomainType;
    priority: PriorityType;
    generateActionPlanImmediately: boolean;
    parentId?: string;
  }) => {
    if (!user) return;
    const newId = `idea-${Date.now()}`;
    const newIdea: IdeaItem = {
      id: newId,
      title: data.title,
      rawInput: data.rawInput,
      domain: data.domain,
      status: 'inbox',
      priority: data.priority,
      tags: [data.domain.replace('_', ' ')],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: data.parentId
    };

    if (data.generateActionPlanImmediately) {
      setIsGeneratingPlan(true);
      try {
        const plan = await requestAiActionPlan(data.rawInput, data.domain, data.title);
        newIdea.actionPlan = plan;
        if (plan.tags && plan.tags.length > 0) {
          newIdea.tags = Array.from(new Set([...newIdea.tags, ...plan.tags]));
        }
      } catch (err) {
        console.error('Plan generation failed:', err);
      } finally {
        setIsGeneratingPlan(false);
      }
    }

    // Optimistically update React state immediately for instant UI feedback
    setIdeas((prev) => [newIdea, ...prev.filter(i => i.id !== newIdea.id)]);
    await saveIdeaToSupabase(user.id, newIdea);
  };

  const handleAdvanceStatus = async (id: string, newStatus: StatusType) => {
    if (!user) return;
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;
    
    const updated: IdeaItem = {
      ...idea,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    setIdeas((prev) => prev.map((i) => i.id === id ? updated : i));
    if (selectedIdea && selectedIdea.id === id) {
      setSelectedIdea(updated);
    }
    await saveIdeaToSupabase(user.id, updated);
  };

  const handleToggleFavorite = async (id: string) => {
    if (!user) return;
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;

    const updated: IdeaItem = {
      ...idea,
      isFavorite: !idea.isFavorite,
      updatedAt: new Date().toISOString()
    };
    setIdeas((prev) => prev.map((i) => i.id === id ? updated : i));
    if (selectedIdea && selectedIdea.id === id) {
      setSelectedIdea(updated);
    }
    await saveIdeaToSupabase(user.id, updated);
  };

  const handleDeleteIdea = async (id: string) => {
    if (!user) return;
    setIdeas((prev) => prev.filter(i => i.id !== id));
    if (selectedIdea && selectedIdea.id === id) setSelectedIdea(null);
    await deleteIdeaFromSupabase(user.id, id);
  };

  const handleUpdateIdea = async (updated: IdeaItem) => {
    if (!user) return;
    setIdeas((prev) => prev.map((i) => i.id === updated.id ? updated : i));
    if (selectedIdea && selectedIdea.id === updated.id) setSelectedIdea(updated);
    await saveIdeaToSupabase(user.id, updated);
  };

  const handleGeneratePlanForIdea = async (idea: IdeaItem) => {
    if (!user) return;
    setIsGeneratingPlan(true);
    try {
      const plan = await requestAiActionPlan(idea.rawInput, idea.domain, idea.title);
      const updated: IdeaItem = {
        ...idea,
        actionPlan: plan,
        tags: Array.from(new Set([...idea.tags, ...plan.tags])),
        updatedAt: new Date().toISOString(),
      };
      await handleUpdateIdea(updated);
    } catch (err) {
      console.error('Failed to generate action plan:', err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleRunFullPipeline = async (idea: IdeaItem) => {
    if (!user) return;
    try {
      const updated = await runFullPipelineForIdea(user.id, idea, (step, percent) => {
        setPipelineProgress({ step, percent });
      });
      setIdeas((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      setSelectedIdea(updated);
      setTimeout(() => setPipelineProgress(null), 2500);
    } catch (err) {
      console.error('Pipeline run error:', err);
      setPipelineProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <TopBar
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        totalIdeasCount={ideas.length}
        activeDomain={activeDomain}
        pendingRemindersCount={pendingRemindersCount}
        onSignOut={handleSignOut}
        userEmail={user?.email}
      />

      {/* Pipeline Floating Status Bar */}
      {pipelineProgress && (
        <div className="bg-gradient-to-r from-emerald-600 via-indigo-600 to-amber-600 px-4 py-2 text-xs text-white flex items-center justify-between sticky top-[57px] z-30 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 animate-bounce text-amber-300" />
            <span className="font-semibold">{pipelineProgress.step}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 bg-black/30 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-full transition-all duration-300" 
                style={{ width: `${pipelineProgress.percent}%` }}
              />
            </div>
            <span className="font-mono font-bold text-[11px]">%{pipelineProgress.percent}</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeDomain={activeDomain}
          onSelectDomain={(d) => {
            setActiveDomain(d);
            setActiveStatusFilter('all');
          }}
          activeStatusFilter={activeStatusFilter}
          onSelectStatusFilter={setActiveStatusFilter}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesOnly={() => setShowFavoritesOnly((prev) => !prev)}
          viewMode={viewMode}
          onSelectViewMode={setViewMode}
          counts={counts}
          onResetToRealProjects={async () => {
            const restored = await resetToRealProjects(user?.id || 'omni_creator');
            setIdeas(restored);
          }}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <WorkspaceHeader
            activeDomain={activeDomain}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            filteredCount={filteredIdeas.length}
          />

          {viewMode === 'insights' ? (
            <InsightsPanel
              ideas={filteredIdeas}
              onSelectDomain={(d) => {
                setActiveDomain(d);
                setViewMode('kanban');
              }}
              onSelectStatus={(s) => {
                setActiveStatusFilter(s);
                setViewMode('kanban');
              }}
            />
          ) : viewMode === 'timeline' ? (
            <TimelineView
              ideas={filteredIdeas}
              onSelectIdea={setSelectedIdea}
              onAdvanceStatus={handleAdvanceStatus}
              onToggleFavorite={handleToggleFavorite}
              onDeleteIdea={handleDeleteIdea}
              onGeneratePlan={handleGeneratePlanForIdea}
            />
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              ideas={filteredIdeas}
              onSelectIdea={setSelectedIdea}
              onAdvanceStatus={handleAdvanceStatus}
              onToggleFavorite={handleToggleFavorite}
              onDeleteIdea={handleDeleteIdea}
              onGeneratePlan={handleGeneratePlanForIdea}
              onQuickAddInStatus={(_s) => setIsQuickCaptureOpen(true)}
            />
          ) : (
            <ListView
              ideas={filteredIdeas}
              onSelectIdea={setSelectedIdea}
              onAdvanceStatus={handleAdvanceStatus}
              onToggleFavorite={handleToggleFavorite}
              onDeleteIdea={handleDeleteIdea}
              onGeneratePlan={handleGeneratePlanForIdea}
            />
          )}
        </main>
      </div>

      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        defaultDomain={activeDomain === 'all' ? 'etsy_pod' : activeDomain}
        onSaveIdea={handleSaveNewIdea}
        existingIdeas={ideas}
      />

      <IdeaDetailModal
        idea={selectedIdea}
        isOpen={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        onUpdateIdea={handleUpdateIdea}
        onDeleteIdea={handleDeleteIdea}
        onRegeneratePlan={handleGeneratePlanForIdea}
        isGeneratingPlan={isGeneratingPlan}
        onSpawnNewIdea={(data) => handleSaveNewIdea({ ...data, priority: 'medium', generateActionPlanImmediately: true })}
        ideasPool={ideas}
        onRunPipeline={handleRunFullPipeline}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        ideas={filteredIdeas}
        onImportIdeas={async (imported) => {
          if (!user) return;
          for (const idea of imported) await saveIdeaToSupabase(user.id, idea);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        ideas={ideas}
        onRestoreIdeas={async (restored) => {
          if (!user) return;
          for (const idea of restored) await saveIdeaToSupabase(user.id, idea);
        }}
        user={user}
        accessToken={accessToken}
      />

      <ReminderBanner
        ideas={ideas}
        onOpenIdea={setSelectedIdea}
        onUpdateIdea={handleUpdateIdea}
      />
    </div>
  );
}
