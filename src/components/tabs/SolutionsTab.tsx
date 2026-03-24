import { useState, forwardRef, useImperativeHandle } from 'react';
import Icon from '@/components/ui/icon';
import {
  TechnicalSolution, Technology, Requirement,
  SolutionView, SolutionStatus,
  SOLUTION_STATUS_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG,
  emptySolutionForm, delayClass,
} from '@/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${className ?? ''}`}>
      {children}
    </span>
  );
}

const SOLUTION_STATUSES: SolutionStatus[] = ['draft', 'review', 'approved', 'rejected', 'archived'];

// ─── LinkedTechnologiesTable ──────────────────────────────────────────────────

interface LTProps {
  technologyIds: string[];
  technologies: Technology[];
  requirements: Requirement[];
  onNavigateToTech: (tech: Technology) => void;
}

function LinkedTechnologiesTable({ technologyIds, technologies, requirements, onNavigateToTech }: LTProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows: Array<{ req: Requirement; tech: Technology }> = [];
  technologyIds.forEach(tid => {
    const tech = technologies.find(t => t.id === tid);
    if (!tech) return;
    tech.requirementIds.forEach(rid => {
      const req = requirements.find(r => r.id === rid);
      if (req) rows.push({ req, tech });
    });
  });

  return (
    <div className="space-y-6">
      {/* Список технологий */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">
          Список используемых технологий <span className="text-violet-400">({technologyIds.length})</span>
        </h2>
        {technologyIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Технологии не привязаны</p>
        ) : (
          <div className="space-y-2">
            {technologyIds.map(tid => {
              const tech = technologies.find(t => t.id === tid);
              if (!tech) return null;
              const isOpen = expandedId === tid;
              return (
                <div key={tid} className="glass rounded-xl border border-white/5 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Icon name="Cpu" size={14} className="text-violet-400" />
                    </div>
                    <span className="text-xs font-oswald text-muted-foreground tracking-widest shrink-0 w-20">{tech.id}</span>
                    <span className="text-sm text-foreground flex-1 font-medium">{tech.name}</span>
                    <Badge className="text-violet-400 border-violet-400/20 bg-violet-400/5 shrink-0">v{tech.version}</Badge>
                    <button
                      onClick={() => setExpandedId(isOpen ? null : tid)}
                      className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                      title={isOpen ? 'Свернуть' : 'Подробнее'}
                    >
                      <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={14} />
                    </button>
                    <button
                      onClick={() => onNavigateToTech(tech)}
                      className="p-1 rounded-lg hover:bg-violet-500/10 text-muted-foreground hover:text-violet-400 transition-all"
                      title="Открыть технологию"
                    >
                      <Icon name="ExternalLink" size={14} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="border-t border-white/5 px-4 py-3 bg-white/[0.02]">
                      <p className="text-sm text-foreground/70 leading-relaxed mb-2">{tech.description || '—'}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Требований: <span className="text-foreground font-medium">{tech.requirementIds.length}</span></span>
                        <span className="text-xs text-muted-foreground">Схем: <span className="text-foreground font-medium">{tech.schemes.length}</span></span>
                        <span className="text-xs text-muted-foreground">Обновлено: <span className="text-foreground font-medium">{tech.updatedAt}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Перечень требований к используемым технологиям */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">
          Перечень требований к используемым технологиям <span className="text-cyan-400">({rows.length})</span>
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Требования отсутствуют</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-xs font-oswald uppercase tracking-wider text-muted-foreground">Нумерация</th>
                  <th className="text-left py-2 px-3 text-xs font-oswald uppercase tracking-wider text-muted-foreground">Технология</th>
                  <th className="text-left py-2 px-3 text-xs font-oswald uppercase tracking-wider text-muted-foreground">Категория</th>
                  <th className="text-left py-2 px-3 text-xs font-oswald uppercase tracking-wider text-muted-foreground">Название требования</th>
                  <th className="text-left py-2 px-3 text-xs font-oswald uppercase tracking-wider text-muted-foreground">Описание</th>
                  <th className="text-left py-2 px-3 text-xs font-oswald uppercase tracking-wider text-muted-foreground">Приоритет</th>
                  <th className="text-left py-2 px-3 text-xs font-oswald uppercase tracking-wider text-muted-foreground">Статус</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ req, tech }, i) => {
                  const prio = PRIORITY_CONFIG[req.priority];
                  const status = STATUS_CONFIG[req.status];
                  const cat = CATEGORY_CONFIG[req.category];
                  return (
                    <tr key={`${tech.id}-${req.id}-${i}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 font-oswald text-xs text-muted-foreground tracking-widest">{req.id}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full">{tech.name}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs flex items-center gap-1 ${cat.color}`}>
                          <Icon name={cat.icon as string} size={11} />{cat.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-foreground font-medium max-w-[200px]">
                        <span className="truncate block">{req.title}</span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-[240px]">
                        <span className="line-clamp-2 text-xs">{req.description || '—'}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge className={prio.color}>{prio.label}</Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge className={status.color}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SolutionsTab ─────────────────────────────────────────────────────────────

export interface SolutionsTabHandle {
  isOnSubpage: boolean;
  openCreate: () => void;
  goBack: () => void;
  openDetail: (sol: TechnicalSolution) => void;
}

interface Props {
  solutions: TechnicalSolution[];
  setSolutions: React.Dispatch<React.SetStateAction<TechnicalSolution[]>>;
  technologies: Technology[];
  requirements: Requirement[];
  onNavigateToTech: (tech: Technology) => void;
}

const SolutionsTab = forwardRef<SolutionsTabHandle, Props>(
  ({ solutions, setSolutions, technologies, requirements, onNavigateToTech }, ref) => {
    const [view, setView] = useState<SolutionView>('list');
    const [selected, setSelected] = useState<TechnicalSolution | null>(null);
    const [form, setForm] = useState({ ...emptySolutionForm });
    const [tagInput, setTagInput] = useState('');

    useImperativeHandle(ref, () => ({
      isOnSubpage: view !== 'list',
      openCreate: () => { setForm({ ...emptySolutionForm }); setTagInput(''); setView('create'); },
      goBack: () => setView('list'),
      openDetail: (sol: TechnicalSolution) => { setSelected(sol); setView('detail'); },
    }), [view]);

    function openDetail(sol: TechnicalSolution) { setSelected(sol); setView('detail'); }
    function openEdit(sol: TechnicalSolution) {
      setForm({ name: sol.name, version: sol.version, owner: sol.owner, author: sol.author, status: sol.status, description: sol.description, tags: [...sol.tags], technologyIds: [...sol.technologyIds] });
      setSelected(sol); setView('edit');
    }
    function saveCreate() {
      const now = new Date().toISOString().split('T')[0];
      setSolutions(prev => [{
        ...form,
        id: `SOL-${String(prev.length + 1).padStart(3, '0')}`,
        createdAt: now, updatedAt: now,
      }, ...prev]);
      setView('list');
    }
    function saveEdit() {
      if (!selected) return;
      const now = new Date().toISOString().split('T')[0];
      setSolutions(prev => prev.map(s => s.id === selected.id ? { ...s, ...form, updatedAt: now } : s));
      setView('list');
    }
    function deleteSolution(id: string) {
      setSolutions(prev => prev.filter(s => s.id !== id));
      setView('list');
    }
    function toggleTech(techId: string) {
      setForm(f => ({ ...f, technologyIds: f.technologyIds.includes(techId) ? f.technologyIds.filter(id => id !== techId) : [...f.technologyIds, techId] }));
    }
    function addTag(raw: string) {
      const tag = raw.trim();
      if (tag && !form.tags.includes(tag)) setForm(f => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput('');
    }
    function removeTag(tag: string) { setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) })); }

    const statusCfg = (s: SolutionStatus) => SOLUTION_STATUS_CONFIG[s];

    return (
      <>
        {/* LIST */}
        {view === 'list' && (
          <div className="animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Технических решений', value: solutions.length, icon: 'LayoutGrid', colorFrom: 'from-emerald-500/20', colorTo: 'to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
                { label: 'Утверждено', value: solutions.filter(s => s.status === 'approved').length, icon: 'CheckCircle', colorFrom: 'from-green-500/20', colorTo: 'to-green-500/5', border: 'border-green-500/20', text: 'text-green-400' },
                { label: 'Привязок технологий', value: solutions.reduce((acc, s) => acc + s.technologyIds.length, 0), icon: 'Cpu', colorFrom: 'from-violet-500/20', colorTo: 'to-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400' },
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

            {solutions.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center animate-fade-in">
                <Icon name="LayoutGrid" size={48} className="text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-oswald text-muted-foreground">Технические решения не добавлены</div>
                <button onClick={() => { setForm({ ...emptySolutionForm }); setTagInput(''); setView('create'); }}
                  className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-sm font-medium text-white">
                  <Icon name="Plus" size={16} />Добавить первое
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solutions.map((sol, i) => {
                  const sc = statusCfg(sol.status);
                  return (
                    <div key={sol.id} onClick={() => openDetail(sol)}
                      className={`glass rounded-2xl p-6 cursor-pointer card-hover border border-white/8 animate-fade-in ${delayClass(i)}`}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-oswald text-xs text-muted-foreground tracking-widest">{sol.id}</span>
                            <Badge className={sc.color}>{sc.label}</Badge>
                          </div>
                          <h3 className="font-oswald text-xl font-semibold text-foreground truncate">{sol.name}</h3>
                          <span className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full mt-1 inline-block">v{sol.version}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Icon name="LayoutGrid" size={20} className="text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{sol.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {sol.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">{tag}</span>
                        ))}
                        {sol.tags.length > 4 && <span className="text-xs text-muted-foreground">+{sol.tags.length - 4}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Icon name="Cpu" size={13} className="text-violet-400" />
                          <span className="text-foreground font-medium">{sol.technologyIds.length}</span> технологий
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Icon name="User" size={12} />
                          {sol.owner}
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          <Icon name="Calendar" size={12} />{sol.updatedAt}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DETAIL */}
        {view === 'detail' && selected && (() => {
          const sc = statusCfg(selected.status);
          return (
            <div className="animate-fade-in max-w-4xl">
              {/* Header card */}
              <div className="glass rounded-3xl p-8 mb-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-oswald text-sm text-muted-foreground tracking-widest">{selected.id}</span>
                      <Badge className={sc.color}>{sc.label}</Badge>
                    </div>
                    <h1 className="font-oswald text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {selected.name}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(selected)}
                      className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">
                      <Icon name="Edit2" size={15} />Редактировать
                    </button>
                    <button onClick={() => deleteSolution(selected.id)}
                      className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-red-400 hover:text-red-300 border border-red-500/0 hover:border-red-500/20 transition-all">
                      <Icon name="Trash2" size={15} />Удалить
                    </button>
                  </div>
                </div>

                {/* ID + meta */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">ID Технологии</p>
                    <p className="text-sm font-mono text-emerald-400 font-medium">{selected.id}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">Версия</p>
                    <p className="text-sm text-foreground font-mono">v{selected.version}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">Владелец</p>
                    <p className="text-sm text-foreground">{selected.owner || '—'}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-1">Автор</p>
                    <p className="text-sm text-foreground">{selected.author || '—'}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-2">Описание технического решения</p>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-foreground/80 leading-relaxed">{selected.description || '—'}</p>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <p className="text-xs text-muted-foreground font-oswald uppercase tracking-wider mb-2">Используемые теги</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.tags.length > 0
                      ? selected.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
                            <Icon name="Tag" size={10} />{tag}
                          </span>
                        ))
                      : <span className="text-sm text-muted-foreground">Теги не добавлены</span>}
                  </div>
                </div>
              </div>

              {/* Technologies + Requirements table */}
              <LinkedTechnologiesTable
                technologyIds={selected.technologyIds}
                technologies={technologies}
                requirements={requirements}
                onNavigateToTech={onNavigateToTech}
              />
            </div>
          );
        })()}

        {/* CREATE / EDIT */}
        {(view === 'create' || view === 'edit') && (
          <div className="animate-fade-in max-w-3xl">
            <div className="mb-6">
              <h1 className="font-oswald text-3xl font-semibold" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {view === 'create' ? 'Новое техническое решение' : 'Редактирование решения'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {view === 'create' ? 'Опишите решение и привяжите технологии' : `Изменение ${selected?.id}`}
              </p>
            </div>
            <div className="glass rounded-3xl p-8 space-y-6">
              {/* Row 1: name + version */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Название *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название технического решения"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Версия</label>
                  <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0.0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
              </div>

              {/* Row 2: owner + author + status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Владелец</label>
                  <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="ФИО или команда"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Автор</label>
                  <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="ФИО автора"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Статус</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SolutionStatus }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all">
                    {SOLUTION_STATUSES.map(s => (
                      <option key={s} value={s} className="bg-background">{SOLUTION_STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Описание</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
                  placeholder="Назначение решения, область применения, ключевые характеристики..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all resize-none placeholder:text-muted-foreground/50" />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Теги</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400 transition-colors">
                        <Icon name="X" size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                    placeholder="Введите тег и нажмите Enter или +"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-muted-foreground/50" />
                  <button type="button" onClick={() => addTag(tagInput)}
                    className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 hover:bg-emerald-500/30 transition-all">
                    <Icon name="Plus" size={16} />
                  </button>
                </div>
              </div>

              {/* Bind technologies */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">
                  Привязать технологии <span className="text-violet-400 normal-case ml-1">({form.technologyIds.length} выбрано)</span>
                </label>
                {technologies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет доступных технологий</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {technologies.map(tech => {
                      const selected = form.technologyIds.includes(tech.id);
                      return (
                        <button key={tech.id} type="button" onClick={() => toggleTech(tech.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                            selected ? 'bg-violet-500/10 border-violet-500/30' : 'glass border-white/8 hover:border-white/20'
                          }`}>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            selected ? 'bg-violet-500 border-violet-500' : 'border-white/20'
                          }`}>
                            {selected && <Icon name="Check" size={12} className="text-white" />}
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                            <Icon name="Cpu" size={13} className="text-violet-400" />
                          </div>
                          <span className="text-xs font-oswald text-muted-foreground tracking-widest shrink-0">{tech.id}</span>
                          <span className="text-sm text-foreground flex-1 truncate">{tech.name}</span>
                          <Badge className="text-violet-400 border-violet-400/20 bg-violet-400/5 shrink-0">v{tech.version}</Badge>
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
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-sm font-medium text-white hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon name="Save" size={16} />
                  {view === 'create' ? 'Создать решение' : 'Сохранить изменения'}
                </button>
                <button onClick={() => setView('list')} className="px-6 py-3 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">Отмена</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

SolutionsTab.displayName = 'SolutionsTab';

export default SolutionsTab;
