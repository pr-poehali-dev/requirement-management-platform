import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';
import {
  MOCK_REQUIREMENTS, MOCK_TECHNOLOGIES, MOCK_SOLUTIONS, MOCK_ARCHITECTURES, MOCK_TECH_DOMAINS,
  Technology, TechnicalSolution, TypicalArchitecture, TechDomain, Requirement,
  ARCH_STATUS_CONFIG, SOLUTION_STATUS_CONFIG, PRIORITY_CONFIG,
} from '@/types';



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

function ArchDetail({ arch, solutions, techDomains, onClose, onOpenSolution }: {
  arch: TypicalArchitecture;
  solutions: TechnicalSolution[];
  techDomains: TechDomain[];
  onClose: () => void;
  onOpenSolution: (s: TechnicalSolution) => void;
}) {
  const cfg = ARCH_STATUS_CONFIG[arch.status] ?? { label: arch.status, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
  const domain = techDomains.find(d => d.id === arch.techDomainId);
  const linkedSolutions = solutions.filter(s => arch.solutionIds.includes(s.id));
  const [activeScheme, setActiveScheme] = useState(0);

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
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
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

function SolutionDetail({ solution, technologies, onClose, onOpenTech }: {
  solution: TechnicalSolution;
  technologies: Technology[];
  onClose: () => void;
  onOpenTech: (t: Technology) => void;
}) {
  const cfg = SOLUTION_STATUS_CONFIG[solution.status] ?? { label: solution.status, color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
  const linked = technologies.filter(t => solution.technologyIds.includes(t.id));

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
          techDomains={techDomains}
          onClose={() => setSelectedArch(null)}
          onOpenSolution={s => { setSelectedArch(null); setSelectedSol(s); }}
        />
      )}
      {selectedSol && (
        <SolutionDetail
          solution={selectedSol}
          technologies={technologies}
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