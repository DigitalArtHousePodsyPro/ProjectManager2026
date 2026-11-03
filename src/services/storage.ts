import { IdeaItem, DomainType, StatusType, MaturityScoreBreakdown } from '../types';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'omnifocus_ideas_v4';

export const calculateMaturityScore = (idea: IdeaItem): MaturityScoreBreakdown => {
  let score = 0;
  const breakdown: MaturityScoreBreakdown = {
    score: 0,
    isReadyToPublish: false,
    researchDone: !!(idea.groundedResearch || idea.dataComparison),
    listingDraftDone: !!idea.etsyListing,
    visualConceptsDone: !!(idea.visualConcepts && idea.visualConcepts.length >= 10),
    designBriefDone: !!idea.designBrief,
    subIdeasDone: !!(idea.subIdeas && idea.subIdeas.length > 0),
  };

  if (breakdown.researchDone) score += 20;
  if (breakdown.listingDraftDone) score += 25;
  if (breakdown.visualConceptsDone) score += 25;
  if (breakdown.designBriefDone) score += 15;
  if (breakdown.subIdeasDone) score += 15;

  breakdown.score = score;
  breakdown.isReadyToPublish = score >= 100;
  return breakdown;
};

// -------------------------------------------------------------
// 21 REAL SOLOPRENEUR PROJECTS (ALL AT RAW IDEA / INBOX STAGE)
// -------------------------------------------------------------
export const REAL_USER_PROJECTS: IdeaItem[] = [
  // --- 8 ETSY PRINT-ON-DEMAND PROJECTS ---
  {
    id: 'etsy-01',
    title: 'Kişiselleştirilmiş Spotify Şarkı & Dalga Akrilik Plak',
    rawInput: 'Spotify şarkı kodu taranabilir, şeffaf pleksi akrilik cam üzerinde özel çift fotoğrafı ve ses dalgası.',
    domain: 'etsy_pod',
    status: 'inbox',
    priority: 'high',
    tags: ['etsy pod', 'spotify plaque', 'custom gift', 'acrylic art', 'anniversary'],
    createdAt: '2026-10-15T09:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'Kişiye özel Spotify ses kodu ve fotoğraf baskılı şeffaf akrilik stand. Sevgililer ve yıldönümü hediyesi olarak yüksek dönüşümlü.',
      tags: ['spotify code', 'custom plaque', 'gift for couple', 'acrylic music print'],
      domainSpecifics: {
        niche: 'Kişiselleştirilmiş Müzik & Yıldönümü Hediyeleri',
        productType: '8x10 inç Şeffaf Akrilik Pleksi + Ahşap LED Stand',
        targetAudience: 'Çiftler, müzikseverler, doğum günü ve yıldönümü hediyesi arayanlar',
        tags: ['custom spotify glass', 'song plaque acrylic', 'anniversary gift', 'scannable music code'],
        designConcept: 'Minimalist şeffaf layout, Spotify player arayüzü, 300 DPI UV baskı şablonu.',
        competitionInsight: 'Ahşap LED ışıklı taban ve hediye paketi seçeneği sunarak rakiplerden ayrışın.'
      },
      checklist: [
        { id: 'c1', text: 'Spotify Developer API veya barkod şablonunu Canva içine aktar', done: false, tool: 'Canva', priority: 'high' },
        { id: 'c2', text: 'Printify şeffaf akrilik stand mockuplarını hazırla', done: false, tool: 'Printify', priority: 'high' },
        { id: 'c3', text: '13 Etsy etiketini ve fiyatlandırma varyasyonlarını gir', done: false, tool: 'Etsy', priority: 'medium' }
      ],
      strategicNotes: 'Müşteriden şarkı linki ve fotoğrafı 12 saat içinde onaylatmak iadeleri sıfırlar.',
      generatedAt: '2026-10-15T09:30:00.000Z'
    }
  },
  {
    id: 'etsy-02',
    title: 'Minimalist Vintage 911 / Otomobil Silüet Sanat Posteri',
    rawInput: 'Klasik Porsche 911 ve retro spor araba teknik çizim silüeti, minimalist Bauhaus tarzı müze mat posteri.',
    domain: 'etsy_pod',
    status: 'inbox',
    priority: 'high',
    tags: ['etsy pod', 'car poster', 'porsche 911', 'garage wall art', 'minimalist'],
    createdAt: '2026-10-18T11:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'Klasik araba meraklıları ve modern garaj/ofis dekorasyonu için yüksek çözünürlüklü vektör silüet poster serisi.',
      tags: ['car silhouette', 'vintage 911', 'garage decor', 'minimalist car print'],
      domainSpecifics: {
        niche: 'Otomobil Meraklıları & Erkek Ofis/Garaj Duvar Sanatı',
        productType: '200 GSM Heavyweight Matte Poster (18x24 ve 24x36)',
        targetAudience: 'Klasik araba tutkunları, mimarlar ve minimalist iç mekan tasarımcıları',
        tags: ['porsche art print', 'vintage car silhouette', 'garage wall art', 'minimalist car poster'],
        designConcept: 'Bauhaus renk blokları, teknik aks aralığı metrikleri, monochrome silüet.',
        competitionInsight: 'Gövde kodları (930, 964, 993) serilerini 3lü set halinde sunarak sepet tutarını artırın.'
      },
      checklist: [
        { id: 'c4', text: 'Vektör silüet çizimlerini Illustrator/Midjourney ile hazırla', done: false, tool: 'Midjourney', priority: 'high' },
        { id: 'c5', text: 'Gerçekçi lüks daire ve garaj mockup koleksiyonunu oluştur', done: false, tool: 'Canva', priority: 'high' },
        { id: 'c6', text: 'Arama hacmi yüksek 13 etiketi keyword deposundan seç', done: false, tool: 'eRank', priority: 'medium' }
      ],
      strategicNotes: 'Erkek hediyeleri kategorisinde babalar günü ve noel döneminde en çok satan nişlerden biridir.',
      generatedAt: '2026-10-18T11:30:00.000Z'
    }
  },
  {
    id: 'etsy-03',
    title: 'Retro 90\'lar Film & Sinema Tipografi Posteri Serisi',
    rawInput: 'Pulp Fiction, Fight Club ve Matrix gibi 90lar kült filmleri için minimalist tipografik ve sinematik renk paletli posterler.',
    domain: 'etsy_pod',
    status: 'inbox',
    priority: 'medium',
    tags: ['etsy pod', 'movie poster', 'vintage cinema', '90s aesthetic'],
    createdAt: '2026-10-20T14:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Kült filmlerin ikonik diyalogları ve minimalist renk şeritleriyle tasarlanmış modern sinema odası poster koleksiyonu.',
      tags: ['retro movie print', 'cinema wall decor', 'minimalist film poster'],
      domainSpecifics: {
        niche: 'Kült Sinema & Ev Sineması Duvar Sanatı',
        productType: '18x24 inç Arşivlik Mat Kağıt',
        targetAudience: 'Sinefiller, üniversite öğrencileri ve retro dekorasyon sevenler'
      },
      checklist: [
        { id: 'c7', text: 'Telif haklarına uygun fan-art & tipografi tasarımını netleştir', done: false, tool: 'Canva', priority: 'high' },
        { id: 'c8', text: 'Ev sineması ortamında sergilenen mockuplar hazırla', done: false, tool: 'Printify', priority: 'medium' }
      ],
      generatedAt: '2026-10-20T14:30:00.000Z'
    }
  },
  {
    id: 'etsy-04',
    title: 'Estetik Albüm Kapağı & Şarkı Sözü Duvar Sanatı Baskısı',
    rawInput: 'Popüler müzik albümlerinin renk paleti analizi, süre listesi ve favori şarkı sözüyle hazırlanan estetik galeri duvarı baskısı.',
    domain: 'etsy_pod',
    status: 'inbox',
    priority: 'medium',
    tags: ['etsy pod', 'album cover poster', 'music wall art', 'room aesthetic'],
    createdAt: '2026-10-12T08:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Genç odaları ve modern çalışma alanları için Pinterest estetiğinde albüm kapağı konsept posterleri.',
      tags: ['album receipt print', 'custom music poster', 'bedroom wall decor'],
      domainSpecifics: {
        niche: 'Pinterest Estetiği Genç Odası & Müzik Sanatı',
        productType: 'A3 & A2 Boyutunda Dijital İndirme ve Fiziki Poster'
      },
      checklist: [
        { id: 'c9', text: '10 popüler albüm şablonunu tamamla', done: false, tool: 'Canva', priority: 'high' },
        { id: 'c10', text: 'Etsy mağazasında dijital download olarak yayına al', done: false, tool: 'Etsy', priority: 'high' }
      ],
      generatedAt: '2026-10-12T08:30:00.000Z'
    }
  },
  {
    id: 'etsy-05',
    title: '2026 Minimalist Sanatsal Masa & Duvar Takvimi (Aylık)',
    rawInput: 'Her ay için farklı bir soyut botanik çizim içeren, temiz çizgili 2026 takvimi. Hem dijital yazdırılabilir hem fiziki.',
    domain: 'etsy_pod',
    status: 'inbox',
    priority: 'high',
    tags: ['etsy pod', '2026 calendar', 'desk planner', 'printable calendar'],
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'Yılbaşı hediyelikleri ve yeni yıl planlaması için 12 aylık minimalist botanik takvim projesi.',
      tags: ['2026 printable calendar', 'botanical desk calendar', 'new year gift'],
      domainSpecifics: {
        niche: 'Yeni Yıl Kırtasiye & Planlama',
        productType: 'Spiralli Masa Takvimi ve A4 Duvar Takvimi'
      },
      checklist: [
        { id: 'c11', text: '12 ayın tarih ve tatil günlerini doğrula', done: false, tool: 'Canva', priority: 'high' },
        { id: 'c12', text: 'Midjourney ile 12 benzersiz botanik illüstrasyon üret', done: false, tool: 'Midjourney', priority: 'high' }
      ],
      generatedAt: '2026-10-25T10:30:00.000Z'
    }
  },
  {
    id: 'etsy-06',
    title: 'Özel Yıldız Haritası & Evlilik / Doğum Koordinat Tablosu',
    rawInput: 'Seçilen tarih, saat ve şehirdeki gerçek gökyüzü yıldız haritası. Altında özel not ve GPS koordinatları.',
    domain: 'etsy_pod',
    status: 'inbox',
    priority: 'high',
    tags: ['etsy pod', 'star map', 'custom constellation', 'wedding gift'],
    createdAt: '2026-10-10T12:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'Düğün, ilk buluşma veya doğum anını ölümsüzleştiren kişiselleştirilmiş yıldız haritası.',
      tags: ['custom star map', 'the night we met', 'coordinates art print'],
      domainSpecifics: {
        niche: 'Romantik & Duygusal Kişiselleştirilmiş Hediyeler',
        productType: 'Çerçeveli Ahşap Poster ve Kanvas'
      },
      checklist: [
        { id: 'c13', text: 'Otomatik yıldız haritası jeneratör şablonunu oluştur', done: false, tool: 'Canva', priority: 'high' },
        { id: 'c14', text: 'Etsy listelemesini ve 13 etiketi yayına al', done: false, tool: 'Etsy', priority: 'high' }
      ],
      generatedAt: '2026-10-10T12:30:00.000Z'
    }
  },
  {
    id: 'etsy-07',
    title: 'Soyut Boho Galeri Duvarı 3\'lü Duvar Kağıdı & Baskı Seti',
    rawInput: 'Terracotta, bej ve adaçayı yeşili tonlarında 3 adet birbirini tamamlayan soyut kemer ve güneş motifi.',
    domain: 'etsy_pod',
    status: 'inbox',
    priority: 'low',
    tags: ['etsy pod', 'boho art print', 'gallery wall set', 'set of 3 prints'],
    createdAt: '2026-10-22T15:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Oturma odası kanepesi arkası için uyumlu 3 parçalı galeri duvar sanatı seti.',
      tags: ['boho wall decor', 'neutral abstract prints', 'terracotta wall art'],
      domainSpecifics: {
        niche: 'Boho & Modern İskandinav Ev Dekorasyonu',
        productType: '3 x (16x20 veya 18x24) Baskı Seti'
      },
      checklist: [
        { id: 'c15', text: 'Renk paletinin CMYK baskı uyumunu test et', done: false, tool: 'Figma', priority: 'medium' }
      ],
      generatedAt: '2026-10-22T15:30:00.000Z'
    }
  },
  {
    id: 'etsy-08',
    title: 'Modern Ukiyo-e Manzara & Doğa Kanvas Tablo Koleksiyonu',
    rawInput: 'Fuji Dağı, koi balıkları ve kiraz çiçeklerinin modern illüstrasyon tekniğiyle yorumlanmış Japon sanat posteri.',
    domain: 'etsy_pod',
    status: 'inbox',
    priority: 'medium',
    tags: ['etsy pod', 'japanese art', 'ukiyo-e modern', 'fuji mountain art'],
    createdAt: '2026-10-28T09:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Japon estetiği (Japandi) ve sakinleştirici doğa manzaralı kanvas tablo serisi.',
      tags: ['japandi wall art', 'japanese woodblock print', 'zen room decor'],
      domainSpecifics: {
        niche: 'Japandi & Zen Doğa Sanatı',
        productType: 'Gergili Kanvas ve Ahşap Askılı Poster'
      },
      checklist: [
        { id: 'c16', text: 'Midjourney v6 ile 4 farklı Japandi manzara görseli üret', done: false, tool: 'Midjourney', priority: 'high' }
      ],
      generatedAt: '2026-10-28T09:30:00.000Z'
    }
  },

  // --- 7 YOUTUBE VIDEO AUTOMATION PROJECTS ---
  {
    id: 'yt-01',
    title: 'İtiraf Saati: "20 Yıldır Kimseye Anlatmadığım Sır" (Gerçek Hikayeler)',
    rawInput: 'Kişilerin anonim gönderdiği gerçek itiraf mektupları. ElevenLabs derin ve samimi ses tonu, arka planda yağmurlu araba sürüşü veya lo-fi animasyon.',
    domain: 'youtube_automation',
    status: 'inbox',
    priority: 'high',
    tags: ['youtube automation', 'itiraf hikayeleri', 'elevenlabs', 'faceless', 'viral retention'],
    createdAt: '2026-10-14T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'Yüksek izlenme tutunması sağlayan anonim itiraf videoları. Merak uyandıran ilk 30 saniye ve duygusal doruk noktası.',
      tags: ['itiraf saatleri', 'gercek hikaye', 'sesli itiraflar', 'faceless video'],
      domainSpecifics: {
        titleIdeas: [
          '20 Yıldır Sakladığı Sırrı Nihayet İtiraf Etti...',
          'Bu Mektubu Okuduktan Sonra Gözyaşlarımı Tutamadım',
          'En Yakın Arkadaşımın Yaptığı Şeyi Asla Unutamayacağım'
        ],
        first30sHook: '"Eğer bu videoyu izliyorsanız, muhtemelen artık gerçeği öğrenmenin zamanı gelmiştir..." cümlesi ve karanlık araba farı görüntüsü.',
        automationWorkflow: {
          voiceover: 'ElevenLabs: Adam / George (Derin, sakin ve hüzünlü ton)',
          visuals: 'Gece yağmurlu şehir B-roll + Midjourney sinematik kareler',
          music: 'Hafif piyano melodisi ve yağmur ambiyans sesi'
        },
        thumbnailConcept: 'Eski yıpranmış bir mektup, buğulu cam ve üzerinde sarı renkle "SON İTİRAF"'
      },
      checklist: [
        { id: 'c17', text: 'Reddit r/confession hikayesini Türkçe adapte et', done: false, tool: 'Cursor', priority: 'high' },
        { id: 'c18', text: 'ElevenLabs seslendirmesini al ve nefes boşluklarını kırp', done: false, tool: 'ElevenLabs', priority: 'high' },
        { id: 'c19', text: 'CapCut ile altyazı ve sinematik b-roll montajla', done: false, tool: 'CapCut', priority: 'high' }
      ],
      strategicNotes: 'İlk 45 saniyede izleyici retention oranını %65 üzerinde tutmak YouTube önerilenler sekmesine sokar.',
      generatedAt: '2026-10-14T10:30:00.000Z'
    }
  },
  {
    id: 'yt-02',
    title: 'Utanç Hikayeleri: En Rezil Olduğum 5 An (Reddit & Anonim Gönderiler)',
    rawInput: 'İnsanların düğünlerde, iş mülakatlarında ve ilk buluşmalarda yaşadığı aşırı komik ve cringe anlar.',
    domain: 'youtube_automation',
    status: 'inbox',
    priority: 'medium',
    tags: ['youtube automation', 'utanc hikayeleri', 'komik anlar', 'cringe stories'],
    createdAt: '2026-10-21T13:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Eğlenceli ve viral potansiyeli yüksek utanç verici hikaye derlemesi. Shorts ve uzun video uyumlu.',
      tags: ['cringe anlar', 'en buyuk rezillik', 'rezil hikayeler'],
      domainSpecifics: {
        titleIdeas: ['Yerin Dibine Geçtiğim 5 Utanç Verici Olay', 'Bunu Yaşayan Biri Bir Daha Dışarı Çıkamaz']
      },
      checklist: [
        { id: 'c20', text: 'En çok oy alan 5 utanç hikayesini derle', done: false, tool: 'Reddit', priority: 'medium' }
      ],
      generatedAt: '2026-10-21T13:30:00.000Z'
    }
  },
  {
    id: 'yt-03',
    title: 'İnteraktif Sorgu Odası: "Katili Sen Bul!" Bölüm 1 - Kapalı Oda Vakası',
    rawInput: 'İzleyicinin dedektif olduğu polisiye sorgu dizisi. 3 şüpheli sorgulanıyor, izleyiciye çelişkileri bulması için 10 saniye süre veriliyor.',
    domain: 'youtube_automation',
    status: 'inbox',
    priority: 'high',
    tags: ['youtube automation', 'sorgu odasi', 'interaktif polisiye', 'cinayet dosyasi'],
    createdAt: '2026-10-16T16:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'İzleyiciyi yorum yapmaya ve ekranda kalmaya teşvik eden yüksek etkileşimli polisiye sorgu formatı.',
      tags: ['sorgu odasi', 'polisiye dizi', 'katil kim', 'interaktif video'],
      domainSpecifics: {
        titleIdeas: [
          'Şüphelilerden Biri Yalan Söylüyor: 10 Saniyede Bulabilir misin?',
          'Sorgu Odası #1: Milyonerin Son Akşam Yemeği'
        ],
        first30sHook: '"Dedektif hoş geldin. Masada 3 ifade var ama içlerinden biri az önce cinayet işledi. Bakalım yalanı yakalayabilecek misin?"',
        automationWorkflow: {
          voiceover: 'Sert detektif ses tonu + 3 farklı şüpheli karakter sesi (ElevenLabs)',
          visuals: 'Loş sorgu odası masası, tek lamba ışığı, polis kanıt dosyaları'
        }
      },
      checklist: [
        { id: 'c21', text: '3 şüphelinin çelişkili ifadelerini senaryolaştır', done: false, tool: 'Cursor', priority: 'high' },
        { id: 'c22', text: '10 saniyelik geri sayım ses ve görsel efektini hazırla', done: false, tool: 'CapCut', priority: 'high' },
        { id: 'c23', text: 'Kapakta şüphelinin yüzü ve kırmızı büyüteç kullan', done: false, tool: 'Canva', priority: 'medium' }
      ],
      strategicNotes: 'Yorumlarda "Cevabı bulanlar yoruma yazsın" çağrısı algoritmayı tetikler.',
      generatedAt: '2026-10-16T16:30:00.000Z'
    }
  },
  {
    id: 'yt-04',
    title: 'Polisiye Dosyalar: 48 Saatte Çözülen İnanılmaz Şüpheli İtirafları',
    rawInput: 'Gerçek polis kayıtları ve sorgu psikolojisi. Dedektiflerin zanlıyı itirafa zorladığı kilit taktikler.',
    domain: 'youtube_automation',
    status: 'inbox',
    priority: 'medium',
    tags: ['youtube automation', 'gercek polisiye', 'sorgu taktikleri', 'belgesel'],
    createdAt: '2026-10-23T11:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Kriminoloji ve sorgu psikolojisi odaklı mini belgesel video projesi.',
      tags: ['sorgu psikolojisi', 'reid teknigi', 'gercek polisiye'],
      domainSpecifics: {
        titleIdeas: ['Polisler Yalanı Nasıl Anlar? En Ünlü Sorgu Taktikleri']
      },
      checklist: [
        { id: 'c24', text: 'FBI ve polis sorgu dökümlerinden 3 gerçek örnek bul', done: false, tool: 'Google', priority: 'medium' }
      ],
      generatedAt: '2026-10-23T11:30:00.000Z'
    }
  },
  {
    id: 'yt-05',
    title: 'Karanlık Oda İtirafları: Anonim Olarak Gelen En Ürkütücü Ses Kaydı',
    rawInput: 'Eski bir radyo frekansından kaydedilen ya da telesekretere bırakılan gizemli itiraf sesleri.',
    domain: 'youtube_automation',
    status: 'inbox',
    priority: 'high',
    tags: ['youtube automation', 'korku itiraf', 'gizemli sesler', 'gece videolari'],
    createdAt: '2026-10-27T18:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Gece saatlerinde izlenmeye uygun, tüyler ürpertici gizem ve itiraf kurgusu.',
      tags: ['korku hikayeleri', 'gizemli itiraflar', 'karanlik video'],
      domainSpecifics: {
        niche: 'Korku & Gizem Hikaye Anlatımı'
      },
      checklist: [
        { id: 'c25', text: 'Telesekreter bip ve distorsiyon ses efektlerini ayarla', done: false, tool: 'CapCut', priority: 'medium' }
      ],
      generatedAt: '2026-10-27T18:30:00.000Z'
    }
  },
  {
    id: 'yt-06',
    title: 'İnteraktif Sorgu Odası: Şüpheli Beden Dili & Yalan Analizi Dizi Serisi',
    rawInput: 'Beden dili uzmanlarının göz kırpma, mikro mimik ve ses titremesinden yalanı yakalama rehberi.',
    domain: 'youtube_automation',
    status: 'inbox',
    priority: 'high',
    tags: ['youtube automation', 'beden dili', 'yalan analizi', 'sorgu'],
    createdAt: '2026-10-24T14:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'Kullanıcının kendi günlük hayatında da uygulayabileceği mikro mimik analizleri.',
      tags: ['mikro mimikler', 'beden dili rehberi', 'yalan testi'],
      domainSpecifics: {
        titleIdeas: ['Birinin Yalan Söylediğini Gösteren 4 Mikro Mimik']
      },
      checklist: [
        { id: 'c26', text: 'Paul Ekman mikro mimik araştırmasından grafikler hazırla', done: false, tool: 'Canva', priority: 'medium' }
      ],
      generatedAt: '2026-10-24T14:30:00.000Z'
    }
  },
  {
    id: 'yt-07',
    title: 'Hatalar ve Pişmanlıklar: Hayatını Mahveden Tek Bir Karar',
    rawInput: 'Tek bir yanlış karar yüzünden servetini veya ailesini kaybeden insanların dramatik ders hikayeleri.',
    domain: 'youtube_automation',
    status: 'inbox',
    priority: 'medium',
    tags: ['youtube automation', 'hayat dersleri', 'pismanlik hikayesi', 'felsefi video'],
    createdAt: '2026-10-11T15:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Dramatik ve ibretlik hikaye kurgusu ile yüksek izlenme süresi yakalayan format.',
      tags: ['hayat hatalari', 'dramatik hikaye', 'motivasyon'],
      domainSpecifics: {
        titleIdeas: ['Hayatının En Büyük Hatasını 3 Saniyede Yaptı']
      },
      checklist: [
        { id: 'c27', text: 'Script ve kurgu taslağını oluştur', done: false, tool: 'YouTube', priority: 'high' }
      ],
      generatedAt: '2026-10-11T15:30:00.000Z'
    }
  },

  // --- 3 INDONESIA MARKET PROJECTS ---
  {
    id: 'indo-01',
    title: 'Sejarah Indonesia Bergambar untuk Anak (Nusantara Tarihi Çocuk Kitabı)',
    rawInput: 'Endonezya adalarının kuruluş efsaneleri, Majapahit ve Sriwijaya krallıklarının çocuklara yönelik renkli resimli hikaye kitabı.',
    domain: 'indonesia',
    status: 'inbox',
    priority: 'high',
    tags: ['indonesia', 'buku anak', 'amazon kdp', 'sejarah indonesia', 'shopee id'],
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'Endonezyalı ebeveynler için milli kültür ve tarih bilincini masallarla aşılayan Amazon KDP resimli çocuk kitabı.',
      tags: ['buku bergambar', 'sejarah nusantara', 'kdp indonesia', 'edukasi anak'],
      domainSpecifics: {
        niche: 'Buku Anak & Edukasi Budaya Nusantara',
        productType: 'Amazon KDP Hardcover 8.5x8.5 inç ve Shopee/Tokopedia PDF',
        targetAudience: 'Endonezyalı ebeveynler, ilkokul öğretmenleri, Endonezya diasporası',
        tags: ['#bukuAnak', '#ceritaSejarah', '#shopeeID', '#edukasiKeluarga'],
        designConcept: 'Canlı tropik renkler, batik desenli kıyafetler, çocuksu sıcak illüstrasyon stili.',
        competitionInsight: 'Shopee ve Tokopedia üzerinde yerel fiyat (Rp 65.000 - Rp 95.000) ile doğrudan dijital download sunun.'
      },
      checklist: [
        { id: 'c28', text: 'Midjourney v6 ile 16 adet Endonezya ada illüstrasyonu üret', done: false, tool: 'Midjourney', priority: 'high' },
        { id: 'c29', text: 'Bahasa Indonesia basit metinleri yerel redaktör formatında kontrol et', done: false, tool: 'Cursor', priority: 'high' },
        { id: 'c30', text: 'KDP formatında PDF bleed ve kapak dosyasını derle', done: false, tool: 'Canva', priority: 'high' }
      ],
      strategicNotes: 'Endonezya 280 milyonluk nüfusuyla Güneydoğu Asya’nın en hızlı büyüyen çocuk yayıncılığı pazarıdır.',
      generatedAt: '2026-10-19T10:30:00.000Z'
    }
  },
  {
    id: 'indo-02',
    title: 'Cerita Rakyat Nusantara: 10 Adanın Efsanevi Masalları (Shopee/Tokopedia)',
    rawInput: 'Malin Kundang, Danau Toba, Roro Jonggrang gibi 10 popüler ada efsanesinin modern pedagojik anlatımı.',
    domain: 'indonesia',
    status: 'inbox',
    priority: 'medium',
    tags: ['indonesia', 'cerita rakyat', 'danau toba', 'tokopedia digital'],
    createdAt: '2026-10-26T12:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Tokopedia ve Shopee dijital ürün mağazalarında satılacak sesli masal ve interaktif PDF paketi.',
      tags: ['dongeng nusantara', 'malin kundang', 'buku dongeng digital'],
      domainSpecifics: {
        niche: 'Dijital Çocuk Masalları & Sesli Kitap'
      },
      checklist: [
        { id: 'c31', text: '10 halk masalının özetlerini çıkar', done: false, tool: 'Cursor', priority: 'medium' }
      ],
      generatedAt: '2026-10-26T12:30:00.000Z'
    }
  },
  {
    id: 'indo-03',
    title: 'Endonezya Vahşi Yaşam & Kültür Çocuk Etkinlik Kitabı (Amazon KDP)',
    rawInput: 'Komodo ejderi, Sumatra kaplanı ve orangutan çizimleri içeren labirent, bulmaca ve boyama kitabı.',
    domain: 'indonesia',
    status: 'inbox',
    priority: 'low',
    tags: ['indonesia', 'buku mewarnai', 'coloring book kdp', 'satwa nusantara'],
    createdAt: '2026-10-29T14:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'Düşük üretim maliyetli, siyah beyaz iç sayfalı KDP boyama ve etkinlik kitabı.',
      tags: ['buku aktivitas anak', 'satwa langka indonesia', 'kdp activity book'],
      domainSpecifics: {
        niche: 'Etkinlik & Boyama Kitapları'
      },
      checklist: [
        { id: 'c32', text: '30 adet siyah beyaz boyama çizimini hazırla', done: false, tool: 'Midjourney', priority: 'medium' }
      ],
      generatedAt: '2026-10-29T14:30:00.000Z'
    }
  },

  // --- 3 AI APPS & MICRO-SAAS PROJECTS ---
  {
    id: 'ai-01',
    title: 'OmniFocus Quick-Capture: Sesli Notu Aksiyon Planına Çeviren Micro-SaaS',
    rawInput: 'Kullanıcının tek tuşla sesli düşüncelerini kaydedip 10 saniyede yapılandırılmış Kanban görevlerine dönüştüren web aracı.',
    domain: 'ai_apps',
    status: 'inbox',
    priority: 'high',
    tags: ['ai apps', 'micro saas', 'gemini api', 'audio to action', 'productivity'],
    createdAt: '2026-10-13T09:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'Solopreneur ve içerik üreticileri için ses kaydını yapılandırılmış JSON çıktısıyla planlayan üretkenlik aracı.',
      tags: ['ai productivity', 'voice capture', 'micro saas', 'gemini 3.8 flash'],
      domainSpecifics: {
        problemStatement: 'Yaratıcı insanların fikirleri akıllarına geldikleri anda kaydedilmezse kayboluyor; not defterleri ise aksiyonsuz çöplüğe dönüyor.',
        coreSolution: 'Web Audio API + Gemini 3.8 Flash modeliyle sesi anında metne döküp sektöre özel aksiyon planına dönüştüren tek pencereli dashboard.',
        targetPersona: 'Etsy satıcıları, YouTube kanal sahipleri, bağımsız yazılımcılar (Solopreneurs)',
        techStack: {
          frontend: 'React 19 + Vite + Tailwind CSS v4',
          backend: 'Express Node.js proxy',
          aiEngine: 'Google Gemini 3.8 Flash',
          database: 'Supabase PostgreSQL + Local Storage Fallback'
        },
        mvpFeatures: [
          '1. Cmd+K ile evrensel sesli/metin hızlı fikir yakalama',
          '2. Gemini ile 4 sektöre özel aksiyon planı ve görev listesi üretimi',
          '3. Sıfır kesintili yerel ve bulut senkronizasyonu'
        ],
        monetizationIdea: 'Aylık $9 Pro plan (Sınırsız Gemini API analizi ve pazar araştırması).'
      },
      checklist: [
        { id: 'c33', text: 'Supabase PostgreSQL şemasını ve RLS kurallarını doğrula', done: false, tool: 'Supabase', priority: 'high' },
        { id: 'c34', text: 'Ses kaydı ve Gemini transkripsiyon hattını test et', done: false, tool: 'Cursor', priority: 'high' },
        { id: 'c35', text: 'Landing page ve ProductHunt lansman metnini hazırla', done: false, tool: 'Figma', priority: 'medium' }
      ],
      strategicNotes: 'Karmaşık ayarlar yerine ilk 5 saniyede çalışan sade akış kullanıcıyı tutundurur.',
      generatedAt: '2026-10-13T09:30:00.000Z'
    }
  },
  {
    id: 'ai-02',
    title: 'Etsy Auto-Listing SEO & 20 Görsel Prompt Üretici AI Motoru',
    rawInput: 'Etsy satıcıları için ürün başlığını, 13 etiketini ve Midjourney için 20 slotluk görsel prompt setini tek tıkla üreten yapay zeka aracı.',
    domain: 'ai_apps',
    status: 'inbox',
    priority: 'high',
    tags: ['ai apps', 'etsy seo tool', 'midjourney prompts', 'listing generator'],
    createdAt: '2026-10-17T14:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: true,
    maturityScore: 20,
    actionPlan: {
      summary: 'Etsy POD satıcılarının ürün başına 1 saatlik listeleme ve mockup hazırlık süresini 2 dakikaya indiren otomasyon.',
      tags: ['etsy automation', 'midjourney prompt generator', 'pod tools'],
      domainSpecifics: {
        problemStatement: 'Etsy’de başarılı bir listeleme için 13 etiket, 140 karakterlik başlık ve 20 farklı görsel açısı gerekiyor; bu da üretimi yavaşlatıyor.',
        coreSolution: 'Tek bir ürün fikrinden 20 adet Midjourney promptu, infografik şablonu ve SEO uyumlu açıklama metni üreten motor.',
        techStack: {
          frontend: 'React + Tailwind',
          aiEngine: 'Gemini 3.8 Flash Structured JSON'
        }
      },
      checklist: [
        { id: 'c36', text: 'Etsy SEO kurallarına uygun 140 karakter ve 13 etiket promptunu optimize et', done: false, tool: 'Cursor', priority: 'high' },
        { id: 'c37', text: 'Midjourney v6 için 20 slotluk prompt şablonlarını test et', done: false, tool: 'Midjourney', priority: 'high' }
      ],
      generatedAt: '2026-10-17T14:30:00.000Z'
    }
  },
  {
    id: 'ai-03',
    title: 'Faceless YouTube Script & Storyboard Otomasyon Aracı (Gemini API)',
    rawInput: 'Viral YouTube konuları için ilk 30 saniye kancası, 5 adımlı script omurgası ve CapCut için B-roll yönergeleri oluşturan web aracı.',
    domain: 'ai_apps',
    status: 'inbox',
    priority: 'high',
    tags: ['ai apps', 'youtube scriptwriter', 'faceless automation', 'storyboard ai'],
    createdAt: '2026-10-11T12:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    isFavorite: false,
    maturityScore: 20,
    actionPlan: {
      summary: 'YouTube otomasyon kanallarının senaryo yazım ve storyboard hazırlık sürecini uçtan uca otomatikleştiren araç.',
      tags: ['youtube ai tool', 'script outline generator', 'b-roll prompt ai'],
      domainSpecifics: {
        problemStatement: 'Faceless kanallarda izlenme tutunmasını sağlayacak psikolojik kanca yazımı zaman alıyor.',
        coreSolution: 'Tıkla-ve-üret senaryo omurgası ve ElevenLabs zamanlamalı sahne dökümü.'
      },
      checklist: [
        { id: 'c38', text: 'Kanca ve sahne akış algoritmasını tamamla', done: false, tool: 'Cursor', priority: 'high' },
        { id: 'c39', text: 'Canlı sisteme dahil edildi', done: false, tool: 'Gemini API', priority: 'high' }
      ],
      generatedAt: '2026-10-11T12:30:00.000Z'
    }
  }
];

// -------------------------------------------------------------
// LOCAL STORAGE CACHE HELPERS
// -------------------------------------------------------------
export const getStoredIdeas = (): IdeaItem[] => {
  try {
    localStorage.removeItem('omnifocus_ideas_v3');
    localStorage.removeItem('omnifocus_ideas_v2');
  } catch {}

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage parse warning:', e);
    }
  }
  // If no ideas exist yet in browser storage, immediately seed the 21 real projects
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(REAL_USER_PROJECTS));
  } catch (e) {
    console.warn('LocalStorage initial seed warning:', e);
  }
  return REAL_USER_PROJECTS;
};

const saveLocalIdea = (idea: IdeaItem) => {
  try {
    const list = getStoredIdeas();
    const index = list.findIndex(i => i.id === idea.id);
    if (index >= 0) {
      list[index] = idea;
    } else {
      list.unshift(idea);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }
};

const deleteLocalIdea = (ideaId: string) => {
  try {
    const list = getStoredIdeas().filter(i => i.id !== ideaId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage delete warning:', e);
  }
};

export const clearLocalStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const resetToRealProjects = async (userId: string = 'omni_creator'): Promise<IdeaItem[]> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(REAL_USER_PROJECTS));
    for (const item of REAL_USER_PROJECTS) {
      saveIdeaToSupabase(userId, item).catch(() => {});
    }
  } catch (e) {
    console.warn('Reset to real projects notice:', e);
  }
  return REAL_USER_PROJECTS;
};

// -------------------------------------------------------------
// ROW CONVERTERS FOR SUPABASE (snake_case)
// -------------------------------------------------------------
export function ideaItemToRow(userId: string, idea: IdeaItem) {
  const actionPlanMerged = idea.actionPlan ? {
    ...idea.actionPlan,
    notes: idea.notes,
    reminders: idea.reminders,
    youtubeStudio: idea.youtubeStudio,
    aiAppStudio: idea.aiAppStudio,
    indonesiaStudio: idea.indonesiaStudio,
    dataComparison: idea.dataComparison,
  } : (idea.notes || idea.reminders || idea.youtubeStudio || idea.aiAppStudio ? {
    summary: '',
    tags: idea.tags || [],
    domainSpecifics: {},
    checklist: [],
    generatedAt: new Date().toISOString(),
    notes: idea.notes,
    reminders: idea.reminders,
    youtubeStudio: idea.youtubeStudio,
    aiAppStudio: idea.aiAppStudio,
    indonesiaStudio: idea.indonesiaStudio,
    dataComparison: idea.dataComparison,
  } : null);

  return {
    id: idea.id,
    user_id: userId,
    title: idea.title || '',
    raw_input: idea.rawInput || '',
    domain: idea.domain || 'etsy_pod',
    status: idea.status || 'inbox',
    priority: idea.priority || 'medium',
    tags: Array.isArray(idea.tags) ? idea.tags : [],
    action_plan: actionPlanMerged,
    grounded_research: idea.groundedResearch || null,
    sub_ideas: idea.subIdeas || null,
    etsy_listing: idea.etsyListing || null,
    visual_concepts: idea.visualConcepts || null,
    design_brief: idea.designBrief || null,
    maturity_score: typeof idea.maturityScore === 'number' ? idea.maturityScore : calculateMaturityScore(idea).score,
    is_favorite: !!idea.isFavorite,
    parent_id: idea.parentId || null,
    created_at: idea.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function rowToIdeaItem(row: any): IdeaItem {
  const actionPlan = row.action_plan || undefined;
  return {
    id: row.id,
    title: row.title || '',
    rawInput: row.raw_input || '',
    domain: row.domain || 'etsy_pod',
    status: row.status || 'inbox',
    priority: row.priority || 'medium',
    tags: Array.isArray(row.tags) ? row.tags : [],
    actionPlan: actionPlan ? {
      summary: actionPlan.summary || '',
      tags: actionPlan.tags || [],
      domainSpecifics: actionPlan.domainSpecifics || {},
      checklist: actionPlan.checklist || [],
      strategicNotes: actionPlan.strategicNotes,
      generatedAt: actionPlan.generatedAt || row.updated_at || '',
    } : undefined,
    notes: actionPlan?.notes || row.notes || undefined,
    reminders: actionPlan?.reminders || undefined,
    youtubeStudio: actionPlan?.youtubeStudio || undefined,
    aiAppStudio: actionPlan?.aiAppStudio || undefined,
    indonesiaStudio: actionPlan?.indonesiaStudio || undefined,
    dataComparison: actionPlan?.dataComparison || undefined,
    groundedResearch: row.grounded_research || undefined,
    subIdeas: row.sub_ideas || undefined,
    etsyListing: row.etsy_listing || undefined,
    visualConcepts: row.visual_concepts || undefined,
    designBrief: row.design_brief || undefined,
    maturityScore: typeof row.maturity_score === 'number' ? row.maturity_score : undefined,
    isFavorite: !!row.is_favorite,
    parentId: row.parent_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// SUPABASE CRUD OPERATIONS WITH LOCAL FALLBACK
// -------------------------------------------------------------
export const subscribeToIdeas = (userId: string, callback: (ideas: IdeaItem[]) => void) => {
  // 1. Immediately emit stored ideas (21 real projects if fresh) so user NEVER sees empty state
  const cached = getStoredIdeas();
  if (cached.length > 0) {
    callback(cached);
  }

  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch ideas info:', error.message);
        callback(getStoredIdeas());
        return;
      }
      if (data && data.length > 0) {
        const ideas = data.map(rowToIdeaItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
        callback(ideas);
      } else if (cached.length > 0) {
        // Sync cached ideas to Supabase in the background
        for (const item of cached) {
          supabase.from('ideas').upsert(ideaItemToRow(userId, item)).then();
        }
        callback(cached);
      } else {
        callback(getStoredIdeas());
      }
    } catch (err) {
      console.warn('Querying ideas fallback to local storage:', err);
      callback(getStoredIdeas());
    }
  };

  fetchIdeas();

  // Supabase Realtime channel subscription
  try {
    const channel = supabase
      .channel(`ideas_realtime_${userId}_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ideas',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchIdeas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
};

export const saveIdeaToSupabase = async (userId: string, idea: IdeaItem) => {
  // Always update local cache first for zero latency
  saveLocalIdea(idea);

  try {
    const row = ideaItemToRow(userId, idea);
    const { data, error } = await supabase
      .from('ideas')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save note (saved to local cache):', error.message);
    }
    return data;
  } catch (err) {
    console.warn('Supabase save exception (persisted locally):', err);
  }
};

export const deleteIdeaFromSupabase = async (userId: string, ideaId: string) => {
  deleteLocalIdea(ideaId);

  try {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', ideaId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase delete notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase delete exception:', err);
  }
};

// Aliases for backwards compatibility
export const saveIdeaToFirebase = saveIdeaToSupabase;
export const deleteIdeaFromFirebase = deleteIdeaFromSupabase;

export const exportIdeasToMarkdown = (ideas: IdeaItem[], domainFilter: DomainType | 'all' = 'all') => {
  const filtered = domainFilter === 'all' ? ideas : ideas.filter(i => i.domain === domainFilter);
  let md = `# OmniFocus Projeleri - ${new Date().toLocaleDateString('tr-TR')}\n\n`;
  
  filtered.forEach(i => {
    md += `## ${i.title}\n`;
    md += `- **Durum:** ${i.status}\n`;
    md += `- **Domain:** ${i.domain}\n`;
    md += `- **Ham Not:** ${i.rawInput}\n\n`;
    if (i.actionPlan) {
      md += `### Aksiyon Planı\n${i.actionPlan.summary}\n\n`;
      md += `#### Görevler\n`;
      i.actionPlan.checklist.forEach(c => {
        md += `- [${c.done ? 'x' : ' '}] ${c.text}${c.tool ? ` (@${c.tool})` : ''}\n`;
      });
      md += `\n`;
    }
    if (i.etsyListing) {
      md += `### Etsy Listing\n`;
      md += `**Title:** ${i.etsyListing.title}\n\n`;
      md += `**Tags:** ${i.etsyListing.tags.join(', ')}\n\n`;
    }
    md += `---\n\n`;
  });
  return md;
};

export const exportIdeasToCsv = (ideas: IdeaItem[], domainFilter: DomainType | 'all' = 'all') => {
  const filtered = domainFilter === 'all' ? ideas : ideas.filter(i => i.domain === domainFilter);
  const headers = ['ID', 'Title', 'Domain', 'Status', 'CreatedAt', 'RawInput', 'Maturity'];
  const rows = filtered.map(i => [
    i.id,
    `"${(i.title || '').replace(/"/g, '""')}"`,
    i.domain,
    i.status,
    i.createdAt,
    `"${(i.rawInput || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    calculateMaturityScore(i).score
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};
