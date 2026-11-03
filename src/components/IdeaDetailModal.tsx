import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Sparkles, Check, Copy, ShoppingBag, Video, Cpu, Globe,
  CheckSquare, Square, Plus, Trash2, Star, ExternalLink, RefreshCw,
  Bell, Clock, Calendar, AlertTriangle, Layers, FileText, Image, 
  Palette, GitFork, Gauge, Flame, ArrowRight, ShieldCheck, Download,
  TrendingUp, BarChart2, CheckCircle2, ChevronRight, Mic, MicOff, Play, Volume2, Link
} from 'lucide-react';
import { 
  IdeaItem, StatusType, PriorityType, ChecklistItem, DomainType, Reminder,
  UserKeywordMetric, VisualConceptType, SubIdea, VisualConceptItem
} from '../types';
import { 
  requestResearchComparison, requestSubIdeas, requestEtsyListing, 
  requestVisualConcepts, requestDesignBrief, requestGroundedResearch,
  requestAudioTranscription
} from '../services/aiService';
import { calculateMaturityScore } from '../services/storage';

interface IdeaDetailModalProps {
  idea: IdeaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateIdea: (updated: IdeaItem) => void;
  onDeleteIdea: (id: string) => void;
  onRegeneratePlan: (idea: IdeaItem) => Promise<void>;
  isGeneratingPlan: boolean;
  onSpawnNewIdea?: (newIdea: { title: string; rawInput: string; domain: DomainType; parentId?: string }) => void;
  ideasPool: IdeaItem[];
  onRunPipeline?: (idea: IdeaItem) => Promise<void>;
}

type TabType = 'plan' | 'research' | 'listing' | 'visuals' | 'design_brief' | 'sub_ideas';

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  idea,
  isOpen,
  onClose,
  onUpdateIdea,
  onDeleteIdea,
  onRegeneratePlan,
  isGeneratingPlan,
  onSpawnNewIdea,
  ideasPool,
  onRunPipeline
}) => {
  if (!isOpen || !idea) return null;

  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('plan');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(idea.title);
  const [notesInput, setNotesInput] = useState(idea.notes || '');

  // Sub-features loading states
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [loadingListing, setLoadingListing] = useState(false);
  const [loadingVisuals, setLoadingVisuals] = useState(false);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [loadingSubIdeas, setLoadingSubIdeas] = useState(false);

  // Visuals filter
  const [visualsFilter, setVisualsFilter] = useState<'all' | 'hero' | 'product_design' | 'lifestyle_mockup' | 'infographic'>('all');

  // User keyword input form state
  const [newKw, setNewKw] = useState('');
  const [newKwVol, setNewKwVol] = useState<number>(10000);
  const [newKwComp, setNewKwComp] = useState<number>(1200);
  const [newKwConv, setNewKwConv] = useState<number>(4.2);
  const [newKwNotes, setNewKwNotes] = useState('');

  // Audio Recording on existing idea
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<any>(null);

  // Reminder states
  const getDefaultReminderDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [reminderDateTime, setReminderDateTime] = useState<string>(
    idea.reminder?.dateTime || getDefaultReminderDate()
  );
  const [reminderNote, setReminderNote] = useState<string>(idea.reminder?.note || '');
  const [isEditingReminder, setIsEditingReminder] = useState<boolean>(!idea.reminder);

  useEffect(() => {
    if (idea.reminder) {
      setReminderDateTime(idea.reminder.dateTime);
      setReminderNote(idea.reminder.note || '');
      setIsEditingReminder(false);
    } else {
      setReminderDateTime(getDefaultReminderDate());
      setReminderNote('');
      setIsEditingReminder(false);
    }
  }, [idea.id, idea.reminder]);

  // Dynamic Maturity Score
  const maturity = useMemo(() => {
    return calculateMaturityScore(idea);
  }, [idea]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateIdea({
        ...idea,
        title: titleInput.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleSaveNotes = () => {
    onUpdateIdea({
      ...idea,
      notes: notesInput,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleStatusChange = (newStatus: StatusType) => {
    onUpdateIdea({
      ...idea,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  // CHECKLIST HANDLERS
  const handleToggleChecklist = (checkId: string) => {
    if (!idea.actionPlan) return;
    const updatedChecklist = idea.actionPlan.checklist.map((item) =>
      item.id === checkId ? { ...item, done: !item.done } : item
    );
    onUpdateIdea({
      ...idea,
      actionPlan: {
        ...idea.actionPlan,
        checklist: updatedChecklist,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newChecklistText.trim(),
      done: false,
    };

    const existingChecklist = idea.actionPlan?.checklist || [];
    const updatedChecklist = [...existingChecklist, newItem];

    onUpdateIdea({
      ...idea,
      actionPlan: idea.actionPlan
        ? { ...idea.actionPlan, checklist: updatedChecklist }
        : {
            summary: idea.title,
            tags: idea.tags,
            domainSpecifics: {},
            checklist: updatedChecklist,
            generatedAt: new Date().toISOString(),
          },
      updatedAt: new Date().toISOString(),
    });

    setNewChecklistText('');
  };

  // REMINDER HANDLERS
  const handleSaveReminder = () => {
    if (!reminderDateTime) return;
    const newReminder: Reminder = {
      id: idea.reminder?.id || `rem-${Date.now()}`,
      dateTime: reminderDateTime,
      note: reminderNote.trim() || undefined,
      isCompleted: false,
      notified: false,
      createdAt: idea.reminder?.createdAt || new Date().toISOString(),
    };
    onUpdateIdea({
      ...idea,
      reminder: newReminder,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingReminder(false);
  };

  const handleRemoveReminder = () => {
    onUpdateIdea({
      ...idea,
      reminder: undefined,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingReminder(false);
  };

  const handleToggleReminderComplete = () => {
    if (!idea.reminder) return;
    onUpdateIdea({
      ...idea,
      reminder: {
        ...idea.reminder,
        isCompleted: !idea.reminder.isCompleted,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // 1. DATA PRIORITY & RESEARCH GENERATION
  const handleRunResearchComparison = async () => {
    setLoadingResearch(true);
    try {
      const result = await requestResearchComparison(idea.title, idea.rawInput, idea.userKeywords);
      const updated: IdeaItem = {
        ...idea,
        dataComparison: result,
        userKeywords: result.userKeywords || idea.userKeywords,
        updatedAt: new Date().toISOString(),
      };
      onUpdateIdea(updated);
    } catch (err) {
      console.error('Failed to run research comparison:', err);
    } finally {
      setLoadingResearch(false);
    }
  };

  const [loadingGroundedResearch, setLoadingGroundedResearch] = useState(false);

  // Google Search Grounding with gemini-3.8-flash ("Araştırma Aşamasında")
  const handleRunGroundedResearch = async () => {
    setLoadingGroundedResearch(true);
    try {
      const result = await requestGroundedResearch(
        idea.title,
        idea.rawInput,
        idea.domain,
        idea.userKeywords
      );
      const updated: IdeaItem = {
        ...idea,
        groundedResearch: result,
        updatedAt: new Date().toISOString(),
      };
      onUpdateIdea(updated);
    } catch (err) {
      console.error('Failed to run grounded research:', err);
    } finally {
      setLoadingGroundedResearch(false);
    }
  };

  const handleAddUserKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKw.trim()) return;

    const newMetric: UserKeywordMetric = {
      keyword: newKw.trim(),
      searchVolume: Number(newKwVol) || 1000,
      competitionResults: Number(newKwComp) || 500,
      conversionRate: Number(newKwConv) || 3.5,
      source: 'user_keyword_data',
      notes: newKwNotes.trim() || undefined,
    };

    const existingKws = idea.userKeywords || [];
    const updatedKws = [...existingKws, newMetric];

    onUpdateIdea({
      ...idea,
      userKeywords: updatedKws,
      updatedAt: new Date().toISOString(),
    });

    setNewKw('');
    setNewKwNotes('');
  };

  // 2. ETSY LISTING GENERATION
  const handleGenerateListing = async () => {
    setLoadingListing(true);
    try {
      const result = await requestEtsyListing(
        idea.title,
        idea.rawInput,
        idea.userKeywords,
        idea.actionPlan?.domainSpecifics?.designConcept,
        idea.actionPlan?.domainSpecifics?.productType
      );
      const updated: IdeaItem = {
        ...idea,
        etsyListing: result,
        updatedAt: new Date().toISOString(),
      };
      onUpdateIdea(updated);
    } catch (err) {
      console.error('Failed to generate Etsy listing:', err);
    } finally {
      setLoadingListing(false);
    }
  };

  // 3. 20 VISUAL CONCEPTS GENERATION
  const handleGenerateVisuals = async () => {
    setLoadingVisuals(true);
    try {
      const result = await requestVisualConcepts(
        idea.title,
        idea.rawInput,
        idea.actionPlan?.domainSpecifics?.designConcept,
        idea.actionPlan?.domainSpecifics?.productType
      );
      const updated: IdeaItem = {
        ...idea,
        visualConcepts: result,
        updatedAt: new Date().toISOString(),
      };
      onUpdateIdea(updated);
    } catch (err) {
      console.error('Failed to generate visual concepts:', err);
    } finally {
      setLoadingVisuals(false);
    }
  };

  // 4. DESIGN BRIEF GENERATION
  const handleGenerateBrief = async () => {
    setLoadingBrief(true);
    try {
      const result = await requestDesignBrief(
        idea.title,
        idea.rawInput,
        idea.actionPlan?.domainSpecifics?.productType
      );
      const updated: IdeaItem = {
        ...idea,
        designBrief: result,
        updatedAt: new Date().toISOString(),
      };
      onUpdateIdea(updated);
    } catch (err) {
      console.error('Failed to generate design brief:', err);
    } finally {
      setLoadingBrief(false);
    }
  };

  // 5. SUB-IDEAS & NICHE COMBINATION
  const handleGenerateSubIdeas = async () => {
    setLoadingSubIdeas(true);
    try {
      const result = await requestSubIdeas(
        idea.title,
        idea.rawInput,
        idea.userKeywords,
        idea.tags
      );
      const updated: IdeaItem = {
        ...idea,
        subIdeas: result,
        updatedAt: new Date().toISOString(),
      };
      onUpdateIdea(updated);
    } catch (err) {
      console.error('Failed to generate sub ideas:', err);
    } finally {
      setLoadingSubIdeas(false);
    }
  };

  // AUDIO NOTE HANDLERS
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (audioChunksRef.current.length > 0) {
          await processRecordedAudio();
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processRecordedAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    if (audioBlob.size < 1000) return;

    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
          const res = await requestAudioTranscription(base64Data, audioBlob.type);
          if (res.transcript) {
            const newNote = {
              id: `note-${Date.now()}`,
              transcript: res.transcript,
              createdAt: new Date().toISOString()
            };
            onUpdateIdea({
              ...idea,
              audioNotes: [...(idea.audioNotes || []), newNote],
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error('Transcription error:', err);
        } finally {
          setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      setIsTranscribing(false);
    }
  };

  const handleCopyFullListing = () => {
    if (!idea.etsyListing) return;
    const l = idea.etsyListing;
    const fullText = `TITLE:\n${l.title}\n\nDESCRIPTION:\n${l.description}\n\nTAGS:\n${l.tags.join(', ')}\n\nPRICING:\nDigital: ${l.suggestedPrice.digitalDownload}\nUnframed: ${l.suggestedPrice.unframedPoster}\nFramed: ${l.suggestedPrice.framedPoster}`;
    handleCopy(fullText, 'full-listing');
  };

  const parentIdea = ideasPool.find(i => i.id === idea.parentId);
  const childIdeas = ideasPool.filter(i => i.parentId === idea.id);

  // Domain Config
  const domainConfig: Record<DomainType, { label: string; icon: any; color: string; badge: string }> = {
    etsy_pod: { 
      label: 'Etsy Print-on-Demand', 
      icon: ShoppingBag, 
      color: 'text-amber-400',
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    },
    youtube_automation: { 
      label: 'YouTube Video Otomasyonu', 
      icon: Video, 
      color: 'text-rose-400',
      badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300'
    },
    ai_apps: { 
      label: 'AI Uygulama Geliştirme', 
      icon: Cpu, 
      color: 'text-indigo-400',
      badge: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
    },
    indonesia: {
      label: 'Indonesia E-Ticaret',
      icon: Globe,
      color: 'text-emerald-400',
      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    }
  };

  const { icon: DomainIcon, label: domainLabel, badge: domainBadge } = domainConfig[idea.domain];
  const plan = idea.actionPlan;
  const specifics = plan?.domainSpecifics || {};

  // Filtered visuals
  const filteredVisuals = (idea.visualConcepts || []).filter(v => {
    if (visualsFilter === 'all') return true;
    return v.type === visualsFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-md border flex items-center gap-1.5 ${domainBadge}`}>
              <DomainIcon className="w-3.5 h-3.5" />
              <span>{domainLabel}</span>
            </span>

            {/* Status Selector */}
            <select
              value={idea.status}
              onChange={(e) => handleStatusChange(e.target.value as StatusType)}
              className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-md border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="inbox">Gelen Kutusu (Fikir)</option>
              <option value="research">Araştırma & Doğrulama</option>
              <option value="in_progress">Üretimde / Geliştirme</option>
              <option value="completed">Tamamlandı / Canlıda</option>
            </select>

            {/* Relationship Info */}
            {(parentIdea || childIdeas.length > 0) && (
              <div className="flex items-center gap-2 border-l border-slate-700 ml-2 pl-3">
                {parentIdea && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Link className="w-3 h-3 text-amber-500" />
                    <span>Şuradan türedi:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[120px]">{parentIdea.title}</span>
                  </div>
                )}
                {childIdeas.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <GitFork className="w-3 h-3 text-indigo-400" />
                    <span>{childIdeas.length} alt fikir türetildi</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onRunPipeline && (
              <button
                onClick={async () => {
                  setIsRunningPipeline(true);
                  try {
                    await onRunPipeline(idea);
                  } finally {
                    setIsRunningPipeline(false);
                  }
                }}
                disabled={isRunningPipeline || isGeneratingPlan}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                title="Tüm adımları (Plan + Araştırma + Alt Fikirler + Etsy/Studio + 20 Görsel + Brief) otomatik çalıştır"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isRunningPipeline ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
                <span>{isRunningPipeline ? 'Pipeline Çalışıyor...' : '⚡ Tam Pipeline'}</span>
              </button>
            )}

            <button
              onClick={() => onRegeneratePlan(idea)}
              disabled={isGeneratingPlan || isRunningPipeline}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Yapay zeka ile aksiyon planını yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
              <span>{isGeneratingPlan ? 'Yenileniyor...' : 'AI Planı Yenile'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Maturity Score Bar (0 - 100) */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Fikir Olgunluk Skoru:
              </span>
              <span className={`text-sm font-bold font-mono tabular-nums ${
                maturity.isReadyToPublish ? 'text-emerald-400 font-extrabold' : 'text-amber-400'
              }`}>
                %{maturity.score}
              </span>
            </div>

            {maturity.isReadyToPublish ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 shadow-sm animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>YAYINA HAZIR 🚀</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                (%100 olunca "Yayına Hazır" işaretlenir)
              </span>
            )}
          </div>

          {/* 5 Criteria Checklist Badges */}
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className={`px-2 py-0.5 rounded border ${
              maturity.researchDone 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              {maturity.researchDone ? '✓' : '○'} Araştırma (%20)
            </span>
            <span className={`px-2 py-0.5 rounded border ${
              maturity.listingDraftDone 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              {maturity.listingDraftDone ? '✓' : '○'} Listing (%25)
            </span>
            <span className={`px-2 py-0.5 rounded border ${
              maturity.visualConceptsDone 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              {maturity.visualConceptsDone ? '✓' : '○'} 20 Görsel (%25)
            </span>
            <span className={`px-2 py-0.5 rounded border ${
              maturity.designBriefDone 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              {maturity.designBriefDone ? '✓' : '○'} Brief (%15)
            </span>
            <span className={`px-2 py-0.5 rounded border ${
              maturity.subIdeasDone 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              {maturity.subIdeasDone ? '✓' : '○'} Alt Fikir (%15)
            </span>
          </div>
        </div>

        {/* Title & Raw Note Area */}
        <div className="px-6 pt-4 pb-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="flex-1 text-lg font-bold bg-slate-950 px-3 py-1.5 rounded-lg border border-amber-400 text-white"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="px-3 py-1.5 bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-lg font-bold text-white hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-2"
              title="Düzenlemek için tıklayın"
            >
              <span>{idea.title}</span>
              <span className="text-xs text-slate-500 font-normal opacity-0 hover:opacity-100">(düzenle)</span>
            </h1>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 flex items-center gap-1 overflow-x-auto bg-slate-950/40">
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'plan'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Genel & Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'research'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Veri & Araştırma (Data Öncelik)</span>
            {idea.dataComparison && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('listing')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'listing'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Etsy Listing Hazırlığı</span>
            {idea.etsyListing && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('visuals')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'visuals'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>20 Listing Görseli</span>
            {idea.visualConcepts && idea.visualConcepts.length >= 20 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('design_brief')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'design_brief'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tasarım Briefi (Palet & Font)</span>
            {idea.designBrief && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('sub_ideas')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'sub_ideas'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Alt Fikirler & Kombinasyon</span>
            {idea.subIdeas && idea.subIdeas.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* TAB 1: GENEL & PLAN */}
          {activeTab === 'plan' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              {/* Raw Note */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  İlk Akla Gelen Ham Not
                </div>
                <p className="text-sm text-slate-200 leading-relaxed italic">
                  "{idea.rawInput}"
                </p>
              </div>

              {/* Action Plan Summary */}
              {plan ? (
                <div className="space-y-6">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Stratejik Özet</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {plan.summary}
                    </p>
                  </div>

                  {/* Domain Specifics */}
                  {idea.domain === 'etsy_pod' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-xs text-amber-400 font-medium">Hedef Niche & Neden Tutar?</div>
                        <div className="text-sm text-slate-200">{specifics.niche || 'Belirtilmedi'}</div>
                      </div>

                      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-xs text-amber-400 font-medium">Önerilen Ürün Tipi & Malzeme</div>
                        <div className="text-sm text-slate-200">{specifics.productType || 'Enhanced Matte Art Paper'}</div>
                      </div>

                      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-xs text-amber-400 font-medium">Hedef Kitle & Alıcı Profili</div>
                        <div className="text-sm text-slate-200">{specifics.targetAudience || 'Belirtilmedi'}</div>
                      </div>

                      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-xs text-amber-400 font-medium">Tasarım Konsepti & Stil</div>
                        <div className="text-sm text-slate-200">{specifics.designConcept || 'Minimalist Modern'}</div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Checklist */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Uygulama Adımları & Görev Detayları
                      </h3>
                      <span className="font-mono text-xs tabular-nums text-slate-500">
                        {plan.checklist.filter(c => c.done).length}/{plan.checklist.length} tamamlandı
                      </span>
                    </div>

                    <div className="space-y-2">
                      {plan.checklist.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all ${
                            item.done
                              ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-400'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => handleToggleChecklist(item.id)}>
                              <button type="button" className="mt-0.5 shrink-0 text-slate-400">
                                {item.done ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-600" />
                                )}
                              </button>
                              <div className="space-y-1">
                                <span className={`text-xs font-medium block ${item.done ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                  {item.text}
                                </span>
                                {item.notes && <p className="text-[11px] text-slate-400 italic">{item.notes}</p>}
                              </div>
                            </div>

                            {/* Badges: Tool, DueDate, Priority */}
                            <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                              {item.tool && (
                                <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold">
                                  🛠️ {item.tool}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className={`px-2 py-0.5 rounded border ${
                                  new Date(item.dueDate).getTime() < Date.now() ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold' : 'bg-slate-900 border-slate-700 text-amber-300'
                                }`}>
                                  📅 {item.dueDate}
                                </span>
                              )}
                              {item.priority && (
                                <span className={`px-2 py-0.5 rounded uppercase font-bold border ${
                                  item.priority === 'high' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}>
                                  {item.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add new task form */}
                    <form onSubmit={handleAddChecklistItem} className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        placeholder="Listeye yeni görev ekle (örn: Midjourney prompt üret)..."
                        className="flex-1 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400/80 w-full"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Görev Ekle</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">Bu fikir için henüz aksiyon planı üretilmedi</h3>
                  <button
                    onClick={() => onRegeneratePlan(idea)}
                    disabled={isGeneratingPlan}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingPlan ? 'Yapay Zeka Çalışıyor...' : 'Aksiyon Planı Üret'}</span>
                  </button>
                </div>
              )}

              {/* Reminder Section */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Hatırlatıcı & Bildirim
                    </label>
                  </div>
                  {idea.reminder && !isEditingReminder && (
                    <div className="flex items-center gap-2 text-xs">
                      <button onClick={() => setIsEditingReminder(true)} className="text-amber-400 hover:underline cursor-pointer">Düzenle</button>
                      <span className="text-slate-600">·</span>
                      <button onClick={handleRemoveReminder} className="text-rose-400 hover:underline cursor-pointer">Kaldır</button>
                    </div>
                  )}
                </div>

                {idea.reminder && !isEditingReminder ? (
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    idea.reminder.isCompleted ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-slate-950/60 border-amber-500/30'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-white">
                          {new Date(idea.reminder.dateTime).toLocaleString('tr-TR')}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          idea.reminder.isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {idea.reminder.isCompleted ? 'Tamamlandı' : 'Beklemede'}
                        </span>
                      </div>
                      {idea.reminder.note && <p className="text-xs text-slate-300 italic">"{idea.reminder.note}"</p>}
                    </div>

                    <button
                      onClick={handleToggleReminderComplete}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    >
                      {idea.reminder.isCompleted ? 'Yeniden Aç' : 'Tamamlandı'}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                    <input
                      type="datetime-local"
                      value={reminderDateTime}
                      onChange={(e) => setReminderDateTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="text"
                      value={reminderNote}
                      onChange={(e) => setReminderNote(e.target.value)}
                      placeholder="Hatırlatıcı notu (örn: Mockup yükle)..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleSaveReminder}
                        className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Kişisel Notlarınız & Kaynaklar
                  </label>
                  <button onClick={handleSaveNotes} className="text-xs text-amber-400 hover:underline cursor-pointer">
                    Notları Kaydet
                  </button>
                </div>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ek linkler, tedarikçi notları veya özel düşünceler..."
                  rows={3}
                  className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400/80 resize-none"
                />
              </div>

              {/* Audio Notes Section */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-400" />
                    <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Sesli Notlar & Transkripsiyon
                    </label>
                  </div>
                  {isTranscribing && (
                    <span className="text-[10px] text-amber-400 animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-spin" />
                      Yapay Zeka Dinliyor...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Record Button */}
                  <div className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-3 ${
                    isRecording ? 'bg-rose-950/20 border-rose-500/50' : 'bg-slate-950/40 border-slate-800 border-dashed'
                  }`}>
                    {isRecording ? (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                          <span className="text-xl font-mono text-white">
                            {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <button
                          onClick={stopRecording}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Durdur & Analiz Et
                        </button>
                      </>
                    ) : (
                      <>
                        <Mic className="w-8 h-8 text-slate-600" />
                        <button
                          onClick={startRecording}
                          disabled={isTranscribing}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          Yeni Ses Kaydı Başlat
                        </button>
                      </>
                    )}
                  </div>

                  {/* Audio Notes List */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {idea.audioNotes && idea.audioNotes.length > 0 ? (
                      idea.audioNotes.map((note) => (
                        <div key={note.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(note.createdAt).toLocaleString('tr-TR')}
                            </span>
                            <Volume2 className="w-3 h-3 text-slate-600" />
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed italic">
                            "{note.transcript}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-600 italic border border-slate-800 border-dashed rounded-xl">
                        Henüz sesli not eklenmedi.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERİ & ARAŞTIRMA (DATA ÖNCELİK SİSTEMİ) */}
          {activeTab === 'research' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              {/* Data Priority Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-950 to-amber-500/5 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Data Öncelik Sistemi (User Data = 85% Weight)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sizin girdiğiniz gerçek mağaza verisi (Arama Hacmi, Rekabet, Dönüşüm Oranı) her zaman birincil önceliklidir. AI web araştırması yalnızca destekleyici kalır.
                  </p>
                </div>

                <button
                  onClick={handleRunResearchComparison}
                  disabled={loadingResearch}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingResearch ? 'animate-spin' : ''}`} />
                  <span>{loadingResearch ? 'Karşılaştırılıyor...' : 'Yapay Zeka ile Kıyasla'}</span>
                </button>
              </div>

              {/* Add User Keyword Form */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kendi Mağaza / eRank / EverBee Keyword Verinizi Ekleyin</span>
                </div>

                <form onSubmit={handleAddUserKeyword} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Keyword (örn: custom song poster)"
                      value={newKw}
                      onChange={(e) => setNewKw(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Arama Hacmi (18500)"
                      value={newKwVol}
                      onChange={(e) => setNewKwVol(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Rekabet (1420)"
                      value={newKwComp}
                      onChange={(e) => setNewKwComp(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="CR % (4.8)"
                      value={newKwConv}
                      onChange={(e) => setNewKwConv(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg cursor-pointer shrink-0"
                    >
                      Ekle
                    </button>
                  </div>
                </form>
              </div>

              {/* Data Priority Comparison Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    1. Kullanıcı Keyword Verileri (Öncelikli - %85 Ağırlık)
                  </h3>
                  {idea.dataComparison?.opportunityRating && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 font-mono">
                      Fırsat Notu: {idea.dataComparison.opportunityRating}
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Anahtar Kelime (Keyword)</th>
                        <th className="py-2.5 px-3 font-semibold">Aylık Arama Hacmi</th>
                        <th className="py-2.5 px-3 font-semibold">Rekabet (Arama Sonucu)</th>
                        <th className="py-2.5 px-3 font-semibold">Dönüşüm Oranı (CR)</th>
                        <th className="py-2.5 px-3 font-semibold">Ağırlık Kaynağı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono text-slate-300">
                      {((idea.dataComparison?.userKeywords && idea.dataComparison.userKeywords.length > 0)
                        ? idea.dataComparison.userKeywords
                        : (idea.userKeywords || [])
                      ).map((kw, i) => (
                        <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-sans font-medium text-white">{kw.keyword}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-400">{kw.searchVolume.toLocaleString()}</td>
                          <td className="py-2.5 px-3">{kw.competitionResults.toLocaleString()} sonuç</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">%{kw.conversionRate}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px]">
                              Kullanıcı (Birincil)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* AI External Web Comparison */}
                {idea.dataComparison?.aiExternalKeywords && (
                  <div className="space-y-3 pt-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      2. Dış Pazar & Web Araştırması (İkincil Destekleyici Veri)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {idea.dataComparison.aiExternalKeywords.map((ak, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
                          <div className="font-semibold text-slate-200">{ak.keyword}</div>
                          <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                            <span>Tahmini: {ak.estimatedVolume}</span>
                            <span className="capitalize">{ak.competitionLevel} rekabet</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {idea.dataComparison.strategicVerdict && (
                      <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-xs font-semibold text-amber-300">Stratejik Değerlendirme & Karar:</span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {idea.dataComparison.strategicVerdict}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Google Search Grounding (gemini-3.8-flash) Section */}
              <div className="p-4 bg-slate-950/80 border border-sky-500/30 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Google Search Grounding (gemini-3.8-flash) Canlı Web Araştırması
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-mono border border-sky-500/40">
                        Search Grounding
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      "Araştırma Aşamasında" (Research Phase) olan projeler için canlı Google Arama verilerini sorgulayarak 2026 güncel pazar trendlerini, arama hacimlerini ve kaynakları getirir. (Kullanıcı mağaza veriniz %85 önceliklidir).
                    </p>
                  </div>

                  <button
                    onClick={handleRunGroundedResearch}
                    disabled={loadingGroundedResearch}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Globe className={`w-3.5 h-3.5 ${loadingGroundedResearch ? 'animate-spin' : ''}`} />
                    <span>{loadingGroundedResearch ? 'Google Aranıyor...' : 'Canlı Google Verisi Çek (Gemini 3.8 Flash)'}</span>
                  </button>
                </div>

                {idea.groundedResearch && (
                  <div className="space-y-4 pt-3 border-t border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-300">Pazar Trendi:</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 font-mono">
                          {idea.groundedResearch.marketTrend}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-300">Önerilen Aksiyon:</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 font-mono">
                          {idea.groundedResearch.recommendedAction}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300">Fırsat Skoru:</span>
                        <span className="text-sm font-bold font-mono text-sky-400">
                          %{idea.groundedResearch.opportunityScore}
                        </span>
                      </div>
                    </div>

                    {/* Grounding Search Queries Executed */}
                    {idea.groundedResearch.searchQueriesUsed && idea.groundedResearch.searchQueriesUsed.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <span>Google Arama Sorguları (Gemini 3.8 Flash Grounding):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {idea.groundedResearch.searchQueriesUsed.map((q, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-xs font-mono text-sky-300 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-sky-400" />
                              <span>"{q}"</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grounding Sources / Citations */}
                    {idea.groundedResearch.groundingSources && idea.groundedResearch.groundingSources.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Canlı Web Kaynakları & Referanslar:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {idea.groundedResearch.groundingSources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded-lg text-xs text-sky-400 flex items-center justify-between gap-2 transition-colors group"
                            >
                              <span className="truncate group-hover:underline">{src.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-sky-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Report body */}
                    <div className="p-4 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {idea.groundedResearch.report}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ETSY LISTING HAZIRLIĞI */}
          {activeTab === 'listing' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Tam Listing Hazırlığı (SEO Başlık, Açıklama, 13 Tag, Fiyat)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyFullListing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Tüm Listeyi Kopyala</span>
                    </button>
                    <button
                      onClick={handleGenerateListing}
                      disabled={loadingListing}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${loadingListing ? 'animate-spin' : ''}`} />
                      <span>{loadingListing ? 'Listing Hazırlanıyor...' : 'Tam Listing Üret'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {idea.etsyListing ? (
                <div className="space-y-5">
                  {/* Title */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300">
                        Etsy Başlığı ({idea.etsyListing.title.length}/140 Karakter)
                      </span>
                      <button
                        onClick={() => handleCopy(idea.etsyListing!.title, 'listing-title')}
                        className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer font-medium"
                      >
                        {copiedKey === 'listing-title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'listing-title' ? 'Kopyalandı!' : 'Başlığı Kopyala'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      {idea.etsyListing.title}
                    </p>
                  </div>

                  {/* 13 Tags with 1-click comma-separated copy */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300">
                        13 Adet Etsy Arama Etiketi ({idea.etsyListing.tags.length}/13)
                      </span>
                      <button
                        onClick={() => handleCopy(idea.etsyListing!.tags.join(', '), 'all-tags')}
                        className="flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer font-semibold"
                      >
                        {copiedKey === 'all-tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'all-tags' ? '13 Etiket Kopyalandı!' : '13 Etiketi Toplu Kopyala'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {idea.etsyListing.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          onClick={() => handleCopy(tag, `tag-${idx}`)}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-300 hover:text-white hover:border-amber-400 transition-colors cursor-pointer"
                          title="Kopyalamak için tıkla"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Suggestions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Önerilen Piyasa Satış Fiyatları
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-center space-y-1">
                        <div className="text-[11px] text-slate-400">Dijital İndirme</div>
                        <div className="text-lg font-bold font-mono text-emerald-400">
                          ${idea.etsyListing.suggestedPrice.digitalDownload}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-center space-y-1">
                        <div className="text-[11px] text-slate-400">Çerçevesiz Poster</div>
                        <div className="text-lg font-bold font-mono text-amber-400">
                          ${idea.etsyListing.suggestedPrice.unframedPoster}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-center space-y-1">
                        <div className="text-[11px] text-slate-400">Masif Ahşap Çerçeveli</div>
                        <div className="text-lg font-bold font-mono text-indigo-400">
                          ${idea.etsyListing.suggestedPrice.framedPoster}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-center space-y-1">
                        <div className="text-[11px] text-slate-400">Özel / Kanvas</div>
                        <div className="text-lg font-bold font-mono text-sky-400">
                          ${idea.etsyListing.suggestedPrice.canvasOrSpecialty || '69.90'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300">Tam Ürün Açıklaması (Description)</span>
                      <button
                        onClick={() => handleCopy(idea.etsyListing!.description, 'listing-desc')}
                        className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer font-medium"
                      >
                        {copiedKey === 'listing-desc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'listing-desc' ? 'Kopyalandı!' : 'Açıklamayı Kopyala'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {idea.etsyListing.description}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <FileText className="w-8 h-8 text-amber-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">Bu fikir için henüz tam listing oluşturulmadı</h3>
                  <button
                    onClick={handleGenerateListing}
                    disabled={loadingListing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{loadingListing ? 'Listing Hazırlanıyor...' : 'Tam Listing Üret'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 20 LISTING GÖRSELİ KONSEPTİ */}
          {activeTab === 'visuals' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    20 Listing Görseli Konsepti (1 Hero, 14 Lifestyle, 5 İnfografik)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Her görsel için Midjourney/Flux promptu ve SEO Alt Text hazır durumdadır.
                  </p>
                </div>

                <button
                  onClick={handleGenerateVisuals}
                  disabled={loadingVisuals}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loadingVisuals ? 'animate-spin' : ''}`} />
                  <span>{loadingVisuals ? 'Görseller Üretiliyor...' : '20 Görsel Konsepti Üret'}</span>
                </button>
              </div>

              {/* Filter Tabs for Visuals */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setVisualsFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    visualsFilter === 'all' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Tümü ({idea.visualConcepts?.length || 0})
                </button>
                <button
                  onClick={() => setVisualsFilter('hero')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    visualsFilter === 'hero' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  1 Hero Görseli
                </button>
                <button
                  onClick={() => setVisualsFilter('lifestyle_mockup')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    visualsFilter === 'lifestyle_mockup' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  2-15 Ürün & Lifestyle
                </button>
                <button
                  onClick={() => setVisualsFilter('infographic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    visualsFilter === 'infographic' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  16-20 İnfografikler
                </button>
              </div>

              {idea.visualConcepts && idea.visualConcepts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVisuals.map((vis) => (
                    <div
                      key={vis.slot}
                      className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-mono font-bold text-xs">
                            #{vis.slot}
                          </span>
                          <span className="text-xs font-bold text-white">{vis.title}</span>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          vis.type === 'hero' || vis.type === 'product_design'
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : vis.type === 'lifestyle_mockup'
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {vis.type === 'hero' ? 'Hero Shot' : vis.type === 'product_design' ? 'Tasarım' : vis.type === 'lifestyle_mockup' ? 'Mockup' : 'İnfografik'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {vis.description}
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono text-slate-500">{vis.specs}</span>
                          <button
                            onClick={() => handleCopy(vis.promptOrSpec, `vis-${vis.slot}`)}
                            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer font-medium"
                          >
                            {copiedKey === `vis-${vis.slot}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === `vis-${vis.slot}` ? 'Kopyalandı!' : 'Promptu Kopyala'}</span>
                          </button>
                        </div>

                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-300 break-words">
                          {vis.promptOrSpec}
                        </div>

                        {vis.altText && (
                          <div className="space-y-1.5 mt-3">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-semibold text-sky-400">SEO Alt Text (Kopyala)</span>
                              <button
                                onClick={() => handleCopy(vis.altText!, `alt-${vis.slot}`)}
                                className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
                              >
                                {copiedKey === `alt-${vis.slot}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === `alt-${vis.slot}` ? 'Kopyalandı' : 'Kopyala'}</span>
                              </button>
                            </div>
                            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/50 text-[10px] text-slate-400 italic">
                              {vis.altText}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <Image className="w-8 h-8 text-amber-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">Bu fikir için henüz 20 görsel konsepti çıkarılmadı</h3>
                  <button
                    onClick={handleGenerateVisuals}
                    disabled={loadingVisuals}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{loadingVisuals ? 'Görseller Üretiliyor...' : '20 Görsel Konsepti Üret'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TASARIM BRİEFİ */}
          {activeTab === 'design_brief' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Tasarım Brief Otomasyonu (Canva / Midjourney Ready)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Renk paleti (HEX), yazı tipi kombinasyonu ve kompozisyon kuralları.
                  </p>
                </div>

                <button
                  onClick={handleGenerateBrief}
                  disabled={loadingBrief}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loadingBrief ? 'animate-spin' : ''}`} />
                  <span>{loadingBrief ? 'Brief Hazırlanıyor...' : 'Tasarım Briefi Üret'}</span>
                </button>
              </div>

              {idea.designBrief ? (
                <div className="space-y-6">
                  {/* Style */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Tasarım Dili & Stil</div>
                      <div className="text-sm font-bold text-amber-300">{idea.designBrief.style}</div>
                    </div>
                  </div>

                  {/* Color Palette Swatches */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      5 Seçilmiş Renk Paleti (HEX Kodları)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {idea.designBrief.colorPalette.map((col, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleCopy(col.hex, `hex-${idx}`)}
                          className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2 cursor-pointer transition-all text-center group"
                          title="HEX kodunu kopyalamak için tıkla"
                        >
                          <div
                            className="w-full h-12 rounded-lg shadow-inner border border-white/10"
                            style={{ backgroundColor: col.hex }}
                          />
                          <div className="text-xs font-medium text-slate-200 truncate">{col.name}</div>
                          <div className="font-mono text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center justify-center gap-1">
                            {copiedKey === `hex-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                            <span>{copiedKey === `hex-${idx}` ? 'Kopyalandı!' : col.hex}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography Suggestions */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <h4 className="text-xs font-semibold text-amber-300">Tipografi & Font Eşleştirmesi</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Birincil Font (Başlık)</span>
                        <span className="text-white font-bold">{idea.designBrief.typographySuggestions.primaryFont}</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">İkincil Font (Gövde & Künye)</span>
                        <span className="text-white font-bold">{idea.designBrief.typographySuggestions.secondaryFont}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic">
                      "{idea.designBrief.typographySuggestions.pairingNotes}"
                    </p>
                  </div>

                  {/* Composition Rules */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="text-xs font-semibold text-slate-300">Kompozisyon & Mizanpaj Kuralları</h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {idea.designBrief.compositionRules.map((r, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ready Prompts for Canva & Midjourney */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-sky-400">Canva Tasarım Talimatı</span>
                        <button
                          onClick={() => handleCopy(idea.designBrief!.canvaPrompt, 'canva-brief')}
                          className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {copiedKey === 'canva-brief' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'canva-brief' ? 'Kopyalandı!' : 'Kopyala'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono leading-relaxed">
                        {idea.designBrief.canvaPrompt}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-400">Midjourney v6.1 Promptu</span>
                        <button
                          onClick={() => handleCopy(idea.designBrief!.midjourneyPrompt, 'mj-brief')}
                          className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {copiedKey === 'mj-brief' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'mj-brief' ? 'Kopyalandı!' : 'Kopyala'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono leading-relaxed">
                        {idea.designBrief.midjourneyPrompt}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <Palette className="w-8 h-8 text-amber-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">Bu fikir için henüz tasarım briefi üretilmedi</h3>
                  <button
                    onClick={handleGenerateBrief}
                    disabled={loadingBrief}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{loadingBrief ? 'Brief Hazırlanıyor...' : 'Tasarım Briefi Üret'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ALT FİKİRLER & NİŞ KOMBİNASYONU */}
          {activeTab === 'sub_ideas' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Fikir Kombinasyon Motoru & Niche Çaprazlama
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fikrinizi geçmiş nişlerinizle çaprazlar. Zayıf kombinasyonları eler, en yüksek karlı olanları sunar.
                  </p>
                </div>

                <button
                  onClick={handleGenerateSubIdeas}
                  disabled={loadingSubIdeas}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loadingSubIdeas ? 'animate-spin' : ''}`} />
                  <span>{loadingSubIdeas ? 'Kombinasyonlar Üretiliyor...' : 'Alt Fikirleri Üret'}</span>
                </button>
              </div>

              {idea.subIdeas && idea.subIdeas.length > 0 ? (
                <div className="space-y-4">
                  {/* Recommended / Strong ideas */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-emerald-400" />
                      <span>Güçlü & Önerilen Kombinasyonlar (Yüksek ROI Potansiyeli)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {idea.subIdeas.filter(s => s.status === 'recommended').map((sub) => (
                        <div
                          key={sub.id}
                          className="p-4 bg-slate-950/70 border border-emerald-500/30 rounded-xl space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{sub.angle}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {sub.potential.toUpperCase()}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {sub.description}
                          </p>

                          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                            <div><strong className="text-slate-300">Hedef Alıcı:</strong> {sub.targetAudience}</div>
                            <div><strong className="text-emerald-400">Neden Seçildi:</strong> {sub.rationale}</div>
                          </div>

                          {onSpawnNewIdea && (
                            <button
                              onClick={() => onSpawnNewIdea({
                                title: `${idea.title} - ${sub.angle}`,
                                rawInput: `${sub.description}. Hedef Kitle: ${sub.targetAudience}`,
                                domain: 'etsy_pod'
                              })}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Bu Alt Fikri Yeni Proje Olarak Başlat</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pruned / Weak combinations */}
                  {idea.subIdeas.some(s => s.status === 'pruned') && (
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Elenen & Zayıf Kombinasyonlar (Zaman Kaybını Önlemek İçin Elendi)</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {idea.subIdeas.filter(s => s.status === 'pruned').map((sub) => (
                          <div
                            key={sub.id}
                            className="p-4 bg-slate-950/40 border border-rose-500/20 rounded-xl space-y-2 opacity-80"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span className="font-semibold line-through">{sub.angle}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                ELENDİ
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{sub.description}</p>
                            <div className="text-[11px] text-rose-300/90 italic">
                              <strong>Eleme Sebebi:</strong> {sub.rationale}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <GitFork className="w-8 h-8 text-amber-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">Bu fikir için henüz alt niş çaprazlaması yapılmadı</h3>
                  <button
                    onClick={handleGenerateSubIdeas}
                    disabled={loadingSubIdeas}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{loadingSubIdeas ? 'Kombinasyonlar Üretiliyor...' : 'Alt Fikirleri Üret'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/90 border-t border-slate-800">
          <button
            onClick={() => {
              if (confirm('Bu fikri silmek istediğinize emin misiniz?')) {
                onDeleteIdea(idea.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Fikri Sil</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
