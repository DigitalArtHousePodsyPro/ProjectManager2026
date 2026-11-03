import React, { useState } from 'react';
import { 
  Calendar, Clock, Sparkles, AlertCircle, CheckCircle, ArrowRight, 
  CalendarDays, ShoppingBag, Plus, RefreshCw, Flame, ExternalLink
} from 'lucide-react';
import { IdeaItem, DomainType } from '../types';
import { requestSeasonalIdeas } from '../services/aiService';

interface USCalendarViewProps {
  ideas: IdeaItem[];
  onAddIdeaFromCalendar: (idea: { title: string; rawInput: string; domain: DomainType }) => void;
}

interface SeasonalEventItem {
  id: string;
  name: string;
  month: string;
  eventDate: string; // YYYY-MM-DD
  icon: string;
  description: string;
  bestSellers: string[];
  historicalVolume: string;
}

const US_SEASONAL_EVENTS: SeasonalEventItem[] = [
  {
    id: 'val',
    name: "Valentine's Day (Sevgililer Günü)",
    month: 'Şubat',
    eventDate: '2027-02-14',
    icon: '❤️',
    description: 'Yılın en yüksek duygusal satın alma ve romantik kişiselleştirilmiş hediye dönemi.',
    bestSellers: ['"The Night We Met" Yıldız Haritası', 'İlk Dans Şarkısı Spotify Plaket', 'Çift Yemini & Tarihli Minimalist Tipografi'],
    historicalVolume: '140K+ Aylık Arama Hacmi'
  },
  {
    id: 'stp',
    name: "St. Patrick's Day",
    month: 'Mart',
    eventDate: '2027-03-17',
    icon: '☘️',
    description: 'İrlanda mirası, vintage yeşil tonlu illüstrasyonlar ve espri içeren grafik giyim/poster talebi.',
    bestSellers: ['Vintage İrlanda Haritası & Kelt Sembolleri', 'Yeşil Minimalist Botanik Duvar Sanatı', 'İrlanda Bira & Pub Patent Çizimi'],
    historicalVolume: '65K+ Aylık Arama Hacmi'
  },
  {
    id: 'mom',
    name: "Mother's Day (Anneler Günü)",
    month: 'Mayıs',
    eventDate: '2027-05-09',
    icon: '🌸',
    description: 'Etsy nin en büyük 2. hediyeleşme sezonu. Aile ve çocuk temalı ürünlerde conversion patlaması.',
    bestSellers: ['Doğum Ayı Çiçek Buketi (Birth Month Flower)', 'Anne ve Çocuklar İllüstrasyon Portresi', 'Büyükanne İçin Torun İsimli Bahçe Posteri'],
    historicalVolume: '210K+ Aylık Arama Hacmi'
  },
  {
    id: 'dad',
    name: "Father's Day (Babalar Günü)",
    month: 'Haziran',
    eventDate: '2026-06-21',
    icon: '🛠️',
    description: 'Erkek odası (man cave), garaj dekoru, araba blueprint ve balıkçılık temaları.',
    bestSellers: ['Babanın Arabası Özel Silüet & Spec Posteri', 'Vintage Olta & Kamp Patent Çizimleri', 'Baba & Çocuk Nostaljik Çizgi Çizimi'],
    historicalVolume: '130K+ Aylık Arama Hacmi'
  },
  {
    id: 'july4',
    name: "4th of July (Bağımsızlık Günü)",
    month: 'Temmuz',
    eventDate: '2026-07-04',
    icon: '🎆',
    description: 'Amerikan nostaljisi, vintage vatanseverlik ve yazlık ev/veranda dekorasyonu.',
    bestSellers: ['Vintage Amerikan Bayrağı & Harita Reprodüksiyonu', 'Bağımsızlık Bildirgesi Eskitme Parşömen', 'Amerikan Klasik Araba & Kasaba Posteri'],
    historicalVolume: '85K+ Aylık Arama Hacmi'
  },
  {
    id: 'hall',
    name: "Halloween (Cadılar Bayramı)",
    month: 'Ekim',
    eventDate: '2026-10-31',
    icon: '🎃',
    description: 'Gothic sanat, büyücülük (witchy), vintage botanik ve çocuk odası sevimli hayalet konseptleri.',
    bestSellers: ['Vintage Gothic Karga & İskelet Çizimi', 'Sevimli Hayaletli Çocuk Odası Baskısı', 'Balkabağı Tarlası Yağlıboya Reprodüksiyonu'],
    historicalVolume: '280K+ Aylık Arama Hacmi'
  },
  {
    id: 'thx',
    name: "Thanksgiving (Şükran Günü)",
    month: 'Kasım',
    eventDate: '2026-11-26',
    icon: '🦃',
    description: 'Sonbahar mutfak dekorasyonu, şükran/aile sofrası posterleri ve sıcak toprak renkleri.',
    bestSellers: ['Sonbahar Yapraklı Aile Soyadı Posteri', 'Minimalist "Give Thanks" Tipografisi', 'Rustik Çiftlik Evi Mutfak Sanatı'],
    historicalVolume: '110K+ Aylık Arama Hacmi'
  },
  {
    id: 'xmas',
    name: "Christmas & Holiday Season (Noel)",
    month: 'Aralık',
    eventDate: '2026-12-25',
    icon: '🎄',
    description: 'Etsy de yılın en çılgın satış dönemi. Mağaza cirosunun %40 ı bu 2 ayda gerçekleşir.',
    bestSellers: ['İlk Ev Noel Süsü Posteri (First Home Christmas)', 'Nostaljik Karlı Çam Ormanı Tablosu', 'Aile Soyadı Noel Şarkı Sözleri'],
    historicalVolume: '450K+ Aylık Arama Hacmi'
  },
  {
    id: 'superbowl',
    name: "Super Bowl (YouTube & Sports)",
    month: 'Şubat',
    eventDate: '2027-02-07',
    icon: '🏈',
    description: 'YouTube spor otomasyonu ve Etsy parti dekorasyonu için devasa trafik dönemi.',
    bestSellers: ['Spor Analiz Videoları (YouTube)', 'Super Bowl Parti Oyunları (Etsy)', 'NFL Nostalji Patent Çizimleri'],
    historicalVolume: '1M+ Video İzlenme Potansiyeli'
  },
  {
    id: 'apple_event',
    name: "Apple/Tech Event (AI & Apps)",
    month: 'Eylül',
    eventDate: '2026-09-10',
    icon: '🍎',
    description: 'Yeni teknoloji lansmanları. YouTube teknoloji kanalları ve AI uygulama projeleri için kritik.',
    bestSellers: ['Yeni Özellik İnceleme Videoları', 'iOS Widget & Wallpaper Paketleri', 'AI Verimlilik Araçları'],
    historicalVolume: 'Tech Trend Patlaması'
  }
];

export const USCalendarView: React.FC<USCalendarViewProps> = ({
  ideas,
  onAddIdeaFromCalendar
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('hall');
  const [loadingEvent, setLoadingEvent] = useState<boolean>(false);
  const [customPlan, setCustomPlan] = useState<any>(null);

  const selectedEvent = US_SEASONAL_EVENTS.find(e => e.id === selectedEventId) || US_SEASONAL_EVENTS[0];

  // Calculate Reverse Production Countdown:
  // Launch: 60 days before eventDate
  // Design: 75 days before eventDate
  // Research: 90 days before eventDate
  const eventDateObj = new Date(selectedEvent.eventDate);
  const now = new Date();

  const launchDate = new Date(eventDateObj);
  launchDate.setDate(launchDate.getDate() - 60);

  const designDate = new Date(eventDateObj);
  designDate.setDate(designDate.getDate() - 75);

  const researchDate = new Date(eventDateObj);
  researchDate.setDate(researchDate.getDate() - 90);

  const diffDays = Math.ceil((launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = diffDays <= 20 && diffDays >= 0;
  const isPast = diffDays < 0;

  const handleGeneratePlanForEvent = async () => {
    setLoadingEvent(true);
    try {
      const plan = await requestSeasonalIdeas(selectedEvent.name, selectedEvent.eventDate);
      setCustomPlan(plan);
    } catch (err) {
      console.error('Failed to generate seasonal plan:', err);
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleAdoptIdea = (title: string, rawInput: string) => {
    let domain: DomainType = 'etsy_pod';
    if (selectedEvent.id === 'superbowl') domain = 'youtube_automation';
    if (selectedEvent.id === 'apple_event') domain = 'ai_apps';
    
    onAddIdeaFromCalendar({
      title,
      rawInput,
      domain
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Top Banner Notice */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇺🇸</span>
            <h2 className="text-base font-bold text-white">
              ABD Sezonluk Takvimi & 2 Ay Önceden Proaktif Üretim Motoru
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Etsy algoritması bir listelemenin arama sonuçlarında indekslenip organik sıralama alması için <strong>45-60 güne</strong> ihtiyaç duyar. Önemli bir gün geldiğinde listelemeyi açmak çok geçtir; en az 2 ay önceden yayına girmelidir!
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-slate-900/90 border border-amber-500/30 rounded-xl text-center">
            <div className="text-[10px] text-amber-400 uppercase font-semibold">Stratejik Kural</div>
            <div className="text-xs font-bold text-white font-mono">60 Gün Önce Yayında Ol!</div>
          </div>
        </div>
      </div>

      {/* Grid of 8 US Key Events */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {US_SEASONAL_EVENTS.map((evt) => {
          const isSelected = evt.id === selectedEventId;
          const eDate = new Date(evt.eventDate);
          const lDate = new Date(eDate);
          lDate.setDate(lDate.getDate() - 60);
          const remaining = Math.ceil((lDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <button
              key={evt.id}
              onClick={() => {
                setSelectedEventId(evt.id);
                setCustomPlan(null);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-2xl">{evt.icon}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  remaining > 0 
                    ? remaining <= 20 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold' 
                      : 'bg-slate-800 text-slate-400'
                    : 'bg-slate-800/50 text-slate-500'
                }`}>
                  {remaining > 0 ? `${remaining} gün` : 'Aktif Sezon'}
                </span>
              </div>
              <div className="font-semibold text-xs text-white truncate">{evt.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{evt.month} ({new Date(evt.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })})</div>
            </button>
          );
        })}
      </div>

      {/* Selected Event Deep-Dive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Reverse Timeline & Proactive Plan */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-slate-950 rounded-xl border border-slate-800">{selectedEvent.icon}</span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedEvent.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
                      {selectedEvent.historicalVolume}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedEvent.description}</p>
                </div>
              </div>

              <button
                onClick={handleGeneratePlanForEvent}
                disabled={loadingEvent}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Sparkles className={`w-3.5 h-3.5 ${loadingEvent ? 'animate-spin' : ''}`} />
                <span>{loadingEvent ? 'Fikirler Üretiliyor...' : 'Yapay Zeka Fikirleri Üret'}</span>
              </button>
            </div>

            {/* REVERSE PRODUCTION TIMELINE BAR */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Geriye Doğru Üretim Takvimi (Reverse Production Timeline)</span>
                </span>
                <span className={`font-mono text-xs font-semibold ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                  {diffDays > 0 ? `Lansmana ${diffDays} Gün Kaldı` : 'Sezon Yayında'}
                </span>
              </div>

              {/* 3 Step Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {/* Step 1: Research */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-sky-400 flex items-center justify-between">
                    <span>1. Araştırma & Niche</span>
                    <span className="font-mono text-slate-500">90 Gün Önce</span>
                  </div>
                  <div className="text-xs font-semibold text-white font-mono">
                    {researchDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    eRank & EverBee ile arama terimlerini ve rakiplerin boş bıraktığı alt nişleri belirle.
                  </p>
                </div>

                {/* Step 2: Design */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 flex items-center justify-between">
                    <span>2. Tasarım & Mockup</span>
                    <span className="font-mono text-slate-500">75 Gün Önce</span>
                  </div>
                  <div className="text-xs font-semibold text-white font-mono">
                    {designDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Midjourney v6.1 ile 5 görsel konsepti ve Canva ile 10 mockup/infografik setini hazırla.
                  </p>
                </div>

                {/* Step 3: Launch */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-between">
                    <span>3. Yayına Alma (Launch)</span>
                    <span className="font-mono text-amber-300">60 Gün Önce</span>
                  </div>
                  <div className="text-xs font-semibold text-white font-mono">
                    {launchDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Listelemeleri Etsy de aç! Algoritma 2 ayda indeksleyip tepe aramalara sokacaktır.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom AI Generated Plan or Preloaded Proactive Concepts */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Bu Sezon İçin Proaktif Fikirler & Hızlı Proje Oluşturma</span>
              </h4>

              {customPlan ? (
                <div className="p-4 bg-slate-950/90 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in">
                  <div className="text-xs text-amber-300 font-semibold">{customPlan.proactiveIdea}</div>
                  
                  {customPlan.actionSteps && (
                    <div className="space-y-1.5">
                      {customPlan.actionSteps.map((step: string, idx: number) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleAdoptIdea(`${selectedEvent.name} Poster Koleksiyonu`, customPlan.proactiveIdea)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bu Sezonluk Fikri Projelerime Ekle</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedEvent.bestSellers.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-100">{item}</span>
                      </div>

                      <button
                        onClick={() => handleAdoptIdea(item, `${selectedEvent.name} için yüksek arama hacimli sezonluk Etsy posteri: ${item}`)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Projeye Ekle</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Production Readiness & Rules Card */}
        <div className="space-y-5">
          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Sezonluk Satış Kuralları</span>
            </h4>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-semibold text-amber-300">1. Telif Haklarına Dikkat (No TM)</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Resmi Disney, Marvel veya NFL logoları yerine genel temalar (vintage balkabağı, karlı çam ağacı, retro futbol silüeti) kullanın.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-semibold text-amber-300">2. Sezonluk Mockup Kullanımı</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Halloween listelemesinde balkabaklı oda mockupı; Noel de şömineli ve çam ağaçlı sıcak oda mockupı satışları %150 artırır.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-semibold text-amber-300">3. Erken Fiyat İndirimi</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Lansmanın ilk 2 haftasında %25 "Erken Sezon İndirimi" açarak algoritmanın ilk satışları kaydetmesini ve tepeye taşımasını sağlayın.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
