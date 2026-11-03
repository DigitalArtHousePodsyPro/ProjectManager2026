import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Sparkles, X, Check, ArrowRight, CornerDownLeft, Volume2, AlertCircle } from 'lucide-react';
import { DomainType, PriorityType } from '../types';
import { requestAudioTranscription, requestAiActionPlan } from '../services/aiService';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDomain?: DomainType;
  onSaveIdea: (ideaData: {
    title: string;
    rawInput: string;
    domain: DomainType;
    priority: PriorityType;
    generateActionPlanImmediately: boolean;
  }) => Promise<void>;
  existingIdeas: import('../types').IdeaItem[];
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  defaultDomain = 'etsy_pod',
  onSaveIdea,
  existingIdeas
}) => {
  const [domain, setDomain] = useState<DomainType>(defaultDomain);
  const [rawText, setRawText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [priority, setPriority] = useState<PriorityType>('medium');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const animationFrameRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (defaultDomain && defaultDomain !== ('all' as any)) {
      setDomain(defaultDomain);
    }
  }, [defaultDomain]);

  // Keyboard shortcut: close on Escape, submit on Cmd/Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        stopRecording();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, rawText, customTitle, domain, priority]);

  // Audio recording handlers
  const startRecording = async () => {
    try {
      setStatusMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Audio volume visualizer setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const updateVolume = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // MediaRecorder setup
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }
        cancelAnimationFrame(animationFrameRef.current);
        setAudioVolume(0);

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

      // Web Speech API for real-time speech preview if available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'tr-TR';

          recognition.onresult = (event: any) => {
            let transcriptText = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcriptText += event.results[i][0].transcript;
            }
            if (transcriptText.trim()) {
              setRawText(prev => (prev ? `${prev} ` : '') + transcriptText.trim());
              detectDomainFromText(transcriptText);
            }
          };
          recognition.start();
        } catch (e) {
          console.warn('SpeechRecognition error / already started:', e);
        }
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setStatusMessage('Mikrofon erisimi saglanamadi. Lutfen tarayici izinlerini kontrol edin.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processRecordedAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    if (audioBlob.size < 1000) return;

    setIsTranscribing(true);
    setStatusMessage('Ses analiz ediliyor ve yapay zeka ile metne dokuluyor...');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
          const res = await requestAudioTranscription(base64Data, audioBlob.type);
          if (res.transcript) {
            setRawText(prev => prev ? `${prev}\n${res.transcript}` : res.transcript);
            if (res.suggestedDomain && ['etsy_pod', 'youtube_automation', 'ai_apps'].includes(res.suggestedDomain)) {
              setDomain(res.suggestedDomain);
            }
            if (res.quickTitle && !customTitle) {
              setCustomTitle(res.quickTitle);
            }
            setStatusMessage('Ses basariyla metne donusturuldu!');
          }
        } catch (err: any) {
          console.error('Transcription API error:', err);
          setStatusMessage('Ses kaydedildi. Metin alanina manuel not ekleyebilirsiniz.');
        } finally {
          setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      setIsTranscribing(false);
    }
  };

  // Smart domain detection based on keywords
  const detectDomainFromText = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('endonezya') || lower.includes('indonesia') || lower.includes('kitap') || lower.includes('kdp')) {
      setDomain('indonesia');
    } else if (lower.includes('etsy') || lower.includes('tshirt') || lower.includes('sweatshirt') || lower.includes('niche') || lower.includes('print on demand') || lower.includes('pod') || lower.includes('poster') || lower.includes('kupa')) {
      setDomain('etsy_pod');
    } else if (lower.includes('youtube') || lower.includes('video') || lower.includes('hook') || lower.includes('script') || lower.includes('kanal') || lower.includes('thumbnail') || lower.includes('elevenlabs') || lower.includes('itiraf') || lower.includes('sorgu')) {
      setDomain('youtube_automation');
    } else if (lower.includes('app') || lower.includes('yapay zeka') || lower.includes('saas') || lower.includes('kod') || lower.includes('api') || lower.includes('yazilim') || lower.includes('mvp')) {
      setDomain('ai_apps');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    detectDomainFromText(val);
  };

  const handleSave = async (generateActionPlanImmediately: boolean) => {
    if (!rawText.trim() && !customTitle.trim()) {
      setStatusMessage('Lutfen bir fikir notu girin veya sesinizi kaydedin.');
      return;
    }

    const generatedOrCustomTitle = customTitle.trim() || rawText.trim().split('\n')[0].slice(0, 60);

    // Duplicate detection
    const isDuplicate = existingIdeas.some(i => 
      i.title.toLowerCase().includes(generatedOrCustomTitle.toLowerCase()) ||
      generatedOrCustomTitle.toLowerCase().includes(i.title.toLowerCase())
    );

    if (isDuplicate) {
      const confirm = window.confirm(`Benzer bir fikriniz zaten var: "${generatedOrCustomTitle}". Yine de kaydetmek istiyor musunuz?`);
      if (!confirm) return;
    }

    setIsSubmitting(true);
    try {
      await onSaveIdea({
        title: generatedOrCustomTitle,
        rawInput: rawText.trim(),
        domain,
        priority,
        generateActionPlanImmediately
      });
      // Reset form
      setRawText('');
      setCustomTitle('');
      setStatusMessage(null);
      onClose();
    } catch (err: any) {
      console.error('Error saving idea:', err);
      setStatusMessage('Fikir kaydedilirken bir hata olustu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Hizli Fikir & Sesli Not Yakala</h2>
              <p className="text-xs text-slate-400">Aklina geleni hemen konus veya yaz; Gemini planlasin.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Domain Selector (Interactive Segmented Control) */}
        <div className="px-6 pt-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Hangi is alani icin kaydediyorsun?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setDomain('etsy_pod')}
              className={`py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer truncate ${
                domain === 'etsy_pod'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛍️ Etsy POD
            </button>
            <button
              type="button"
              onClick={() => setDomain('youtube_automation')}
              className={`py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer truncate ${
                domain === 'youtube_automation'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎬 YouTube
            </button>
            <button
              type="button"
              onClick={() => setDomain('ai_apps')}
              className={`py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer truncate ${
                domain === 'ai_apps'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ AI Apps
            </button>
          </div>
        </div>

        {/* Audio Recording & Waveform Zone */}
        <div className="px-6 pt-4">
          <div className={`p-4 rounded-xl border transition-all ${
            isRecording 
              ? 'bg-rose-950/20 border-rose-800/80 shadow-inner' 
              : 'bg-slate-950/50 border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Kaydi Durdur</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isTranscribing}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Ses Kaydini Baslat</span>
                  </button>
                )}

                {isRecording && (
                  <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
                {isTranscribing && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Yapay zeka sesinizi metne aktariyor...</span>
                  </div>
                )}
              </div>

              {/* Dynamic waveform visualizer bars */}
              {isRecording && (
                <div className="flex items-center gap-1 h-6">
                  {[...Array(12)].map((_, i) => {
                    const heightMultiplier = Math.max(15, (audioVolume * (i % 3 + 1)) % 100);
                    return (
                      <div
                        key={i}
                        className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                        style={{ height: `${heightMultiplier}%` }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Fikir Notu / Ham Dusunce
            </label>
            <textarea
              value={rawText}
              onChange={handleTextChange}
              placeholder="Ornek: Etsy icin vintage kovboy sweatshirt'leri veya YouTube icin '5 gizli yapay zeka araci' videosu veya ses kaydi yap..."
              rows={4}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/80 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Baslik (Istege Bagli)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Bos birakirsaniz yapay zeka uretir"
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-lg text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400/80"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Oncelik Derecesi
              </label>
              <div className="flex items-center gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                {(['low', 'medium', 'high'] as PriorityType[]).map((p) => {
                  const labels: Record<PriorityType, string> = {
                    low: 'Dusuk',
                    medium: 'Normal',
                    high: 'Yuksek 🔥'
                  };
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1 px-2 rounded font-medium transition-colors cursor-pointer ${
                        priority === p
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {labels[p]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono">⌘ + Enter</kbd>
            <span>ile aninda kaydet</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSubmitting || (!rawText.trim() && !customTitle.trim())}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Yalnizca Not Olarak Kaydet
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSubmitting || (!rawText.trim() && !customTitle.trim())}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Plana Donusturuluyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kaydet & AI Plani Uret</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
