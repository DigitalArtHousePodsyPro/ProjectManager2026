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
  clearLocalStorage 
} from './services/storage';
import { 
  supabase, 
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
import { LogIn, Sparkles, Mail, Key, LogOut, CheckCircle2, Zap } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  
  // Email auth modal / mode states
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
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

  // Supabase Auth & Session Subscription
  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (session?.provider_token) {
        setAccessToken(session.provider_token);
      }
      setAuthLoading(false);
    }).catch(err => {
      console.warn('Supabase getSession error:', err);
      setAuthLoading(false);
    });

    // 2. Realtime Auth State Change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (session?.provider_token) {
        setAccessToken(session.provider_token);
      }
      setAuthLoading(false);
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

    // Migration Check: If there are legacy ideas in localStorage, move them to Supabase
    const localIdeas = getStoredIdeas();
    if (localIdeas.length > 0) {
      (async () => {
        for (const idea of localIdeas) {
          try {
            await saveIdeaToSupabase(user.id, idea);
          } catch (e) {
            console.error('Migration error for idea:', idea.id, e);
          }
        }
        clearLocalStorage();
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

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setAuthError(err.message || 'Google girişi başlatılamadı. E-posta ile giriş yöntemini de kullanabilirsiniz.');
    }
  };

  const handleEmailAuth = async (isSignUp: boolean) => {
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        const res = await signUpWithEmail(emailInput.trim(), passwordInput);
        if (res.user) setUser(res.user);
      } else {
        const res = await signInWithEmailPassword(emailInput.trim(), passwordInput);
        if (res.user) setUser(res.user);
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      setAuthError(err.message || 'Giriş yapılamadı.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setAccessToken(null);
    setIdeas([]);
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

    await saveIdeaToSupabase(user.id, newIdea);
  };

  const handleAdvanceStatus = async (id: string, newStatus: StatusType) => {
    if (!user) return;
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;
    
    await saveIdeaToSupabase(user.id, {
      ...idea,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  };

  const handleToggleFavorite = async (id: string) => {
    if (!user) return;
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;

    await saveIdeaToSupabase(user.id, {
      ...idea,
      isFavorite: !idea.isFavorite,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteIdea = async (id: string) => {
    if (!user) return;
    await deleteIdeaFromSupabase(user.id, id);
    if (selectedIdea && selectedIdea.id === id) setSelectedIdea(null);
  };

  const handleUpdateIdea = async (updated: IdeaItem) => {
    if (!user) return;
    await saveIdeaToSupabase(user.id, updated);
    if (selectedIdea && selectedIdea.id === updated.id) setSelectedIdea(updated);
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
      setSelectedIdea(updated);
      setTimeout(() => setPipelineProgress(null), 2500);
    } catch (err) {
      console.error('Pipeline run error:', err);
      setPipelineProgress(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-amber-500 to-indigo-500 animate-spin flex items-center justify-center">
          <span className="text-slate-950 font-black text-xl">Ω</span>
        </div>
        <p className="text-slate-400 font-medium animate-pulse">OmniFocus Supabase Bağlantısı Kuruluyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-amber-400 to-indigo-500 flex items-center justify-center text-slate-950 font-black text-3xl shadow-xl mx-auto">
            Ω
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              OmniFocus <span className="text-emerald-400 font-normal">Idea OS</span>
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              Supabase Veritabanı & Realtime ile Güçlendirilmiş Fikir ve Aksiyon Planlama Merkezi
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-left">
              {authError}
            </div>
          )}

          {/* Login Options Tab */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => { setAuthMode('google'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${authMode === 'google' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Google OAuth
            </button>
            <button
              onClick={() => { setAuthMode('email'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${authMode === 'email' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              E-posta ile Giriş
            </button>
          </div>

          {authMode === 'google' ? (
            <div className="space-y-4 pt-2">
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition-all active:scale-98 shadow-lg cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-900" />
                <span>Google ile Giriş Yap</span>
              </button>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left text-[11px] text-emerald-300/90 leading-relaxed">
                <span className="font-semibold block mb-1">⚡ Supabase Doğrudan Bağlantı</span>
                Supabase Auth ve PostgreSQL RLS ile verileriniz tamamen size özel güvenli depolanır.
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(false); }} className="space-y-3 pt-2 text-left">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">E-Posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ornek@alanadi.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Şifre</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {authSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
                <button
                  type="button"
                  disabled={authSubmitting}
                  onClick={() => handleEmailAuth(true)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Yeni Hesap Aç
                </button>
              </div>
            </form>
          )}

          <div className="text-slate-500 text-[11px] font-mono tracking-wider pt-2 border-t border-slate-800/80">
            cmprmnfavqllgkfyoftu.supabase.co
          </div>
        </div>
      </div>
    );
  }

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
          onResetToRealProjects={() => {}}
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
