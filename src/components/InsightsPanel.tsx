import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, Activity, ShoppingBag, Video, Globe, Cpu, 
  CheckCircle2, Clock, Search, Inbox, AlertTriangle, ArrowUpRight 
} from 'lucide-react';
import { IdeaItem, DomainType, StatusType } from '../types';

interface InsightsPanelProps {
  ideas: IdeaItem[];
  onSelectDomain: (domain: DomainType | 'all') => void;
  onSelectStatus: (status: StatusType | 'all') => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  ideas,
  onSelectDomain,
  onSelectStatus,
}) => {
  // Domain breakdown
  const domainData = useMemo(() => {
    const counts: Record<DomainType, number> = {
      etsy_pod: 0,
      youtube_automation: 0,
      ai_apps: 0,
      indonesia: 0,
    };
    ideas.forEach((i) => {
      if (counts[i.domain] !== undefined) {
        counts[i.domain]++;
      }
    });

    return [
      { name: 'Etsy Products', domain: 'etsy_pod', count: counts.etsy_pod, fill: '#F59E0B' },
      { name: 'YouTube', domain: 'youtube_automation', count: counts.youtube_automation, fill: '#EF4444' },
      { name: 'AI Apps', domain: 'ai_apps', count: counts.ai_apps, fill: '#6366F1' },
      { name: 'Indonesia', domain: 'indonesia', count: counts.indonesia, fill: '#10B981' },
    ];
  }, [ideas]);

  // Status breakdown
  const statusData = useMemo(() => {
    const statusCounts: Record<StatusType, number> = {
      inbox: 0,
      research: 0,
      in_progress: 0,
      completed: 0,
    };
    ideas.forEach((i) => {
      if (statusCounts[i.status] !== undefined) {
        statusCounts[i.status]++;
      }
    });

    return [
      { name: 'Gelen Kutusu', status: 'inbox', count: statusCounts.inbox, color: '#94A3B8' },
      { name: 'Araştırma & Niche', status: 'research', count: statusCounts.research, color: '#38BDF8' },
      { name: 'Üretimde / Aktif', status: 'in_progress', count: statusCounts.in_progress, color: '#F59E0B' },
      { name: 'Tamamlandı / Canlı', status: 'completed', count: statusCounts.completed, color: '#10B981' },
    ];
  }, [ideas]);

  // Domain x Status Matrix for Stacked Velocity Chart
  const velocityMatrix = useMemo(() => {
    const domains: { key: DomainType; name: string }[] = [
      { key: 'etsy_pod', name: 'Etsy Products' },
      { key: 'youtube_automation', name: 'YouTube' },
      { key: 'ai_apps', name: 'AI Apps' },
    ];

    return domains.map((d) => {
      const subset = ideas.filter((i) => i.domain === d.key);
      return {
        name: d.name,
        domain: d.key,
        GelenKutusu: subset.filter((i) => i.status === 'inbox').length,
        Arastirma: subset.filter((i) => i.status === 'research').length,
        Uretimde: subset.filter((i) => i.status === 'in_progress').length,
        Tamamlandi: subset.filter((i) => i.status === 'completed').length,
        total: subset.length,
      };
    });
  }, [ideas]);

  // Velocity Metrics
  const metrics = useMemo(() => {
    const total = ideas.length;
    const inProgress = ideas.filter((i) => i.status === 'in_progress').length;
    const inResearch = ideas.filter((i) => i.status === 'research').length;
    const inInbox = ideas.filter((i) => i.status === 'inbox').length;
    const completed = ideas.filter((i) => i.status === 'completed').length;
    const highPriority = ideas.filter((i) => i.priority === 'high').length;

    // Checklist stats
    let totalChecklistItems = 0;
    let completedChecklistItems = 0;
    ideas.forEach((i) => {
      if (i.actionPlan?.checklist) {
        totalChecklistItems += i.actionPlan.checklist.length;
        completedChecklistItems += i.actionPlan.checklist.filter((c) => c.done).length;
      }
    });

    const executionRate = totalChecklistItems > 0 
      ? Math.round((completedChecklistItems / totalChecklistItems) * 100) 
      : 0;

    const inProductionVelocity = total > 0 
      ? Math.round(((inProgress + completed) / total) * 100) 
      : 0;

    return {
      total,
      inProgress,
      inResearch,
      inInbox,
      completed,
      highPriority,
      totalChecklistItems,
      completedChecklistItems,
      executionRate,
      inProductionVelocity,
    };
  }, [ideas]);

  // Custom Recharts Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-100">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {entry.value} adet
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Velocity Top KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div 
          onClick={() => onSelectStatus('all')}
          className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Toplam Gerçek Proje</span>
            <Activity className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            4 çalışma alanında dağıtılmış
          </div>
        </div>

        <div 
          onClick={() => onSelectStatus('in_progress')}
          className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl hover:border-amber-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Üretimde / Kodlamada</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-300">
            {metrics.inProgress}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Projelerin <span className="text-amber-400/90 font-mono">%{metrics.inProductionVelocity}</span> aktif/tamamlanma hızında
          </div>
        </div>

        <div 
          onClick={() => onSelectStatus('research')}
          className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl hover:border-sky-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Araştırma & Niche</span>
            <Search className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-300">
            {metrics.inResearch}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tasarım ve doğrulama aşamasında
          </div>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Görev Tamamlama Hızı</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-300">
            %{metrics.executionRate}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            {metrics.completedChecklistItems} / {metrics.totalChecklistItems} kontrol adımı tamamlandı
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Projelerin Alanlara Dağılımı (BarChart) */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">İş Alanlarına Göre Proje Dağılımı</h3>
              <p className="text-xs text-slate-400">Her çalışma alanındaki proje sayısı ve portföy ağırlığı</p>
            </div>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  interval={0}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  name="Proje Sayısı"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data?.domain) onSelectDomain(data.domain);
                  }}
                >
                  {domainData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Domain Navigation Strips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
            {domainData.map((d) => (
              <button
                key={d.domain}
                onClick={() => onSelectDomain(d.domain as any)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/60 transition-colors text-xs cursor-pointer text-left"
              >
                <div className="truncate">
                  <div className="font-medium text-slate-200 truncate">{d.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                    %{Math.round((d.count / (metrics.total || 1)) * 100)} pay
                  </div>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-300 ml-1.5">
                  {d.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart 2: Pipeline Durum Dağılımı (Pie / Donut) */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Pipeline Durum & Aşama Dağılımı</h3>
              <p className="text-xs text-slate-400">Projelerin akıştaki yoğunluğu ve darboğaz tespiti</p>
            </div>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data?.status) onSelectStatus(data.status);
                  }}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-xs text-slate-300 mr-2">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quiet Status Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
            {statusData.map((st) => (
              <button
                key={st.status}
                onClick={() => onSelectStatus(st.status as any)}
                className="p-2 rounded-lg bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/60 transition-colors text-left text-xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                  <span className="truncate text-[11px]">{st.name}</span>
                </div>
                <div className="font-mono font-bold text-slate-200 mt-1 tabular-nums">
                  {st.count} <span className="text-[10px] text-slate-500 font-normal">proje</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Proje Hızı & Alan Bazlı Aşama Matrisi (Stacked Velocity Chart) */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Çalışma Alanı x Aşama Hız Matrisi (Project Velocity)</h3>
            <p className="text-xs text-slate-400">Hangi alanda kaç proje üretimde, kaç proje araştırmada?</p>
          </div>
          <div className="text-xs font-mono text-slate-400 tabular-nums">
            Yüksek Öncelik: <strong className="text-amber-400">{metrics.highPriority}</strong> / {metrics.total}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={velocityMatrix} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right"
                height={30}
                formatter={(value: string) => <span className="text-xs text-slate-300 mr-2">{value}</span>}
              />
              <Bar dataKey="GelenKutusu" name="Gelen Kutusu" stackId="a" fill="#94A3B8" />
              <Bar dataKey="Arastirma" name="Araştırma & Niche" stackId="a" fill="#38BDF8" />
              <Bar dataKey="Uretimde" name="Üretimde" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Tamamlandi" name="Tamamlandı" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Velocity Assessment & Solopreneur Recommendation */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium text-amber-300">
              <TrendingUp className="w-4 h-4" />
              <span>Hız Analizi & Tavsiye</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Etsy tarafında <strong>7 proje aktif üretimde</strong> ve <strong>7 proje araştırma aşamasında</strong>. Yeni fikir eklemek yerine üretimdeki ürünlerin mockup ve etiketlerini tamamlayarak yayına almak proje hızınızı 2 katına çıkaracaktır.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onSelectDomain('etsy_pod');
                onSelectStatus('in_progress');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-xs"
            >
              <span>Üretimdeki Projelere Git</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* WEEKLY INSIGHTS REPORT CARD */}
      {(() => {
        const totalCompleted = ideas.filter(i => i.status === 'completed').length;
        const totalInProgress = ideas.filter(i => i.status === 'in_progress').length;
        const activePipelineTotal = totalCompleted + totalInProgress;
        const overallCompletionRate = activePipelineTotal > 0
          ? Math.round((totalCompleted / activePipelineTotal) * 100)
          : 0;

        const domainBreakdown = [
          { key: 'etsy_pod', name: 'Etsy Products', color: 'text-amber-400', barBg: 'bg-amber-400' },
          { key: 'youtube_automation', name: 'YouTube Automation', color: 'text-rose-400', barBg: 'bg-rose-400' },
          { key: 'ai_apps', name: 'AI Apps', color: 'text-indigo-400', barBg: 'bg-indigo-400' },
        ].map(d => {
          const comp = ideas.filter(i => i.domain === d.key && i.status === 'completed').length;
          const inProg = ideas.filter(i => i.domain === d.key && i.status === 'in_progress').length;
          const subTotal = comp + inProg;
          const rate = subTotal > 0 ? Math.round((comp / subTotal) * 100) : 0;
          return {
            ...d,
            completed: comp,
            inProgress: inProg,
            rate,
            totalSub: subTotal
          };
        });

        const readyToPublishCount = ideas.filter(i => (i.maturityScore || 0) === 100).length;
        const midMaturityCount = ideas.filter(i => (i.maturityScore || 0) >= 50 && (i.maturityScore || 0) < 100).length;
        const earlyMaturityCount = ideas.filter(i => (i.maturityScore || 0) < 50).length;

        return (
          <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Haftalık Performans Raporu (Weekly Insights Card)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Projelerin Tamamlanma Hızı: "Tamamlanan" vs "Üretimde" Olanlar Karşılaştırması
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Genel Tamamlanma Oranı</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                    %{overallCompletionRate}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
                  {totalCompleted}/{activePipelineTotal}
                </div>
              </div>
            </div>

            {/* Domain-by-Domain Completion Rate Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {domainBreakdown.map(d => (
                <div key={d.key} className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${d.color}`}>{d.name}</span>
                    <span className="font-mono font-bold text-white tabular-nums">%{d.rate}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.barBg} transition-all duration-500 rounded-full`}
                      style={{ width: `${d.rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>{d.completed} Tamamlandı</span>
                    <span>{d.inProgress} Üretimde</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Maturity Distribution Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-emerald-400 font-medium">🚀 Yayına Hazır (%100 Olgunluk)</div>
                  <div className="text-xs text-slate-400">Tüm araştırma, listing ve görseller hazır</div>
                </div>
                <span className="text-lg font-bold font-mono text-emerald-300">{readyToPublishCount}</span>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-amber-400 font-medium">⚡ Geliştirme Aşamasında (%50-99)</div>
                  <div className="text-xs text-slate-400">Listing taslağı veya mockup bekleniyor</div>
                </div>
                <span className="text-lg font-bold font-mono text-amber-300">{midMaturityCount}</span>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">💡 Yeni Fikir Aşaması (&lt; %50)</div>
                  <div className="text-xs text-slate-500">Ham not & pazar araştırması bekliyor</div>
                </div>
                <span className="text-lg font-bold font-mono text-slate-300">{earlyMaturityCount}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

