import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';
import {
  MOCK_REQUIREMENTS, MOCK_TECHNOLOGIES, MOCK_SOLUTIONS, MOCK_ARCHITECTURES, MOCK_TECH_DOMAINS,
  Technology, TechnicalSolution, TypicalArchitecture, TechDomain, Requirement,
  ARCH_STATUS_CONFIG, SOLUTION_STATUS_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG,
  Category, Priority, Status,
} from '@/types';
import { exportArchToPdf, exportArchToWord } from '@/services/archExport';



// ─── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}

function MermaidDiagram({ content, id }: { content: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
    if (ref.current) {
      const uid = `mermaid-cat-${id}-${Date.now()}`;
      mermaid.render(uid, content).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      }).catch(() => {
        if (ref.current) ref.current.innerHTML = `<pre class="text-xs text-red-400 p-2">${content}</pre>`;
      });
    }
  }, [content, id]);
  return <div ref={ref} className="w-full overflow-auto" />;
}

// ─── Detail панели ─────────────────────────────────────────────────────────────

function ArchDetail({ arch, solutions, technologies, techDomains, requirements, onClose, onOpenSolution }: {
  arch: TypicalArchitecture;
  solutions: TechnicalSolution[];
  technologies: Technology[];
  techDomains: TechDomain[];
  requirements: Requirement[];
  onClose: () => void;
  onOpenSolution: (s: TechnicalSolution) => void;
}) {
  const cfg = ARCH_STATUS_CONFIG[arch.status] ?? { label: arch.status, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
  const domain = techDomains.find(d => d.id === arch.techDomainId);
  const linkedSolutions = solutions.filter(s => arch.solutionIds.includes(s.id));
  const [activeScheme, setActiveScheme] = useState(0);
  const [exporting, setExporting] = useState<'pdf' | 'word' | null>(null);

  const exportCtx = { arch, solutions, technologies, techDomains, requirements };

  async function handleExportPdf() {
    setExporting('pdf');
    try { exportArchToPdf(exportCtx); } finally { setExporting(null); }
  }

  async function handleExportWord() {
    setExporting('word');
    try { await exportArchToWord(exportCtx); } finally { setExporting(null); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-2xl bg-[#0a0f1a] border-l border-white/10 overflow-y-auto flex flex-col animate-fade-in">
        <div className="sticky top-0 z-10 bg-[#0a0f1a]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
              <Icon name="Blocks" size={17} className="text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{arch.id} · v{arch.version}</p>
              <h2 className="text-base font-semibold text-foreground leading-tight">{arch.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={!!exporting}
              title="Экспорт в PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all disabled:opacity-50"
            >
              {exporting === 'pdf' ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="FileText" size={13} />}
              PDF
            </button>
            <button
              onClick={handleExportWord}
              disabled={!!exporting}
              title="Экспорт в Word"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 text-muted-foreground hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all disabled:opacity-50"
            >
              {exporting === 'word' ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="FileDown" size={13} />}
              Word
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
              <Icon name="X" size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Статус и мета */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={cfg.color}>{cfg.label}</Badge>
            {arch.approvedByIb && <Badge className="text-emerald-400 bg-emerald-400/10 border-emerald-400/30">ИБ ✓</Badge>}
            {arch.approvedByIt && <Badge className="text-blue-400 bg-blue-400/10 border-blue-400/30">IT ✓</Badge>}
            {domain && <Badge className="text-purple-400 bg-purple-400/10 border-purple-400/30">{domain.name}</Badge>}
            {arch.tags.map(t => <Badge key={t} className="text-slate-400 bg-slate-400/10 border-slate-400/20">#{t}</Badge>)}
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{arch.description}</p>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground border-t border-white/10 pt-4">
              <span>Автор: <span className="text-foreground">{arch.author}</span></span>
              <span>Обновлено: <span className="text-foreground">{arch.updatedAt}</span></span>
            </div>
          </div>

          {/* Диаграммы */}
          {arch.schemes.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Icon name="GitBranch" size={15} className="text-pink-400" /> Диаграммы
              </h3>
              {arch.schemes.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {arch.schemes.map((s, i) => (
                    <button key={s.id} onClick={() => setActiveScheme(i)}
                      className={`px-3 py-1 rounded-lg text-xs border transition-colors ${i === activeScheme ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <MermaidDiagram content={arch.schemes[activeScheme]?.content} id={`arch-${arch.id}-${activeScheme}`} />
            </div>
          )}

          {/* Решения */}
          {linkedSolutions.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Icon name="LayoutGrid" size={15} className="text-blue-400" /> Технические решения ({linkedSolutions.length})
              </h3>
              <div className="space-y-2">
                {linkedSolutions.map(s => {
                  const sc = SOLUTION_STATUS_CONFIG[s.status] ?? { label: s.status, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
                  return (
                    <button key={s.id} onClick={() => { onClose(); onOpenSolution(s); }} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group text-left">
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-blue-300 transition-colors">{s.name}</p>
                        <p className="text-xs text-muted-foreground">v{s.version} · {s.owner}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={sc.color}>{sc.label}</Badge>
                        <Icon name="ChevronRight" size={14} className="text-muted-foreground group-hover:text-blue-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SolutionReqRow({ req, techName }: { req: Requirement; techName: string }) {
  const [open, setOpen] = useState(false);
  const prio = PRIORITY_CONFIG[req.priority] ?? { label: req.priority, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
  const stat = STATUS_CONFIG[req.status] ?? { label: req.status, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
  const cat = CATEGORY_CONFIG[req.category] ?? { label: req.category, icon: 'Circle', color: 'text-slate-400' };

  const iodColor = (v: string) =>
    v === 'Обязательный' ? 'text-amber-400' : v === 'Рекомендуется' ? 'text-cyan-400' : 'text-muted-foreground';

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full grid text-left hover:bg-white/3 transition-colors group"
        style={{ gridTemplateColumns: '80px 100px 130px 1fr 100px 90px 28px' }}
      >
        <div className="px-3 py-2.5 flex items-start">
          <span className="text-[11px] font-mono text-muted-foreground">{req.id}</span>
        </div>
        <div className="px-2 py-2.5 flex items-start">
          <Badge className="text-slate-400 bg-slate-400/10 border-slate-400/20 text-[10px] truncate max-w-full">{techName}</Badge>
        </div>
        <div className="px-2 py-2.5 flex items-start">
          <span className={`flex items-center gap-1 text-[11px] ${cat.color}`}>
            <Icon name={cat.icon} size={10} className="flex-shrink-0" />
            <span className="truncate">{cat.label}</span>
          </span>
        </div>
        <div className="px-2 py-2.5 min-w-0">
          <p className="text-xs font-medium text-foreground group-hover:text-blue-300 transition-colors leading-snug truncate">{req.title}</p>
          {!open && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{req.description}</p>}
        </div>
        <div className="px-2 py-2.5 flex items-start">
          <Badge className={`${prio.color} text-[10px]`}>{prio.label}</Badge>
        </div>
        <div className="px-2 py-2.5 flex items-start">
          <Badge className={`${stat.color} text-[10px]`}>{stat.label}</Badge>
        </div>
        <div className="px-1 py-2.5 flex items-start justify-center">
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={13} className="text-muted-foreground group-hover:text-blue-400 transition-colors mt-0.5" />
        </div>
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-xl border border-white/10 bg-white/3 p-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{req.description}</p>

          {req.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {req.tags.map(t => <Badge key={t} className="text-slate-400 bg-slate-400/10 border-slate-400/20 text-[10px]">#{t}</Badge>)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs border-t border-white/10 pt-3">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Автор</span>
              <span className="text-foreground text-right">{req.author}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Версия</span>
              <span className="text-foreground font-mono">v{req.version}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Создано</span>
              <span className="text-foreground">{req.createdAt}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Обновлено</span>
              <span className="text-foreground">{req.updatedAt}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Закупки</span>
              <span className={req.procurement === 'Применимо' ? 'text-green-400' : 'text-muted-foreground'}>{req.procurement}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Скоринг (кат.)</span>
              <span className="text-foreground">{req.scoringCategory}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Скоринг (вес)</span>
              <span className="text-foreground">{req.scoringWeight}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Внеш. с ИОД</span>
              <span className={iodColor(req.externalWithIod)}>{req.externalWithIod}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Внеш. без ИОД</span>
              <span className={iodColor(req.externalWithoutIod)}>{req.externalWithoutIod}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Внутр. с ИОД</span>
              <span className={iodColor(req.internalWithIod)}>{req.internalWithIod}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Внутр. без ИОД</span>
              <span className={iodColor(req.internalWithoutIod)}>{req.internalWithoutIod}</span>
            </div>
          </div>

          {(req.environments.length > 0 || req.appStages.length > 0) && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs border-t border-white/10 pt-3">
              {req.environments.length > 0 && (
                <div>
                  <span className="text-muted-foreground block mb-1">Среды</span>
                  <div className="flex flex-wrap gap-1">
                    {req.environments.map(e => <Badge key={e} className="text-sky-400 bg-sky-400/10 border-sky-400/20 text-[10px]">{e}</Badge>)}
                  </div>
                </div>
              )}
              {req.appStages.length > 0 && (
                <div>
                  <span className="text-muted-foreground block mb-1">Стадии</span>
                  <div className="flex flex-wrap gap-1">
                    {req.appStages.map(s => <Badge key={s} className="text-violet-400 bg-violet-400/10 border-violet-400/20 text-[10px]">{s}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SolutionDetail({ solution, technologies, requirements, onClose, onOpenTech }: {
  solution: TechnicalSolution;
  technologies: Technology[];
  requirements: Requirement[];
  onClose: () => void;
  onOpenTech: (t: Technology) => void;
}) {
  const cfg = SOLUTION_STATUS_CONFIG[solution.status] ?? { label: solution.status, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
  const linked = technologies.filter(t => solution.technologyIds.includes(t.id));

  const reqsWithTech = useMemo(() => {
    const result: { req: Requirement; techName: string }[] = [];
    for (const tech of linked) {
      for (const reqId of tech.requirementIds) {
        const req = requirements.find(r => r.id === reqId);
        if (req) result.push({ req, techName: tech.name });
      }
    }
    return result;
  }, [linked, requirements]);

  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [filterPrio, setFilterPrio] = useState<Priority | 'all'>('all');
  const [filterStat, setFilterStat] = useState<Status | 'all'>('all');

  const filteredReqs = useMemo(() => reqsWithTech.filter(({ req }) => {
    if (filterCat !== 'all' && req.category !== filterCat) return false;
    if (filterPrio !== 'all' && req.priority !== filterPrio) return false;
    if (filterStat !== 'all' && req.status !== filterStat) return false;
    return true;
  }), [reqsWithTech, filterCat, filterPrio, filterStat]);

  const hasFilters = filterCat !== 'all' || filterPrio !== 'all' || filterStat !== 'all';

  const usedCats = useMemo(() => [...new Set(reqsWithTech.map(x => x.req.category))], [reqsWithTech]);
  const usedPrios = useMemo(() => [...new Set(reqsWithTech.map(x => x.req.priority))], [reqsWithTech]);
  const usedStats = useMemo(() => [...new Set(reqsWithTech.map(x => x.req.status))], [reqsWithTech]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-2xl bg-[#0a0f1a] border-l border-white/10 overflow-y-auto flex flex-col animate-fade-in">
        <div className="sticky top-0 z-10 bg-[#0a0f1a]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Icon name="LayoutGrid" size={17} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{solution.id} · v{solution.version}</p>
              <h2 className="text-base font-semibold text-foreground leading-tight">{solution.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={cfg.color}>{cfg.label}</Badge>
            {solution.tags.map(t => <Badge key={t} className="text-slate-400 bg-slate-400/10 border-slate-400/20">#{t}</Badge>)}
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{solution.description}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-white/10 pt-4">
              <span>Владелец: <span className="text-foreground">{solution.owner}</span></span>
              <span>Автор: <span className="text-foreground">{solution.author}</span></span>
              <span>Создано: <span className="text-foreground">{solution.createdAt}</span></span>
              <span>Обновлено: <span className="text-foreground">{solution.updatedAt}</span></span>
            </div>
          </div>

          {linked.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Icon name="Cpu" size={15} className="text-cyan-400" /> Используемые технологии ({linked.length})
              </h3>
              <div className="space-y-2">
                {linked.map(tech => (
                  <button key={tech.id} onClick={() => { onClose(); onOpenTech(tech); }} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground group-hover:text-cyan-300 transition-colors">{tech.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cyan-400 font-mono">v{tech.version}</span>
                        <Icon name="ChevronRight" size={14} className="text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tech.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {reqsWithTech.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Icon name="ListChecks" size={15} className="text-amber-400" />
                    Перечень требований к используемым технологиям
                    <span className="text-amber-400">({filteredReqs.length}{hasFilters ? `/${reqsWithTech.length}` : ''})</span>
                  </h3>
                  {hasFilters && (
                    <button
                      onClick={() => { setFilterCat('all'); setFilterPrio('all'); setFilterStat('all'); }}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <Icon name="X" size={11} /> Сбросить
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterCat('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${filterCat === 'all' && filterPrio === 'all' && filterStat === 'all' ? 'bg-white/10 border-white/20 text-foreground' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}
                  >
                    Все
                  </button>
                  {usedCats.map(cat => {
                    const c = CATEGORY_CONFIG[cat];
                    return (
                      <button key={cat} onClick={() => setFilterCat(filterCat === cat ? 'all' : cat)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${filterCat === cat ? `${c.color} bg-white/10 border-white/20` : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        <Icon name={c.icon} size={10} />{c.label}
                      </button>
                    );
                  })}
                  <div className="w-px bg-white/10 self-stretch mx-0.5" />
                  {usedPrios.map(p => {
                    const pc = PRIORITY_CONFIG[p];
                    return (
                      <button key={p} onClick={() => setFilterPrio(filterPrio === p ? 'all' : p)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${filterPrio === p ? pc.color : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {pc.label}
                      </button>
                    );
                  })}
                  <div className="w-px bg-white/10 self-stretch mx-0.5" />
                  {usedStats.map(s => {
                    const sc = STATUS_CONFIG[s];
                    return (
                      <button key={s} onClick={() => setFilterStat(filterStat === s ? 'all' : s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${filterStat === s ? sc.color : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/10">
                <div
                  className="grid px-3 py-2 border-b border-white/10 bg-white/3"
                  style={{ gridTemplateColumns: '80px 100px 130px 1fr 100px 90px 28px' }}
                >
                  {['НУМЕРАЦИЯ', 'ТЕХНОЛОГИЯ', 'КАТЕГОРИЯ', 'НАЗВАНИЕ ТРЕБОВАНИЯ', 'ПРИОРИТЕТ', 'СТАТУС', ''].map((h, i) => (
                    <span key={i} className="text-[10px] font-semibold tracking-wider text-muted-foreground/60 px-1 truncate">{h}</span>
                  ))}
                </div>

                {filteredReqs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Нет требований по выбранным фильтрам</p>
                ) : (
                  filteredReqs.map(({ req, techName }) => (
                    <SolutionReqRow key={req.id} req={req} techName={techName} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReqExpandCard({ req }: { req: Requirement }) {
  const [open, setOpen] = useState(false);
  const prio = PRIORITY_CONFIG[req.priority] ?? { label: req.priority, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden transition-all">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-3 p-3 bg-white/5 hover:bg-amber-500/5 hover:border-amber-500/20 transition-all group text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground group-hover:text-amber-300 transition-colors leading-snug">{req.title}</p>
          {!open && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <Badge className={prio.color}>{prio.label}</Badge>
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-muted-foreground group-hover:text-amber-400 transition-colors" />
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 bg-white/3 border-t border-white/10 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{req.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {req.tags.map(t => <Badge key={t} className="text-slate-400 bg-slate-400/10 border-slate-400/20">#{t}</Badge>)}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-white/10 pt-2">
            <span>Статус: <span className="text-foreground">{req.status}</span></span>
            <span>Версия: <span className="text-foreground">v{req.version}</span></span>
            <span>Автор: <span className="text-foreground">{req.author}</span></span>
            {req.environments.length > 0 && (
              <span>Среды: <span className="text-foreground">{req.environments.join(', ')}</span></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TechDetail({ tech, requirements, onClose }: {
  tech: Technology;
  requirements: Requirement[];
  onClose: () => void;
}) {
  const linked = requirements.filter(r => tech.requirementIds.includes(r.id));
  const [activeScheme, setActiveScheme] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-2xl bg-[#0a0f1a] border-l border-white/10 overflow-y-auto flex flex-col animate-fade-in">
        <div className="sticky top-0 z-10 bg-[#0a0f1a]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Icon name="Cpu" size={17} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{tech.id} · v{tech.version}</p>
              <h2 className="text-base font-semibold text-foreground leading-tight">{tech.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="glass rounded-2xl p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{tech.description}</p>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground border-t border-white/10 pt-4">
              <span>Версия: <span className="text-cyan-400 font-mono">v{tech.version}</span></span>
              <span>Обновлено: <span className="text-foreground">{tech.updatedAt}</span></span>
            </div>
          </div>

          {tech.schemes.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Icon name="GitBranch" size={15} className="text-cyan-400" /> Диаграммы
              </h3>
              {tech.schemes.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {tech.schemes.map((s, i) => (
                    <button key={s.id} onClick={() => setActiveScheme(i)}
                      className={`px-3 py-1 rounded-lg text-xs border transition-colors ${i === activeScheme ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <MermaidDiagram content={tech.schemes[activeScheme]?.content} id={`tech-${tech.id}-${activeScheme}`} />
            </div>
          )}

          {linked.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Icon name="ListChecks" size={15} className="text-amber-400" /> Требования ({linked.length})
              </h3>
              <div className="space-y-2">
                {linked.map(req => (
                  <ReqExpandCard key={req.id} req={req} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Карточки ────────────────────────────────────────────────────────────────

function ArchCard({ arch, techDomains, onClick }: { arch: TypicalArchitecture; techDomains: TechDomain[]; onClick: () => void }) {
  const cfg = ARCH_STATUS_CONFIG[arch.status] ?? { label: arch.status, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
  const domain = techDomains.find(d => d.id === arch.techDomainId);
  return (
    <button onClick={onClick} className="glass rounded-2xl p-5 text-left hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group w-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0 group-hover:border-pink-500/40 transition-colors">
          <Icon name="Blocks" size={18} className="text-pink-400" />
        </div>
        <Badge className={cfg.color}>{cfg.label}</Badge>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-pink-300 transition-colors">{arch.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{arch.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {arch.tags.slice(0, 3).map(t => <Badge key={t} className="text-slate-400 bg-slate-400/10 border-slate-400/20">#{t}</Badge>)}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/10 pt-3">
        <span>{domain?.name ?? '—'}</span>
        <div className="flex gap-2">
          {arch.approvedByIb && <span className="text-emerald-400">ИБ ✓</span>}
          {arch.approvedByIt && <span className="text-blue-400">IT ✓</span>}
          <span>v{arch.version}</span>
        </div>
      </div>
    </button>
  );
}

function SolutionCard({ solution, onClick }: { solution: TechnicalSolution; onClick: () => void }) {
  const cfg = SOLUTION_STATUS_CONFIG[solution.status] ?? { label: solution.status, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
  return (
    <button onClick={onClick} className="glass rounded-2xl p-5 text-left hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group w-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/40 transition-colors">
          <Icon name="LayoutGrid" size={18} className="text-blue-400" />
        </div>
        <Badge className={cfg.color}>{cfg.label}</Badge>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-blue-300 transition-colors">{solution.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{solution.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {solution.tags.slice(0, 3).map(t => <Badge key={t} className="text-slate-400 bg-slate-400/10 border-slate-400/20">#{t}</Badge>)}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/10 pt-3">
        <span>{solution.owner}</span>
        <span>v{solution.version}</span>
      </div>
    </button>
  );
}

function TechCard({ tech, onClick }: { tech: Technology; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass rounded-2xl p-5 text-left hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group w-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:border-cyan-500/40 transition-colors">
          <Icon name="Cpu" size={18} className="text-cyan-400" />
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-md">v{tech.version}</span>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-cyan-300 transition-colors">{tech.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{tech.description}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/10 pt-3">
        <span>{tech.requirementIds.length} требований</span>
        <span>{tech.schemes.length} диаграмм</span>
      </div>
    </button>
  );
}

// ─── Таб Каталог ─────────────────────────────────────────────────────────────

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'architectures' | 'solutions' | 'technologies'>('all');
  const [techDomainFilter, setTechDomainFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [architectures] = useLocalStorage('reqflow_architectures', MOCK_ARCHITECTURES);
  const [solutions] = useLocalStorage('reqflow_solutions', MOCK_SOLUTIONS);
  const [technologies] = useLocalStorage('reqflow_technologies', MOCK_TECHNOLOGIES);
  const [techDomains] = useLocalStorage('reqflow_techDomains', MOCK_TECH_DOMAINS);
  const [requirements] = useLocalStorage('reqflow_requirements', MOCK_REQUIREMENTS);

  const [selectedArch, setSelectedArch] = useState<TypicalArchitecture | null>(null);
  const [selectedSol, setSelectedSol] = useState<TechnicalSolution | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);

  const q = search.toLowerCase();

  const showArch = typeFilter === 'all' || typeFilter === 'architectures';
  const showSol = typeFilter === 'all' || typeFilter === 'solutions';
  const showTech = typeFilter === 'all' || typeFilter === 'technologies';

  const filteredArchitectures = useMemo(() =>
    !showArch ? [] : architectures
      .filter(a => statusFilter === 'all' || a.status === statusFilter)
      .filter(a => techDomainFilter === 'all' || a.techDomainId === techDomainFilter)
      .filter(a => !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q)) || a.author.toLowerCase().includes(q)),
    [architectures, q, statusFilter, techDomainFilter, showArch]
  );

  const filteredSolutions = useMemo(() =>
    !showSol ? [] : solutions
      .filter(s => statusFilter === 'all' || s.status === statusFilter)
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)) || s.owner.toLowerCase().includes(q) || s.author.toLowerCase().includes(q)),
    [solutions, q, statusFilter, showSol]
  );

  const filteredTechnologies = useMemo(() =>
    !showTech ? [] : technologies
      .filter(t => !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
    [technologies, q, showTech]
  );

  const totalCount = filteredArchitectures.length + filteredSolutions.length + filteredTechnologies.length;
  const isEmpty = totalCount === 0;

  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    techDomainFilter !== 'all',
  ].filter(Boolean).length;

  function resetFilters() {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setTechDomainFilter('all');
  }

  const archRef = useRef<HTMLElement>(null);
  const solRef = useRef<HTMLElement>(null);
  const techRef = useRef<HTMLElement>(null);

  function scrollTo(ref: React.RefObject<HTMLElement>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    { value: 'approved', label: 'Утверждено' },
    { value: 'review', label: 'На ревью' },
    { value: 'draft', label: 'Черновик' },
    { value: 'archived', label: 'В архиве' },
  ];

  return (
    <div className="space-y-6">
      {/* Поиск + фильтры */}
      <div className="flex flex-col gap-3">
        {/* Строка поиска */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию, описанию, тегам, автору..."
              className="w-full pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/25 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Icon name="X" size={12} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all flex-shrink-0 ${showFilters || activeFiltersCount > 0 ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'}`}
          >
            <Icon name="SlidersHorizontal" size={14} />
            Фильтры
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center font-medium">{activeFiltersCount}</span>
            )}
          </button>
          {(search || activeFiltersCount > 0) && (
            <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground bg-white/5 border border-white/10 hover:border-white/20 transition-all flex-shrink-0">
              <Icon name="RotateCcw" size={13} />
              Сбросить
            </button>
          )}
        </div>

        {/* Панель фильтров */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white/3 border border-white/10 rounded-xl">
            {/* Тип */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Тип объекта</p>
              <div className="flex flex-col gap-1">
                {([
                  { value: 'all', label: 'Все типы', icon: 'LayoutGrid' },
                  { value: 'architectures', label: 'Архитектуры', icon: 'Blocks' },
                  { value: 'solutions', label: 'Тех. решения', icon: 'LayoutGrid' },
                  { value: 'technologies', label: 'Технологии', icon: 'Cpu' },
                ] as { value: typeof typeFilter; label: string; icon: string }[]).map(o => (
                  <button
                    key={o.value}
                    onClick={() => setTypeFilter(o.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-left transition-all ${typeFilter === o.value ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'}`}
                  >
                    <Icon name={o.icon} size={12} />
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Статус */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Статус</p>
              <div className="flex flex-col gap-1">
                {statusOptions.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setStatusFilter(o.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-left transition-all ${statusFilter === o.value ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${o.value === 'approved' ? 'bg-green-400' : o.value === 'review' ? 'bg-cyan-400' : o.value === 'draft' ? 'bg-slate-400' : o.value === 'archived' ? 'bg-orange-400' : 'bg-white/30'}`} />
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Тех. домен */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Тех. домен (для архитектур)</p>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                <button
                  onClick={() => setTechDomainFilter('all')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-left transition-all ${techDomainFilter === 'all' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'}`}
                >
                  <Icon name="Server" size={12} />
                  Все домены
                </button>
                {techDomains.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setTechDomainFilter(d.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-left transition-all ${techDomainFilter === d.id ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                    <span className="truncate">{d.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Якорное меню + счётчик */}
        {!isEmpty && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {filteredArchitectures.length > 0 && (
                <button onClick={() => scrollTo(archRef)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-pink-400 hover:bg-pink-500/10 transition-all">
                  <Icon name="Blocks" size={12} className="text-pink-400" />
                  Архитектуры
                  <span className="font-mono opacity-60">{filteredArchitectures.length}</span>
                </button>
              )}
              {filteredSolutions.length > 0 && (
                <button onClick={() => scrollTo(solRef)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                  <Icon name="LayoutGrid" size={12} className="text-blue-400" />
                  Решения
                  <span className="font-mono opacity-60">{filteredSolutions.length}</span>
                </button>
              )}
              {filteredTechnologies.length > 0 && (
                <button onClick={() => scrollTo(techRef)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                  <Icon name="Cpu" size={12} className="text-cyan-400" />
                  Технологии
                  <span className="font-mono opacity-60">{filteredTechnologies.length}</span>
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{totalCount} элементов</span>
          </div>
        )}
      </div>

      <div className="space-y-10">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-3">
            <Icon name="SearchX" size={40} className="opacity-20" />
            <p>Ничего не найдено по вашему запросу</p>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            {filteredArchitectures.length > 0 && (
              <section ref={archRef}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Blocks" size={16} className="text-pink-400" />
                  <h2 className="text-sm font-semibold text-pink-400">Типовые архитектуры</h2>
                  <span className="text-xs text-muted-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">{filteredArchitectures.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredArchitectures.map(arch => (
                    <ArchCard key={arch.id} arch={arch} techDomains={techDomains} onClick={() => setSelectedArch(arch)} />
                  ))}
                </div>
              </section>
            )}

            {filteredSolutions.length > 0 && (
              <section ref={solRef}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="LayoutGrid" size={16} className="text-blue-400" />
                  <h2 className="text-sm font-semibold text-blue-400">Технические решения</h2>
                  <span className="text-xs text-muted-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">{filteredSolutions.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSolutions.map(sol => (
                    <SolutionCard key={sol.id} solution={sol} onClick={() => setSelectedSol(sol)} />
                  ))}
                </div>
              </section>
            )}

            {filteredTechnologies.length > 0 && (
              <section ref={techRef}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Cpu" size={16} className="text-cyan-400" />
                  <h2 className="text-sm font-semibold text-cyan-400">Технологии</h2>
                  <span className="text-xs text-muted-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">{filteredTechnologies.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTechnologies.map(tech => (
                    <TechCard key={tech.id} tech={tech} onClick={() => setSelectedTech(tech)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Detail панели */}
      {selectedArch && (
        <ArchDetail
          arch={selectedArch}
          solutions={solutions}
          technologies={technologies}
          techDomains={techDomains}
          requirements={requirements}
          onClose={() => setSelectedArch(null)}
          onOpenSolution={s => { setSelectedArch(null); setSelectedSol(s); }}
        />
      )}
      {selectedSol && (
        <SolutionDetail
          solution={selectedSol}
          technologies={technologies}
          requirements={requirements}
          onClose={() => setSelectedSol(null)}
          onOpenTech={t => { setSelectedSol(null); setSelectedTech(t); }}
        />
      )}
      {selectedTech && (
        <TechDetail tech={selectedTech} requirements={requirements} onClose={() => setSelectedTech(null)} />
      )}
    </div>
  );
}