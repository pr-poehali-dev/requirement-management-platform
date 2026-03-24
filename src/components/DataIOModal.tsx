import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Requirement, Technology, OrgDomain, TechDomain,
  TechnicalSolution, TypicalArchitecture,
} from '@/types';
import {
  AppData,
  exportAllJson, exportSectionJson, exportSectionCsv,
  importJson,
  importCsvRequirements, importCsvTechnologies, importCsvDomains,
  importCsvTechDomains, importCsvSolutions, importCsvArchitectures,
} from '@/lib/dataIO';

interface Props {
  open: boolean;
  onClose: () => void;
  data: AppData;
  onImport: (data: Partial<AppData>) => void;
}

type Mode = 'export' | 'import';
type Format = 'json' | 'csv';

const SECTIONS = [
  { key: 'requirements', label: 'Требования', icon: 'ListChecks' },
  { key: 'technologies', label: 'Технологии', icon: 'Cpu' },
  { key: 'domains', label: 'Орг. домены', icon: 'Building2' },
  { key: 'techDomains', label: 'Тех. домены', icon: 'Server' },
  { key: 'solutions', label: 'Тех. решения', icon: 'LayoutGrid' },
  { key: 'architectures', label: 'Архитектуры', icon: 'Blocks' },
] as const;

type SectionKey = typeof SECTIONS[number]['key'];

const CSV_IMPORT_MAP: Record<SectionKey, (f: File) => Promise<unknown[]>> = {
  requirements: importCsvRequirements as (f: File) => Promise<unknown[]>,
  technologies: importCsvTechnologies as (f: File) => Promise<unknown[]>,
  domains: importCsvDomains as (f: File) => Promise<unknown[]>,
  techDomains: importCsvTechDomains as (f: File) => Promise<unknown[]>,
  solutions: importCsvSolutions as (f: File) => Promise<unknown[]>,
  architectures: importCsvArchitectures as (f: File) => Promise<unknown[]>,
};

export default function DataIOModal({ open, onClose, data, onImport }: Props) {
  const [mode, setMode] = useState<Mode>('export');
  const [format, setFormat] = useState<Format>('json');
  const [selectedSections, setSelectedSections] = useState<Set<SectionKey>>(new Set(SECTIONS.map(s => s.key)));
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importSection, setImportSection] = useState<SectionKey>('requirements');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function toggleSection(key: SectionKey) {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function handleExport() {
    if (format === 'json') {
      if (selectedSections.size === SECTIONS.length) {
        exportAllJson(data);
      } else {
        const partial: Partial<AppData> = {};
        selectedSections.forEach(k => { (partial as Record<string, unknown>)[k] = data[k as keyof AppData]; });
        exportSectionJson('export', Object.values(partial).flat());
      }
      setStatus({ type: 'success', msg: 'Файл успешно скачан' });
    } else {
      selectedSections.forEach(k => {
        const rows = data[k as keyof AppData] as Record<string, unknown>[];
        exportSectionCsv(k, rows);
      });
      setStatus({ type: 'success', msg: `Скачано ${selectedSections.size} CSV файл(ов)` });
    }
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setStatus({ type: 'error', msg: 'Выберите файл' }); return; }
    setLoading(true);
    setStatus(null);
    try {
      let imported: Partial<AppData> = {};
      if (format === 'json') {
        imported = await importJson(file);
      } else {
        const fn = CSV_IMPORT_MAP[importSection];
        const rows = await fn(file);
        imported = { [importSection]: rows } as Partial<AppData>;
      }

      if (importMode === 'replace') {
        onImport(imported);
      } else {
        const merged: Partial<AppData> = {};
        (Object.keys(imported) as SectionKey[]).forEach(k => {
          const existing = data[k] as unknown[];
          const incoming = (imported as Record<string, unknown[]>)[k] ?? [];
          const existingIds = new Set(existing.map((x: unknown) => (x as { id: string }).id));
          const newItems = incoming.filter((x: unknown) => !existingIds.has((x as { id: string }).id));
          (merged as Record<string, unknown[]>)[k] = [...existing, ...newItems];
        });
        onImport(merged);
      }
      setStatus({ type: 'success', msg: 'Данные успешно импортированы' });
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : 'Ошибка импорта' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center">
              <Icon name="ArrowLeftRight" size={18} className="text-cyan-400" />
            </div>
            <div>
              <div className="font-oswald font-semibold text-base">Импорт / Экспорт данных</div>
              <div className="text-xs text-muted-foreground">CSV и JSON форматы</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-all">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            {(['export', 'import'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setStatus(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-foreground border border-cyan-500/30' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon name={m === 'export' ? 'Download' : 'Upload'} size={15} />
                {m === 'export' ? 'Выгрузка' : 'Загрузка'}
              </button>
            ))}
          </div>

          {/* Format toggle */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Формат файла</div>
            <div className="flex gap-2">
              {(['json', 'csv'] as Format[]).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all ${format === f ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'}`}>
                  <Icon name={f === 'json' ? 'Braces' : 'Sheet'} size={14} />
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Export: sections */}
          {mode === 'export' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground">Разделы для экспорта</div>
                <button onClick={() => setSelectedSections(selectedSections.size === SECTIONS.length ? new Set() : new Set(SECTIONS.map(s => s.key)))}
                  className="text-xs text-cyan-400 hover:underline">
                  {selectedSections.size === SECTIONS.length ? 'Снять все' : 'Выбрать все'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SECTIONS.map(s => (
                  <button key={s.key} onClick={() => toggleSection(s.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${selectedSections.has(s.key) ? 'border-cyan-500/40 bg-cyan-500/8 text-foreground' : 'border-white/8 text-muted-foreground hover:border-white/20'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${selectedSections.has(s.key) ? 'bg-cyan-500 border-cyan-500' : 'border-white/20'}`}>
                      {selectedSections.has(s.key) && <Icon name="Check" size={10} className="text-white" />}
                    </div>
                    <Icon name={s.icon} size={13} className={selectedSections.has(s.key) ? 'text-cyan-400' : 'text-muted-foreground'} />
                    <span className="truncate">{s.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{(data[s.key] as unknown[]).length}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Import: section select (CSV only) + merge mode */}
          {mode === 'import' && (
            <div className="space-y-4">
              {format === 'csv' && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Раздел для импорта</div>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTIONS.map(s => (
                      <button key={s.key} onClick={() => setImportSection(s.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${importSection === s.key ? 'border-cyan-500/40 bg-cyan-500/8 text-foreground' : 'border-white/8 text-muted-foreground hover:border-white/20'}`}>
                        <Icon name={s.icon} size={13} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-2">Режим импорта</div>
                <div className="flex gap-2">
                  {([['merge', 'Добавить новые', 'GitMerge'], ['replace', 'Заменить всё', 'RefreshCw']] as const).map(([val, lbl, ico]) => (
                    <button key={val} onClick={() => setImportMode(val)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all ${importMode === val ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'}`}>
                      <Icon name={ico} size={14} />
                      {lbl}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  {importMode === 'merge' ? 'Добавятся только записи с новыми ID' : 'Текущие данные будут заменены импортированными'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Файл</div>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 cursor-pointer transition-all">
                  <Icon name="FileUp" size={18} className="text-cyan-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm">{fileRef.current?.files?.[0]?.name || `Выберите .${format} файл`}</div>
                    <div className="text-xs text-muted-foreground">Нажмите для выбора</div>
                  </div>
                  <input ref={fileRef} type="file" accept={`.${format}`} className="hidden"
                    onChange={() => setStatus(null)} />
                </label>
              </div>
            </div>
          )}

          {/* Status */}
          {status && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${status.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              <Icon name={status.type === 'success' ? 'CheckCircle2' : 'AlertCircle'} size={15} />
              {status.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
            Закрыть
          </button>
          <button
            onClick={mode === 'export' ? handleExport : handleImport}
            disabled={loading || (mode === 'export' && selectedSections.size === 0)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg">
            {loading ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name={mode === 'export' ? 'Download' : 'Upload'} size={15} />}
            {mode === 'export' ? 'Скачать' : 'Импортировать'}
          </button>
        </div>
      </div>
    </div>
  );
}
