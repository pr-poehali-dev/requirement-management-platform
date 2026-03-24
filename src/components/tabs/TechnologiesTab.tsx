import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import Icon from '@/components/ui/icon';
import {
  Technology, Requirement, MermaidScheme, TechView,
  PRIORITY_CONFIG, CATEGORY_CONFIG, STATUS_CONFIG, emptyTechForm, delayClass,
} from '@/types';

// ─── LinkedRequirements ──────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${className ?? ''}`}>
      {children}
    </span>
  );
}

interface LRProps {
  requirementIds: string[];
  requirements: Requirement[];
  onNavigateToReq: (req: Requirement) => void;
}

function LinkedRequirements({ requirementIds, requirements, onNavigateToReq }: LRProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const interactionLabel: Record<string, string> = {
    'Обязательный': 'Обяз.',
    'Рекомендуется': 'Рек.',
    'Не требуется': '—',
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">
        Привязанные требования <span className="text-cyan-400">({requirementIds.length})</span>
      </h2>
      {requirementIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">Требования не привязаны</p>
      ) : (
        <div className="space-y-2">
          {requirementIds.map(reqId => {
            const req = requirements.find(r => r.id === reqId);
            if (!req) return null;
            const isOpen = expandedId === req.id;
            const catCfg = CATEGORY_CONFIG[req.category];
            const statusCfg = STATUS_CONFIG[req.status];
            return (
              <div key={reqId} className="glass rounded-xl border border-white/5 overflow-hidden transition-all">
                {/* Header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-oswald text-muted-foreground tracking-widest shrink-0 w-20">{req.id}</span>
                  <span className="text-sm text-foreground flex-1 min-w-0 truncate font-medium">{req.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={PRIORITY_CONFIG[req.priority].color}>
                      {PRIORITY_CONFIG[req.priority].label}
                    </Badge>
                    <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                    <button
                      onClick={() => setExpandedId(isOpen ? null : req.id)}
                      className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                      title={isOpen ? 'Свернуть' : 'Развернуть детали'}
                    >
                      <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={14} />
                    </button>
                    <button
                      onClick={() => onNavigateToReq(req)}
                      className="p-1 rounded-lg hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 transition-all"
                      title="Открыть требование"
                    >
                      <Icon name="ExternalLink" size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-white/5 px-4 py-4 space-y-4 bg-white/[0.02]">
                    {/* Description */}
                    {req.description && (
                      <div>
                        <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">Описание</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{req.description}</p>
                      </div>
                    )}

                    {/* Row 1: Category, Version, Scoring */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Категория</p>
                        <span className={`text-xs font-medium ${catCfg.color} flex items-center gap-1`}>
                          <Icon name={catCfg.icon as string} size={12} />
                          {catCfg.label}
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

                    {/* Row 2: Environments & Stages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">Среда применения</p>
                        <div className="flex flex-wrap gap-1">
                          {(req.environments ?? []).length > 0
                            ? req.environments.map(e => (
                                <Badge key={e} className="text-cyan-400 border-cyan-400/20 bg-cyan-400/5">{e}</Badge>
                              ))
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">Стадии приложения</p>
                        <div className="flex flex-wrap gap-1">
                          {(req.appStages ?? []).length > 0
                            ? req.appStages.map(s => (
                                <Badge key={s} className="text-violet-400 border-violet-400/20 bg-violet-400/5">{s}</Badge>
                              ))
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Interactions */}
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

                    {/* Row 4: Procurement */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Закупки:</span>
                      <Badge className={
                        req.procurement === 'Применимо'
                          ? 'text-green-400 border-green-400/20 bg-green-400/5'
                          : 'text-slate-400 border-slate-400/20 bg-slate-400/5'
                      }>
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

// ─── TechnologiesTab ──────────────────────────────────────────────────────────

export interface TechnologiesTabHandle {
  isOnSubpage: boolean;
  openCreate: () => void;
  goBack: () => void;
  openDetail: (tech: Technology) => void;
}

interface Props {
  technologies: Technology[];
  setTechnologies: React.Dispatch<React.SetStateAction<Technology[]>>;
  requirements: Requirement[];
  onNavigateToReq: (req: Requirement) => void;
}

const TechnologiesTab = forwardRef<TechnologiesTabHandle, Props>(
  ({ technologies, setTechnologies, requirements, onNavigateToReq }, ref) => {
    const [techView, setTechView] = useState<TechView>('list');
    const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
    const [techForm, setTechForm] = useState({ ...emptyTechForm });
    const [techReqIds, setTechReqIds] = useState<string[]>([]);
    const [techSearch, setTechSearch] = useState('');
    const schemeInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      isOnSubpage: techView !== 'list',
      openCreate: () => { setTechForm({ ...emptyTechForm }); setTechReqIds([]); setTechView('create'); },
      goBack: () => setTechView('list'),
      openDetail: (tech: Technology) => { setSelectedTech(tech); setTechView('detail'); },
    }), [techView]);

    function openTechDetail(tech: Technology) { setSelectedTech(tech); setTechView('detail'); }
    function openTechEdit(tech: Technology) {
      setTechForm({ name: tech.name, description: tech.description, version: tech.version });
      setTechReqIds([...tech.requirementIds]);
      setSelectedTech(tech); setTechView('edit');
    }
    function saveTechCreate() {
      const now = new Date().toISOString().split('T')[0];
      setTechnologies(prev => [{
        ...techForm, id: `TECH-${String(prev.length + 1).padStart(3, '0')}`,
        schemes: [], requirementIds: techReqIds, createdAt: now, updatedAt: now,
      }, ...prev]);
      setTechView('list');
    }
    function saveTechEdit() {
      if (!selectedTech) return;
      const now = new Date().toISOString().split('T')[0];
      setTechnologies(prev => prev.map(t => t.id === selectedTech.id ? { ...t, ...techForm, requirementIds: techReqIds, updatedAt: now } : t));
      setTechView('list');
    }
    function deleteTech(id: string) { setTechnologies(prev => prev.filter(t => t.id !== id)); setTechView('list'); }
    function toggleTechReq(reqId: string) {
      setTechReqIds(prev => prev.includes(reqId) ? prev.filter(id => id !== reqId) : [...prev, reqId]);
    }
    function handleSchemeUpload(techId: string, files: FileList | null) {
      if (!files) return;
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          const content = e.target?.result as string;
          const scheme: MermaidScheme = {
            id: `SCH-${Date.now()}`, name: file.name.replace('.mmd', '').replace('.txt', ''),
            content, uploadedAt: new Date().toISOString().split('T')[0],
          };
          setTechnologies(prev => prev.map(t =>
            t.id === techId ? { ...t, schemes: [...t.schemes, scheme] } : t
          ));
          if (selectedTech?.id === techId) {
            setSelectedTech(prev => prev ? { ...prev, schemes: [...prev.schemes, scheme] } : prev);
          }
        };
        reader.readAsText(file);
      });
    }
    function deleteScheme(techId: string, schemeId: string) {
      setTechnologies(prev => prev.map(t =>
        t.id === techId ? { ...t, schemes: t.schemes.filter(s => s.id !== schemeId) } : t
      ));
      if (selectedTech?.id === techId) {
        setSelectedTech(prev => prev ? { ...prev, schemes: prev.schemes.filter(s => s.id !== schemeId) } : prev);
      }
    }

    return (
      <>
        {/* LIST */}
        {techView === 'list' && (
          <div className="animate-fade-in">
            {/* Search */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={techSearch}
                  onChange={e => setTechSearch(e.target.value)}
                  placeholder="Поиск по ID, названию, описанию..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors"
                />
                {techSearch && (
                  <button onClick={() => setTechSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Технологий', value: technologies.length, icon: 'Cpu', colorFrom: 'from-violet-500/20', colorTo: 'to-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400' },
                { label: 'Схем загружено', value: technologies.reduce((s, t) => s + t.schemes.length, 0), icon: 'GitBranch', colorFrom: 'from-pink-500/20', colorTo: 'to-pink-500/5', border: 'border-pink-500/20', text: 'text-pink-400' },
                { label: 'Привязок к требованиям', value: technologies.reduce((s, t) => s + t.requirementIds.length, 0), icon: 'Link', colorFrom: 'from-cyan-500/20', colorTo: 'to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400' },
              ].map((s, i) => (
                <div key={s.label} className={`glass rounded-2xl p-5 border ${s.border} bg-gradient-to-br ${s.colorFrom} ${s.colorTo} animate-fade-in ${delayClass(i)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                    <Icon name={s.icon} size={18} className={s.text} />
                  </div>
                  <div className={`font-oswald text-4xl font-semibold ${s.text}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {(() => {
              const q = techSearch.toLowerCase();
              const filtered = technologies.filter(t =>
                !q || t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
              );
              return technologies.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center animate-fade-in">
                <Icon name="Cpu" size={48} className="text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-oswald text-muted-foreground">Технологии не добавлены</div>
                <button onClick={() => { setTechForm({ ...emptyTechForm }); setTechReqIds([]); setTechView('create'); }} className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl text-sm font-medium text-white">
                  <Icon name="Plus" size={16} />Добавить первую
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center animate-fade-in">
                <Icon name="SearchX" size={36} className="text-muted-foreground mx-auto mb-3" />
                <div className="text-sm font-oswald text-muted-foreground">Ничего не найдено</div>
                <button onClick={() => setTechSearch('')} className="mt-3 text-xs text-violet-400 hover:underline">Сбросить поиск</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((tech, i) => (
                  <div key={tech.id} onClick={() => openTechDetail(tech)}
                    className={`glass rounded-2xl p-6 cursor-pointer card-hover border border-white/8 animate-fade-in ${delayClass(i)}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-oswald text-xs text-muted-foreground tracking-widest">{tech.id}</span>
                        </div>
                        <h3 className="font-oswald text-xl font-semibold text-foreground">{tech.name}</h3>
                        <span className="text-xs text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full mt-1 inline-block">v{tech.version}</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <Icon name="Cpu" size={20} className="text-violet-400" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{tech.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Icon name="ListChecks" size={13} className="text-cyan-400" />
                        <span className="text-foreground font-medium">{tech.requirementIds.length}</span> требований
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="GitBranch" size={13} className="text-pink-400" />
                        <span className="text-foreground font-medium">{tech.schemes.length}</span> схем
                      </span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Icon name="Calendar" size={12} />{tech.updatedAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
            })()}
          </div>
        )}

        {/* DETAIL */}
        {techView === 'detail' && selectedTech && (
          <div className="animate-fade-in max-w-4xl">
            <div className="glass rounded-3xl p-8 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-oswald text-sm text-muted-foreground tracking-widest">{selectedTech.id}</span>
                  </div>
                  <h1 className="font-oswald text-3xl font-semibold text-foreground mb-2">{selectedTech.name}</h1>
                  <span className="text-sm text-violet-400 bg-violet-400/10 border border-violet-400/20 px-3 py-1 rounded-full">v{selectedTech.version}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openTechEdit(selectedTech)} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm hover:border-violet-500/40 transition-all">
                    <Icon name="Pencil" size={15} />Редактировать
                  </button>
                  <button onClick={() => deleteTech(selectedTech.id)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/20 transition-all">
                    <Icon name="Trash2" size={15} />Удалить
                  </button>
                </div>
              </div>
              <div className="border-t border-white/8 pt-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-3">Описание</h2>
                <p className="text-foreground leading-relaxed text-[15px]">{selectedTech.description}</p>
              </div>
            </div>

            {/* Mermaid schemes */}
            <div className="glass rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground">Mermaid-схемы</h2>
                <button
                  onClick={() => schemeInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/80 to-pink-500/80 rounded-xl text-sm font-medium text-white hover:from-violet-400 hover:to-pink-400 transition-all">
                  <Icon name="Upload" size={15} />Загрузить .mmd
                </button>
                <input ref={schemeInputRef} type="file" accept=".mmd,.txt" multiple className="hidden"
                  onChange={e => handleSchemeUpload(selectedTech.id, e.target.files)} />
              </div>

              {selectedTech.schemes.length === 0 ? (
                <div
                  onClick={() => schemeInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center cursor-pointer hover:border-violet-500/40 transition-all group">
                  <Icon name="FileCode" size={36} className="text-muted-foreground mx-auto mb-3 group-hover:text-violet-400 transition-colors" />
                  <p className="text-sm text-muted-foreground">Перетащите .mmd файлы или нажмите для загрузки</p>
                  <p className="text-xs text-muted-foreground mt-1">Поддерживаются форматы: .mmd, .txt</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTech.schemes.map(scheme => (
                    <div key={scheme.id} className="flex items-start gap-4 p-4 bg-white/4 rounded-xl border border-white/8">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <Icon name="FileCode" size={18} className="text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{scheme.name}</span>
                          <button onClick={() => deleteScheme(selectedTech.id, scheme.id)} className="text-muted-foreground hover:text-red-400 transition-colors ml-2">
                            <Icon name="X" size={15} />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Загружено {scheme.uploadedAt}</p>
                        <pre className="mt-2 text-xs text-muted-foreground bg-black/30 rounded-lg p-3 overflow-x-auto max-h-32 font-mono">{scheme.content.trim().slice(0, 300)}{scheme.content.length > 300 ? '…' : ''}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked requirements */}
            <LinkedRequirements
              requirementIds={selectedTech.requirementIds}
              requirements={requirements}
              onNavigateToReq={onNavigateToReq}
            />
          </div>
        )}

        {/* CREATE / EDIT */}
        {(techView === 'create' || techView === 'edit') && (
          <div className="animate-fade-in max-w-3xl">
            <div className="mb-6">
              <h1 className="font-oswald text-3xl font-semibold" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {techView === 'create' ? 'Новая технология' : 'Редактирование'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {techView === 'create' ? 'Добавьте ИТ-технологию и привяжите требования' : `Изменение ${selectedTech?.id}`}
              </p>
            </div>
            <div className="glass rounded-3xl p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Наименование *</label>
                  <input value={techForm.name} onChange={e => setTechForm(f => ({ ...f, name: e.target.value }))} placeholder="Название технологии"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Версия</label>
                  <input value={techForm.version} onChange={e => setTechForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0.0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Краткое описание</label>
                <textarea value={techForm.description} onChange={e => setTechForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  placeholder="Назначение технологии, основные возможности..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-violet-500/50 transition-all resize-none placeholder:text-muted-foreground/50" />
              </div>

              {/* Mermaid upload in form */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Mermaid-схемы</label>
                <div
                  onClick={() => document.getElementById('techFormSchemeInput')?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500/40 transition-all group">
                  <Icon name="Upload" size={28} className="text-muted-foreground mx-auto mb-2 group-hover:text-violet-400 transition-colors" />
                  <p className="text-sm text-muted-foreground">Загрузить .mmd файлы</p>
                  <p className="text-xs text-muted-foreground mt-1">Схемы можно добавить после создания карточки</p>
                </div>
                <input id="techFormSchemeInput" type="file" accept=".mmd,.txt" multiple className="hidden" onChange={() => {}} />
              </div>

              {/* Bind requirements */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">
                  Привязать требования <span className="text-cyan-400 normal-case ml-1">({techReqIds.length} выбрано)</span>
                </label>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {requirements.map(req => {
                    const selected = techReqIds.includes(req.id);
                    const prio = PRIORITY_CONFIG[req.priority];
                    return (
                      <button key={req.id} type="button" onClick={() => toggleTechReq(req.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                          selected ? 'bg-cyan-500/10 border-cyan-500/30' : 'glass border-white/8 hover:border-white/20'
                        }`}>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          selected ? 'bg-cyan-500 border-cyan-500' : 'border-white/20'
                        }`}>
                          {selected && <Icon name="Check" size={12} className="text-white" />}
                        </div>
                        <span className="text-xs font-oswald text-muted-foreground tracking-widest shrink-0">{req.id}</span>
                        <span className="text-sm text-foreground flex-1 truncate">{req.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${prio.color} shrink-0`}>{prio.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={techView === 'create' ? saveTechCreate : saveTechEdit}
                  disabled={!techForm.name.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl text-sm font-medium text-white hover:from-violet-400 hover:to-pink-400 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon name="Save" size={16} />
                  {techView === 'create' ? 'Создать технологию' : 'Сохранить изменения'}
                </button>
                <button onClick={() => setTechView('list')} className="px-6 py-3 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">Отмена</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

TechnologiesTab.displayName = 'TechnologiesTab';

export default TechnologiesTab;