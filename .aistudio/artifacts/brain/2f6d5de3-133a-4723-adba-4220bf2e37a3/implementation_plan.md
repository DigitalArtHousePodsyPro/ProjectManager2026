# OmniFocus Idea OS - Coklu Is Alani Fikir Yonetim Merkezi

Etsy Print-on-Demand, YouTube Video Otomasyonu ve AI Uygulama Gelistirme alanlarinda uretilen spontane fikirlerin kaybolmasini engelleyen, sesli ve metinle aninda kaydedip yapay zeka ile somut aksiyon planlarina donusturen kisisel uretkenlik merkezi.

## User Review & Critical Decisions

> [!IMPORTANT]
> Kullanici tarafindan netlestirilen kararlar ve teknik tercihler:

- **Confirmed Decision 1 (Calisma Alanlari)**: 3 ana is kolu (Etsy POD, YouTube Otomasyonu, AI Apps) icin bagimsiz ama tek bir tikla gecilebilen ozel panolar ve sablonlar kurulacak.
- **Confirmed Decision 2 (Yakalama Yontemi)**: Web Audio API tabanli ses kaydi + tek tikla yapay zeka transkripsiyonu ve klavye kisayollu (Ctrl/Cmd + K) quick-capture kutusu.
- **Confirmed Decision 3 (Yapay Zeka Destegi)**: Ham fikri alip ilgili is kolunun ozel formatina gore (Etsy: Niche & Urun Tipi & Hedef Kitle; YouTube: Hook, Video Format & Otomasyon Adimlari; AI Apps: Problem, Cozum, Tech Stack & MVP Asamalari) yapilandiran analiz motoru.
- **Open Question / Choice 4 (Veri Kaliciligi)**: Tarayicida sifir gecikmeli, kisisel ve gizli yerel depolama (IndexedDB / LocalStorage) + JSON yedek alma/geri yukleme (Recommended Default).

---

## 1. Overview & Core Concept

- **What It Does**: Dagilmis notlar, ekran goruntuleri ve unutulan ses kayitlari yerine; aninda basilan mikrofon tusu veya metin kutusu ile ham fikri yakalar, Gemini 3.8 Flash modeliyle analiz ederek secili is koluna ozel detayli aksiyon planina, asamali gorev listesine ve kaynak baglantilarina donusturur.
- **Target Audience / Persona**: Birden cok dijital gelir akisini ve uretim surecini ayni anda yuruten solopreneur / icerik ureticisi / gelistirici.
- **Key Value**: Fikir akisini bolmeden 5 saniyede kaydetme, "ben bunu ne yapacaktim?" karmasasini yok edip doğrudan uygulanabilir gorev kartlarina donusturme.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Evrensel Hizli Yakalama (Universal Quick Capture)**:
   - Kullanici sayfadayken veya `Cmd/Ctrl + K` bastiginda mini modal / floating bar acilir.
   - Mikrofon tusuna basip konusabilir (orn: "Etsy icin vintage kopek cinsi sweatshirt serisi dusundum") veya metin yazabilir.
   - Yapay zeka dili ve is alanini anlar, ilgili panoya taslak olarak atar ve "Aksiyon Planina Donustur" secenegini sunar.
2. **3 Ozel Calisma Alani (Domain Workspaces)**:
   - **Etsy POD Workspace**: Trend Niche arastirmasi, urun tipi (T-shirt, kupa, poster vb.), hedef kitle, rakip arama kelimeleri, gorsel konsepti ve tasarim gorevleri.
   - **YouTube Automation Workspace**: Video basligi alternatifleri, dikkat cekici ilk 30 saniye hook'u, script omurgasi, seslendirme & gorsel birlestirme otomasyon prompt'lari.
   - **AI Apps Workspace**: Cozulen ana problem, hedef kitle, onerilen teknoloji yigini (Next.js, FastAPI, Gemini API vb.), MVP ozellik listesi ve adim adim gelistirme yol haritasi.
3. **Kanban & Liste Gorunumleri (Pipeline Management)**:
   - Her is kolu icin: *Taslak / Fikir* -> *Arastirma & Analiz* -> *Uretim / Gelistirme* -> *Yayinlandi / Canlida*.
   - Kart icinde yapay zeka tarafindan uretilmis kontrol listesi (Checklist) tiklanabilir durumdadir.
4. **Veri Guvenligi & Export**:
   - Tum notlar kullanicinin tarayicisinda aninda kaydedilir. Tek tikla Markdown veya JSON disari aktarma destegi.

### Visual Identity & Theme

- **Aesthetic Direction**: Sleek, distraction-free solopreneur command center. Clean lines, razor-sharp typography, deliberate spacing.
- **Color Palette & Mood**: 
  - Canvas: Slate 950 / Deep Charcoal (`#090D16`) dark theme ile modern light theme destegi.
  - Category Accents:
    - Etsy POD: Warm Amber / Terracotta accent (`#F59E0B`)
    - YouTube Automation: Rich Crimson / Ruby accent (`#EF4444`)
    - AI Apps: Electric Indigo / Cyan accent (`#6366F1`)
- **Typography & Hierarchy**: `Plus Jakarta Sans` for titles and structure, `DM Sans` for smooth reading, `JetBrains Mono` for metadata, tags, and timestamps.
- **Motion & Feedback**: 150ms micro-transitions, smooth audio waveform visualizer during recording, collapsible side navigation.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side AI Gateway**:
  - *Chosen Approach*: Vite dev middleware ve `server.ts` uzerinden calisan guvenli `/api/ai/transform` ve `/api/ai/transcribe` rotalari.
  - *Why*: API anahtarini guvende tutar, Gemini 3.8 Flash modelinin yapilandirilmis JSON schema ciktilarini dogrudan frontend modellerine baglar.
- **Decision 2: Audio Recording & Speech Processing**:
  - *Chosen Approach*: Web Audio API ile dahili mikrofon kaydi; browser SpeechRecognition destegi varsa anlik gorsellestirme, ardindan Gemini ile profesyonel duzeltme ve zenginlestirme.
  - *Why*: Tarayici izinleriyle dogrudan calisir, kullanici harici araclara ihtiyac duymaz.
- **Decision 3: Offline-First Local Persistence**:
  - *Chosen Approach*: `localStorage` + reactive state store, otomatik JSON import/export.
  - *Why*: Dis bagimlilik ve login bariyeri olmaksizin aninda kullanilabilir; kullanici verileri tamamen ozel kalir.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OmniFocus Idea OS (UI)                          │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar: Workspace Switcher · Global Search · Quick Audio/Text Modal  │
├──────────────────┬─────────────────────────────────────────────────────┤
│   Sidebar Nav    │                 Main View Area                      │
│ ──────────────── │ ─────────────────────────────────────────────────── │
│ 📦 All Inboxes   │ [Kanban Board / Table View / Focus Action View]    │
│ 🛍️ Etsy POD      │                                                     │
│ 🎬 YouTube Auto  │ [Idea Cards: Stage · Tags · Checklist · AI Plan]   │
│ ⚡ AI Apps       │                                                     │
│ ⚙️ Backup/Export │ [Drawer / Modal: AI Action Plan Generator & Detail] │
└──────────────────┴─────────────────────────────────────────────────────┘
                                   │
                                   ▼ API Proxy
┌────────────────────────────────────────────────────────────────────────┐
│           Node.js / Express Server API (/api/ai/transform)             │
│        @google/genai SDK (gemini-3.8-flash) Structured Output          │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model

```ts
interface IdeaItem {
  id: string;
  title: string;
  rawInput: string;
  domain: 'etsy_pod' | 'youtube_automation' | 'ai_apps';
  status: 'inbox' | 'research' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  tags: string[];
  actionPlan?: {
    summary: string;
    domainSpecifics: {
      // Etsy: niche, productType, targetAudience, keywords
      // YouTube: hooks, videoFormat, automationSteps
      // AI Apps: problem, techStack, mvpFeatures
      [key: string]: any;
    };
    checklists: { text: string; done: boolean }[];
    notes: string;
  };
}
```
