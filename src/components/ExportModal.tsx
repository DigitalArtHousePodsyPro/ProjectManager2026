import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, FileText, Database, Table } from 'lucide-react';
import { IdeaItem, DomainType } from '../types';
import { exportIdeasToMarkdown, exportIdeasToCsv } from '../services/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: IdeaItem[];
  onImportIdeas: (imported: IdeaItem[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  ideas,
  onImportIdeas
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainType | 'all'>('all');
  const [exportFormat, setExportFormat] = useState<'markdown' | 'csv'>('csv');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const markdownContent = exportIdeasToMarkdown(ideas, selectedDomain);
  const csvContent = exportIdeasToCsv(ideas, selectedDomain);

  const handleCopy = () => {
    const text = exportFormat === 'csv' ? csvContent : markdownContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (exportFormat === 'csv') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `omnifocus-ideas-${selectedDomain}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `omnifocus-ideas-${selectedDomain}-${new Date().toISOString().slice(0, 10)}.md`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadJsonBackup = () => {
    const blob = new Blob([JSON.stringify(ideas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omnifocus-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportIdeas(parsed);
          setImportStatus(`${parsed.length} adet fikir basariyla ice aktarildi!`);
        } else {
          setImportStatus('Gecersiz JSON formati.');
        }
      } catch (err) {
        setImportStatus('Dosya okunurken hata olustu.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Verileri Dışa Aktar (CSV / Markdown) & Yedekle</h2>
              <p className="text-xs text-slate-400">Excel, Google Sheets, Notion veya Obsidian için projelerinizi hazırlayın.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Format and Domain Filter Selector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Format Toggle */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    exportFormat === 'csv'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Yapılandırılmış CSV (Excel/Notion)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('markdown')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    exportFormat === 'markdown'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Markdown (.md)</span>
                </button>
              </div>

              {/* Domain Filter selector */}
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as any)}
                className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800"
              >
                <option value="all">Tüm Projeler ({ideas.length})</option>
                <option value="etsy_pod">Yalnızca Etsy Products ({ideas.filter(i => i.domain === 'etsy_pod').length})</option>
                <option value="youtube_automation">Yalnızca YouTube ({ideas.filter(i => i.domain === 'youtube_automation').length})</option>
                <option value="ai_apps">Yalnızca AI Apps ({ideas.filter(i => i.domain === 'ai_apps').length})</option>
              </select>
            </div>

            {/* Preview Box */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {exportFormat === 'csv' ? csvContent : markdownContent}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı!' : 'Panoya Kopyala'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportFormat === 'csv' ? '.CSV Olarak İndir (Excel / Notion)' : '.MD Dosyası Olarak İndir'}</span>
              </button>
            </div>
          </div>


          {/* JSON Backup & Restore Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Tam JSON Yedekleme & Geri Yukleme</span>
            </div>
            <p className="text-xs text-slate-400">
              Tarayici degistirdiginizde veya yedek almak istediginizde tum fikirlerinizi tek bir JSON dosyasinda saklayabilirsiniz.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadJsonBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON Yedegi Indir ({ideas.length} fikir)</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>JSON Yedeği Yukle</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="text-xs text-emerald-400 font-medium">
                {importStatus}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end px-6 py-3.5 bg-slate-950/80 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
