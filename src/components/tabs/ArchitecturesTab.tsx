import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import mermaid from 'mermaid';
import Icon from '@/components/ui/icon';
import {
  TypicalArchitecture, TechDomain, TechnicalSolution, Requirement,
  ArchView, ArchStatus, MermaidScheme,
  ARCH_STATUS_CONFIG, SOLUTION_STATUS_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG,
  emptyArchForm, delayClass,
} from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${className ?? ''}`}>
      {children}
    </span>
  );
}

function ApprovalBadge({ approved, label }: { approved: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${approved ? 'bg-green-500/10 border-green-500/25' : 'bg-white/5 border-white/10'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${approved ? 'bg-green-500' : 'bg-white/10'}`}>
        {approved
          ? <Icon name="Check" size={11} className="text-white" />
          : <Icon name="Minus" size={11} className="text-muted-foreground" />}
      </div>
      <span className={`text-sm font-medium ${approved ? 'text-green-400' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}

const ARCH_STATUSES: ArchStatus[] = ['draft', 'review', 'approved', 'rejected', 'archived'];

// ─── MermaidDiagram ────────────────────────────────────────────────────────────

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });

function MermaidDiagram({ content, id }: { content: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setSvg(null);
    mermaid.render(`mermaid-${id}`, content)
      .then(({ svg: rendered }) => { if (!cancelled) setSvg(rendered); })
      .catch(e => { if (!cancelled) setError(String(e?.message ?? e)); });
    return () => { cancelled = true; };
  }, [content, id]);

  if (error) return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono whitespace-pre-wrap">{error}</div>
  );
  if (!svg) return (
    <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
      <Icon name="Loader2" size={16} className="animate-spin" />Рендеринг…
    </div>
  );
  return (
    <div ref={ref} className="overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

// ─── MermaidViewer ─────────────────────────────────────────────────────────────

function MermaidViewer({ schemes }: { schemes: MermaidScheme[] }) {
  const [active, setActive] = useState(0);
  const [showCode, setShowCode] = useState(false);

  if (schemes.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Icon name="FileCode2" size={36} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Схемы Mermaid не загружены</p>
      </div>
    );
  }

  const cur = schemes[active];

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground">
          Схемы Mermaid <span className="text-indigo-400">({schemes.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showCode ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-400' : 'glass text-muted-foreground hover:text-foreground'}`}
          >
            <Icon name="Code2" size={12} />{showCode ? 'Диаграмма' : 'Код'}
          </button>
          {schemes.length > 1 && (
            <div className="flex gap-1">
              {schemes.map((s, i) => (
                <button key={s.id} onClick={() => setActive(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active === i ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-400' : 'glass text-muted-foreground hover:text-foreground'}`}>
                  {i + 1}. {s.name.length > 16 ? s.name.slice(0, 16) + '…' : s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bg-[#0d1117] rounded-xl border border-white/8 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
          <Icon name="FileCode2" size={13} className="text-indigo-400" />
          <span className="text-xs text-muted-foreground font-mono">{cur.name}</span>
          <span className="ml-auto text-xs text-muted-foreground">Загружено: {cur.uploadedAt}</span>
        </div>
        <div className="p-4 min-h-[120px]">
          {showCode ? (
            <pre className="text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-words max-h-72 overflow-y-auto">
              {cur.content}
            </pre>
          ) : (
            <MermaidDiagram key={cur.id} content={cur.content} id={cur.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LinkedRequirements ────────────────────────────────────────────────────────

interface LRProps {
  requirementIds: string[];
  requirements: Requirement[];
  title?: string;
}

function LinkedRequirements({ requirementIds, requirements, title = 'Привязанные требования' }: LRProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const interactionLabel: Record<string, string> = {
    'Обязательный': 'Обяз.',
    'Рекомендуется': 'Рек.',
    'Не требуется': '—',
  };

  const items = requirementIds.map(id => requirements.find(r => r.id === id)).filter(Boolean) as Requirement[];

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">
        {title} <span className="text-cyan-400">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Требования отсутствуют</p>
      ) : (
        <div className="space-y-2">
          {items.map(req => {
            const isOpen = expandedId === req.id;
            const catCfg = CATEGORY_CONFIG[req.category];
            const statusCfg = STATUS_CONFIG[req.status];
            return (
              <div key={req.id} className="glass rounded-xl border border-white/5 overflow-hidden transition-all">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-oswald text-muted-foreground tracking-widest shrink-0 w-20">{req.id}</span>
                  <span className="text-sm text-foreground flex-1 min-w-0 truncate font-medium">{req.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={PRIORITY_CONFIG[req.priority].color}>{PRIORITY_CONFIG[req.priority].label}</Badge>
                    <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                    <button
                      onClick={() => setExpandedId(isOpen ? null : req.id)}
                      className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={14} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-white/5 px-4 py-4 space-y-4 bg-white/[0.02]">
                    {req.description && (
                      <div>
                        <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">Описание</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{req.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Категория</p>
                        <span className={`text-xs font-medium ${catCfg.color} flex items-center gap-1`}>
                          <Icon name={catCfg.icon as string} size={12} />{catCfg.label}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Версия требования</p>
                        <span className="text-xs text-foreground font-mono">{req.version || '—'}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Скор. категория</p>
                        <span className="text-xs text-foreground font-mono">{req.scoringCategory ?? '—'}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Скор. вес</p>
                        <span className="text-xs text-foreground font-mono">{req.scoringWeight ?? '—'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">Среда применения</p>
                        <div className="flex flex-wrap gap-1">
                          {(req.environments ?? []).length > 0
                            ? req.environments.map(e => <Badge key={e} className="text-cyan-400 border-cyan-400/20 bg-cyan-400/5">{e}</Badge>)
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">Стадии приложения</p>
                        <div className="flex flex-wrap gap-1">
                          {(req.appStages ?? []).length > 0
                            ? req.appStages.map(s => <Badge key={s} className="text-violet-400 border-violet-400/20 bg-violet-400/5">{s}</Badge>)
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-3">Взаимодействия</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { label: 'Внутр. с ИОД', value: req.internalWithIod },
                          { label: 'Внутр. без ИОД', value: req.internalWithoutIod },
                          { label: 'Внешн. с ИОД', value: req.externalWithIod },
                          { label: 'Внешн. без ИОД', value: req.externalWithoutIod },
                        ].map(({ label, value }) => (
                          <div key={label} className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">{label}</p>
                            <span className={`text-xs font-medium ${
                              value === 'Обязательный' ? 'text-red-400' :
                              value === 'Рекомендуется' ? 'text-yellow-400' : 'text-muted-foreground'
                            }`}>
                              {interactionLabel[value] ?? value ?? '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Закупки:</span>
                      <Badge className={req.procurement === 'Применимо' ? 'text-green-400 border-green-400/20 bg-green-400/5' : 'text-slate-400 border-slate-400/20 bg-slate-400/5'}>
                        {req.procurement ?? '—'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ArchitecturesTab ─────────────────────────────────────────────────────────

export interface ArchitecturesTabHandle {
  isOnSubpage: boolean;
  openCreate: () => void;
  goBack: () => void;
  openDetail: (arch: TypicalArchitecture) => void;
}

interface Props {
  architectures: TypicalArchitecture[];
  setArchitectures: React.Dispatch<React.SetStateAction<TypicalArchitecture[]>>;
  techDomains: TechDomain[];
  solutions: TechnicalSolution[];
  requirements: Requirement[];
}

const ArchitecturesTab = forwardRef<ArchitecturesTabHandle, Props>(
  ({ architectures, setArchitectures, techDomains, solutions, requirements }, ref) => {
    const [view, setView] = useState<ArchView>('list');
    const [selected, setSelected] = useState<TypicalArchitecture | null>(null);
    const [form, setForm] = useState({ ...emptyArchForm });
    const [tagInput, setTagInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [archSearch, setArchSearch] = useState('');
    const [archFilterStatus, setArchFilterStatus] = useState<ArchStatus | 'all'>('all');
    const [archFilterIb, setArchFilterIb] = useState<'all' | 'yes' | 'no'>('all');
    const [archFilterIt, setArchFilterIt] = useState<'all' | 'yes' | 'no'>('all');

    useImperativeHandle(ref, () => ({
      isOnSubpage: view !== 'list',
      openCreate: () => { setForm({ ...emptyArchForm }); setTagInput(''); setView('create'); },
      goBack: () => setView('list'),
      openDetail: (arch: TypicalArchitecture) => { setSelected(arch); setView('detail'); },
    }), [view]);

    function openDetail(arch: TypicalArchitecture) { setSelected(arch); setView('detail'); }
    function openEdit(arch: TypicalArchitecture) {
      setForm({
        name: arch.name, description: arch.description, status: arch.status,
        author: arch.author, techDomainId: arch.techDomainId, version: arch.version,
        tags: [...arch.tags], schemes: [...arch.schemes], solutionIds: [...arch.solutionIds],
        approvedByIb: arch.approvedByIb, approvedByIt: arch.approvedByIt,
      });
      setSelected(arch); setView('edit');
    }

    function saveCreate() {
      const now = new Date().toISOString().split('T')[0];
      const id = `ARCH-${String(architectures.length + 1).padStart(3, '0')}`;
      setArchitectures(prev => [{ ...form, id, createdAt: now, updatedAt: now }, ...prev]);
      setView('list');
    }

    function saveEdit() {
      if (!selected) return;
      const now = new Date().toISOString().split('T')[0];
      setArchitectures(prev => prev.map(a => a.id === selected.id ? { ...a, ...form, updatedAt: now } : a));
      setView('list');
    }

    function deleteArch(id: string) {
      setArchitectures(prev => prev.filter(a => a.id !== id));
      setView('list');
    }

    function addTag(raw: string) {
      const tag = raw.trim();
      if (tag && !form.tags.includes(tag)) setForm(f => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput('');
    }
    function removeTag(tag: string) { setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) })); }

    function toggleSolution(sid: string) {
      setForm(f => ({ ...f, solutionIds: f.solutionIds.includes(sid) ? f.solutionIds.filter(id => id !== sid) : [...f.solutionIds, sid] }));
    }

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
      const files = Array.from(e.target.files ?? []);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          const content = ev.target?.result as string;
          const scheme: MermaidScheme = {
            id: `SCH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name.replace(/\.mmd?$/, ''),
            content,
            uploadedAt: new Date().toISOString().split('T')[0],
          };
          setForm(f => ({ ...f, schemes: [...f.schemes, scheme] }));
        };
        reader.readAsText(file);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function removeScheme(id: string) {
      setForm(f => ({ ...f, schemes: f.schemes.filter(s => s.id !== id) }));
    }

    const statusCfg = (s: ArchStatus) => ARCH_STATUS_CONFIG[s];

    const getDomainName = (id: string) => techDomains.find(d => d.id === id)?.name ?? '—';

    // Получить список требований из привязанных решений
    function getRelatedRequirements(archSolutionIds: string[]) {
      if (archSolutionIds.length === 0) return [];
      return requirements;
    }

    const ARCH_STATUSES: ArchStatus[] = ['draft', 'review', 'approved', 'rejected', 'archived'];

    // ── LIST ────────────────────────────────────────────────────────────────────
    if (view === 'list') return (
      <div className="animate-fade-in">
        {/* Search + Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={archSearch}
              onChange={e => setArchSearch(e.target.value)}
              placeholder="Поиск по ID, названию, описанию..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            {archSearch && (
              <button onClick={() => setArchSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
          <select
            value={archFilterStatus}
            onChange={e => setArchFilterStatus(e.target.value as ArchStatus | 'all')}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
          >
            <option value="all">Все статусы</option>
            {ARCH_STATUSES.map(s => (
              <option key={s} value={s}>{ARCH_STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <select
            value={archFilterIb}
            onChange={e => setArchFilterIb(e.target.value as 'all' | 'yes' | 'no')}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
          >
            <option value="all">ИБ: все</option>
            <option value="yes">Одобрено ИБ</option>
            <option value="no">Без ИБ</option>
          </select>
          <select
            value={archFilterIt}
            onChange={e => setArchFilterIt(e.target.value as 'all' | 'yes' | 'no')}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
          >
            <option value="all">ИТ: все</option>
            <option value="yes">Одобрено ИТ</option>
            <option value="no">Без ИТ</option>
          </select>
          {(archSearch || archFilterStatus !== 'all' || archFilterIb !== 'all' || archFilterIt !== 'all') && (
            <button onClick={() => { setArchSearch(''); setArchFilterStatus('all'); setArchFilterIb('all'); setArchFilterIt('all'); }} className="px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground border border-white/10 rounded-xl bg-white/5 transition-colors flex items-center gap-1.5">
              <Icon name="X" size={13} />Сбросить
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Типовых архитектур', value: architectures.length, icon: 'Blocks', from: 'from-indigo-500/20', to: 'to-indigo-500/5', border: 'border-indigo-500/20', text: 'text-indigo-400' },
            { label: 'Утверждено', value: architectures.filter(a => a.status === 'approved').length, icon: 'CheckCircle', from: 'from-green-500/20', to: 'to-green-500/5', border: 'border-green-500/20', text: 'text-green-400' },
            { label: 'Согласовано ИБ', value: architectures.filter(a => a.approvedByIb).length, icon: 'ShieldCheck', from: 'from-cyan-500/20', to: 'to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400' },
            { label: 'Схем Mermaid', value: architectures.reduce((acc, a) => acc + a.schemes.length, 0), icon: 'FileCode2', from: 'from-violet-500/20', to: 'to-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400' },
          ].map((s, i) => (
            <div key={s.label} className={`glass rounded-2xl p-5 border ${s.border} bg-gradient-to-br ${s.from} ${s.to} animate-fade-in ${delayClass(i)}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                <Icon name={s.icon} size={18} className={s.text} />
              </div>
              <div className={`font-oswald text-4xl font-semibold ${s.text}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {(() => {
          const q = archSearch.toLowerCase();
          const filtered = architectures.filter(a =>
            (archFilterStatus === 'all' || a.status === archFilterStatus) &&
            (archFilterIb === 'all' || (archFilterIb === 'yes' ? a.approvedByIb : !a.approvedByIb)) &&
            (archFilterIt === 'all' || (archFilterIt === 'yes' ? a.approvedByIt : !a.approvedByIt)) &&
            (!q || a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
          );
          return architectures.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Icon name="Blocks" size={48} className="text-muted-foreground mx-auto mb-4" />
            <div className="text-lg font-oswald text-muted-foreground">Типовые архитектуры не добавлены</div>
            <button onClick={() => { setForm({ ...emptyArchForm }); setTagInput(''); setView('create'); }}
              className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl text-sm font-medium text-white">
              <Icon name="Plus" size={16} />Добавить первую
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <Icon name="SearchX" size={36} className="text-muted-foreground mx-auto mb-3" />
            <div className="text-sm font-oswald text-muted-foreground">Ничего не найдено</div>
            <button onClick={() => { setArchSearch(''); setArchFilterStatus('all'); setArchFilterIb('all'); setArchFilterIt('all'); }} className="mt-3 text-xs text-indigo-400 hover:underline">Сбросить фильтры</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((arch, i) => {
              const sc = statusCfg(arch.status);
              const domain = techDomains.find(d => d.id === arch.techDomainId);
              return (
                <div key={arch.id} onClick={() => openDetail(arch)}
                  className={`glass rounded-2xl p-6 cursor-pointer card-hover border border-white/8 animate-fade-in ${delayClass(i)}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-oswald text-xs text-muted-foreground tracking-widest">{arch.id}</span>
                        <Badge className={sc.color}>{sc.label}</Badge>
                        {arch.approvedByIb && <Badge className="text-cyan-400 border-cyan-400/25 bg-cyan-400/8"><Icon name="ShieldCheck" size={10} />ИБ</Badge>}
                        {arch.approvedByIt && <Badge className="text-violet-400 border-violet-400/25 bg-violet-400/8"><Icon name="Server" size={10} />ИТ</Badge>}
                      </div>
                      <h3 className="font-oswald text-xl font-semibold text-foreground truncate">{arch.name}</h3>
                      <span className="text-xs text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-full mt-1 inline-block">v{arch.version}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Icon name="Blocks" size={20} className="text-indigo-400" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{arch.description}</p>
                  {domain && (
                    <div className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-400/8 border border-violet-400/20 rounded-lg px-2.5 py-1.5 mb-3 w-fit">
                      <Icon name="Server" size={11} />{domain.name}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {arch.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">{tag}</span>
                    ))}
                    {arch.tags.length > 4 && <span className="text-xs text-muted-foreground">+{arch.tags.length - 4}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Icon name="FileCode2" size={12} className="text-indigo-400" /><span className="text-foreground font-medium">{arch.schemes.length}</span> схем</span>
                    <span className="flex items-center gap-1.5"><Icon name="LayoutGrid" size={12} className="text-emerald-400" /><span className="text-foreground font-medium">{arch.solutionIds.length}</span> решений</span>
                    <span className="flex items-center gap-1 ml-auto"><Icon name="Calendar" size={12} />{arch.updatedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
        })()}
      </div>
    );

    // ── DETAIL ──────────────────────────────────────────────────────────────────
    if (view === 'detail' && selected) {
      const sc = statusCfg(selected.status);
      const domain = techDomains.find(d => d.id === selected.techDomainId);
      const linkedSolutions = solutions.filter(s => selected.solutionIds.includes(s.id));
      const linkedReqs = getRelatedRequirements(selected.solutionIds);

      return (
        <div className="animate-fade-in max-w-5xl space-y-6">
          {/* Header */}
          <div className="glass rounded-3xl p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-oswald text-sm text-muted-foreground tracking-widest">{selected.id}</span>
                  <Badge className={sc.color}>{sc.label}</Badge>
                  <span className="text-xs text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-full">v{selected.version}</span>
                </div>
                <h1 className="font-oswald text-4xl font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {selected.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(selected)} className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">
                  <Icon name="Edit2" size={15} />Редактировать
                </button>
                <button onClick={() => deleteArch(selected.id)} className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-red-400 hover:text-red-300 hover:border-red-500/20 border border-transparent transition-all">
                  <Icon name="Trash2" size={15} />Удалить
                </button>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">Автор</p>
                <p className="text-sm text-foreground">{selected.author || '—'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">Тех. домен</p>
                <p className="text-sm text-violet-400">{domain?.name ?? '—'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">Дата создания</p>
                <p className="text-sm text-foreground font-mono">{selected.createdAt}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">Дата редактирования</p>
                <p className="text-sm text-foreground font-mono">{selected.updatedAt}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-2">Описание</p>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-foreground/80 leading-relaxed">{selected.description || '—'}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-2">Теги</p>
              <div className="flex flex-wrap gap-2">
                {selected.tags.length > 0
                  ? selected.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-indigo-400/10 border border-indigo-400/20 text-indigo-400">
                        <Icon name="Tag" size={10} />{tag}
                      </span>
                    ))
                  : <span className="text-sm text-muted-foreground">Теги не добавлены</span>}
              </div>
            </div>

            {/* Approvals */}
            <div>
              <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-3">Согласования</p>
              <div className="grid grid-cols-2 gap-3">
                <ApprovalBadge approved={selected.approvedByIb} label="Согласован с ИБ" />
                <ApprovalBadge approved={selected.approvedByIt} label="Согласован с ИТ" />
              </div>
            </div>
          </div>

          {/* Mermaid Viewer */}
          <MermaidViewer schemes={selected.schemes} />

          {/* Linked solutions */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Перечень связанных технических решений <span className="text-emerald-400">({linkedSolutions.length})</span>
            </h2>
            {linkedSolutions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Технические решения не привязаны</p>
            ) : (
              <div className="space-y-2">
                {linkedSolutions.map(sol => {
                  const ssc = SOLUTION_STATUS_CONFIG[sol.status];
                  return (
                    <div key={sol.id} className="flex items-center gap-3 px-4 py-3 glass rounded-xl border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Icon name="LayoutGrid" size={14} className="text-emerald-400" />
                      </div>
                      <span className="font-oswald text-xs text-muted-foreground tracking-widest w-20 shrink-0">{sol.id}</span>
                      <span className="text-sm text-foreground flex-1 font-medium">{sol.name}</span>
                      <Badge className="text-indigo-400 border-indigo-400/20 bg-indigo-400/5">v{sol.version}</Badge>
                      <Badge className={ssc.color}>{ssc.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Requirements from linked solutions */}
          <LinkedRequirements
            requirementIds={linkedReqs.map(r => r.id)}
            requirements={requirements}
            title="Список требований из связанных технических решений"
          />
        </div>
      );
    }

    // ── CREATE / EDIT ───────────────────────────────────────────────────────────
    if (view === 'create' || view === 'edit') return (
      <div className="animate-fade-in max-w-3xl">
        <div className="mb-6">
          <h1 className="font-oswald text-3xl font-semibold" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {view === 'create' ? 'Новая типовая архитектура' : 'Редактирование архитектуры'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {view === 'create' ? 'Заполните данные, загрузите схемы и привяжите решения' : `Изменение ${selected?.id}`}
          </p>
        </div>

        <div className="glass rounded-3xl p-8 space-y-6">
          {/* name + version */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Название *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название архитектуры"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-muted-foreground/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Версия</label>
              <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0.0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-muted-foreground/50" />
            </div>
          </div>

          {/* author + status + techDomain */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Автор</label>
              <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="ФИО автора"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-muted-foreground/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Статус</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ArchStatus }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-indigo-500/50 transition-all">
                {ARCH_STATUSES.map(s => (
                  <option key={s} value={s} className="bg-background">{ARCH_STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Тех. домен</label>
              <select value={form.techDomainId} onChange={e => setForm(f => ({ ...f, techDomainId: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-indigo-500/50 transition-all">
                <option value="" className="bg-background">— Не выбран —</option>
                {techDomains.map(d => (
                  <option key={d.id} value={d.id} className="bg-background">{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Описание</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
              placeholder="Назначение, область применения и ключевые особенности архитектуры..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-indigo-500/50 transition-all resize-none placeholder:text-muted-foreground/50" />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Теги</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-400/10 border border-indigo-400/20 text-indigo-400">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400 transition-colors"><Icon name="X" size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                placeholder="Тег + Enter"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-muted-foreground/50" />
              <button type="button" onClick={() => addTag(tagInput)}
                className="px-4 py-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 hover:bg-indigo-500/30 transition-all">
                <Icon name="Plus" size={16} />
              </button>
            </div>
          </div>

          {/* Agreements */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">Согласования</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'approvedByIb' as const, label: 'Согласован с ИБ', icon: 'ShieldCheck' },
                { key: 'approvedByIt' as const, label: 'Согласован с ИТ', icon: 'Server' },
              ].map(({ key, label, icon }) => (
                <button key={key} type="button" onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${form[key] ? 'bg-green-500/10 border-green-500/30' : 'glass border-white/10 hover:border-white/20'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${form[key] ? 'bg-green-500' : 'bg-white/10'}`}>
                    {form[key] ? <Icon name="Check" size={11} className="text-white" /> : <Icon name="Minus" size={11} className="text-muted-foreground" />}
                  </div>
                  <Icon name={icon} size={15} className={form[key] ? 'text-green-400' : 'text-muted-foreground'} />
                  <span className={`text-sm font-medium ${form[key] ? 'text-green-400' : 'text-muted-foreground'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mermaid file upload */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">
              Схемы Mermaid <span className="text-indigo-400 normal-case ml-1">({form.schemes.length} загружено)</span>
            </label>
            <input ref={fileInputRef} type="file" multiple accept=".mmd,.md,.txt" onChange={handleFileUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-indigo-500/30 rounded-xl hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all text-muted-foreground hover:text-indigo-400 group">
              <Icon name="Upload" size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Загрузить файлы .mmd, .md, .txt</span>
              <span className="text-xs">Можно несколько файлов одновременно</span>
            </button>
            {form.schemes.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.schemes.map(scheme => (
                  <div key={scheme.id} className="flex items-center gap-3 px-4 py-2.5 glass rounded-xl border border-white/5">
                    <Icon name="FileCode2" size={15} className="text-indigo-400 shrink-0" />
                    <span className="text-sm text-foreground flex-1 truncate">{scheme.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{scheme.content.length} симв.</span>
                    <button onClick={() => removeScheme(scheme.id)} className="p-1 hover:text-red-400 text-muted-foreground transition-colors">
                      <Icon name="X" size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bind solutions */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">
              Привязать технические решения <span className="text-emerald-400 normal-case ml-1">({form.solutionIds.length} выбрано)</span>
            </label>
            {solutions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет доступных технических решений</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {solutions.map(sol => {
                  const isSelected = form.solutionIds.includes(sol.id);
                  const ssc = SOLUTION_STATUS_CONFIG[sol.status];
                  return (
                    <button key={sol.id} type="button" onClick={() => toggleSolution(sol.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${isSelected ? 'bg-emerald-500/10 border-emerald-500/30' : 'glass border-white/8 hover:border-white/20'}`}>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                        {isSelected && <Icon name="Check" size={12} className="text-white" />}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Icon name="LayoutGrid" size={13} className="text-emerald-400" />
                      </div>
                      <span className="font-oswald text-xs text-muted-foreground tracking-widest shrink-0">{sol.id}</span>
                      <span className="text-sm text-foreground flex-1 truncate">{sol.name}</span>
                      <Badge className={ssc.color}>{ssc.label}</Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={view === 'create' ? saveCreate : saveEdit}
              disabled={!form.name.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl text-sm font-medium text-white hover:from-indigo-400 hover:to-violet-400 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
              <Icon name="Save" size={16} />
              {view === 'create' ? 'Создать архитектуру' : 'Сохранить изменения'}
            </button>
            <button onClick={() => setView('list')} className="px-6 py-3 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">Отмена</button>
          </div>
        </div>
      </div>
    );

    return null;
  }
);

ArchitecturesTab.displayName = 'ArchitecturesTab';
export default ArchitecturesTab;