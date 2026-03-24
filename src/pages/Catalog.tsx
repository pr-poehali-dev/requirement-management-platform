import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';
import {
  MOCK_REQUIREMENTS, MOCK_TECHNOLOGIES, MOCK_SOLUTIONS, MOCK_ARCHITECTURES, MOCK_TECH_DOMAINS,
  Technology, TechnicalSolution, TypicalArchitecture, TechDomain, Requirement,
  ARCH_STATUS_CONFIG, SOLUTION_STATUS_CONFIG,
} from '@/types';

type CatalogTab = 'architectures' | 'solutions' | 'technologies';

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

function ArchDetail({ arch, solutions, techDomains, onClose }: {
  arch: TypicalArchitecture;
  solutions: TechnicalSolution[];
  techDomains: TechDomain[];
  onClose: () => void;
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
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">v{s.version} · {s.owner}</p>
                      </div>
                      <Badge className={sc.color}>{sc.label}</Badge>
                    </div>
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

function SolutionDetail({ solution, technologies, onClose }: {
  solution: TechnicalSolution;
  technologies: Technology[];
  onClose: () => void;
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
                  <div key={tech.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{tech.name}</p>
                      <span className="text-xs text-cyan-400 font-mono">v{tech.version}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tech.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
                  <div key={req.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm font-medium text-foreground">{req.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
                    <div className="flex gap-2 mt-2">
                      {req.tags.slice(0, 3).map(t => <Badge key={t} className="text-slate-400 bg-slate-400/10 border-slate-400/20">#{t}</Badge>)}
                    </div>
                  </div>
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

// ─── Главная страница Каталог ─────────────────────────────────────────────────

const TAB_CONFIG: Record<CatalogTab, { label: string; icon: string; color: string; accent: string }> = {
  architectures: { label: 'Архитектуры', icon: 'Blocks',      color: 'text-pink-400',  accent: 'border-pink-500/50 bg-pink-500/10' },
  solutions:     { label: 'Решения',      icon: 'LayoutGrid',  color: 'text-blue-400',  accent: 'border-blue-500/50 bg-blue-500/10' },
  technologies:  { label: 'Технологии',   icon: 'Cpu',         color: 'text-cyan-400',  accent: 'border-cyan-500/50 bg-cyan-500/10' },
};

export default function Catalog() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CatalogTab>('architectures');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [architectures] = useLocalStorage('reqflow_architectures', MOCK_ARCHITECTURES);
  const [solutions] = useLocalStorage('reqflow_solutions', MOCK_SOLUTIONS);
  const [technologies] = useLocalStorage('reqflow_technologies', MOCK_TECHNOLOGIES);
  const [techDomains] = useLocalStorage('reqflow_techDomains', MOCK_TECH_DOMAINS);
  const [requirements] = useLocalStorage('reqflow_requirements', MOCK_REQUIREMENTS);

  const [selectedArch, setSelectedArch] = useState<TypicalArchitecture | null>(null);
  const [selectedSol, setSelectedSol] = useState<TechnicalSolution | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);

  const approvedArchitectures = useMemo(() =>
    architectures.filter(a => statusFilter === 'all' ? true : a.status === statusFilter)
      .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))),
    [architectures, search, statusFilter]
  );

  const filteredSolutions = useMemo(() =>
    solutions.filter(s => statusFilter === 'all' ? true : s.status === statusFilter)
      .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))),
    [solutions, search, statusFilter]
  );

  const filteredTechnologies = useMemo(() =>
    technologies.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())),
    [technologies, search]
  );

  const statusOptions = tab === 'technologies' ? [] : [
    { value: 'all', label: 'Все статусы' },
    { value: 'approved', label: 'Утверждено' },
    { value: 'review', label: 'На ревью' },
    { value: 'draft', label: 'Черновик' },
    { value: 'archived', label: 'В архиве' },
  ];

  const counts = {
    architectures: approvedArchitectures.length,
    solutions: filteredSolutions.length,
    technologies: filteredTechnologies.length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
              <Icon name="ArrowLeft" size={16} className="text-muted-foreground" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-blue-500 flex items-center justify-center">
              <Icon name="BookOpen" size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Каталог</h1>
              <p className="text-xs text-muted-foreground">Шаблоны и технические решения</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Поиск */}
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 w-52"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={12} />
                </button>
              )}
            </div>

            {/* Фильтр статуса */}
            {statusOptions.length > 0 && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-white/20"
              >
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Вкладки */}
        <div className="max-w-7xl mx-auto px-6 pb-0 flex gap-1">
          {(Object.entries(TAB_CONFIG) as [CatalogTab, typeof TAB_CONFIG[CatalogTab]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${tab === key ? `${cfg.color} border-current` : 'text-muted-foreground border-transparent hover:text-foreground'}`}
            >
              <Icon name={cfg.icon} size={15} />
              {cfg.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${tab === key ? 'bg-white/10' : 'bg-white/5'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Архитектуры */}
        {tab === 'architectures' && (
          <div className="animate-fade-in">
            {approvedArchitectures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                <Icon name="Blocks" size={40} className="opacity-20" />
                <p>Нет архитектур по вашему запросу</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedArchitectures.map(arch => (
                  <ArchCard key={arch.id} arch={arch} techDomains={techDomains} onClick={() => setSelectedArch(arch)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Решения */}
        {tab === 'solutions' && (
          <div className="animate-fade-in">
            {filteredSolutions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                <Icon name="LayoutGrid" size={40} className="opacity-20" />
                <p>Нет решений по вашему запросу</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSolutions.map(sol => (
                  <SolutionCard key={sol.id} solution={sol} onClick={() => setSelectedSol(sol)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Технологии */}
        {tab === 'technologies' && (
          <div className="animate-fade-in">
            {filteredTechnologies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                <Icon name="Cpu" size={40} className="opacity-20" />
                <p>Нет технологий по вашему запросу</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTechnologies.map(tech => (
                  <TechCard key={tech.id} tech={tech} onClick={() => setSelectedTech(tech)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail панели */}
      {selectedArch && (
        <ArchDetail arch={selectedArch} solutions={solutions} techDomains={techDomains} onClose={() => setSelectedArch(null)} />
      )}
      {selectedSol && (
        <SolutionDetail solution={selectedSol} technologies={technologies} onClose={() => setSelectedSol(null)} />
      )}
      {selectedTech && (
        <TechDetail tech={selectedTech} requirements={requirements} onClose={() => setSelectedTech(null)} />
      )}
    </div>
  );
}