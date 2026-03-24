import { useState, forwardRef, useImperativeHandle } from 'react';
import Icon from '@/components/ui/icon';
import {
  Requirement, Technology, Status, Priority, Category, ReqView,
  EnvType, AppStage, InteractionLevel, Applicability,
  PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG,
  emptyReqForm, delayClass,
} from '@/types';

const ALL_ENVS: EnvType[] = ['Prod', 'ProdLike', 'Stage', 'Test', 'Dev'];
const ALL_STAGES: AppStage[] = ['Стадия Дизайна', 'Стадия Деплоя', 'Стадия Рантайма'];
const ALL_INTERACTIONS: InteractionLevel[] = ['Обязательный', 'Рекомендуется', 'Не требуется'];
const ALL_APPLICABILITY: Applicability[] = ['Применимо', 'Не применимо'];

export interface RequirementsTabHandle {
  isOnSubpage: boolean;
  openCreate: () => void;
  goBack: () => void;
}

interface Props {
  requirements: Requirement[];
  setRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>;
  technologies: Technology[];
  onNavigateToTech: (tech: Technology) => void;
}

const RequirementsTab = forwardRef<RequirementsTabHandle, Props>(
  ({ requirements, setRequirements, technologies, onNavigateToTech }, ref) => {
    const [reqView, setReqView] = useState<ReqView>('list');
    const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
    const [reqForm, setReqForm] = useState({ ...emptyReqForm });
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
    const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
    const [filterEnv, setFilterEnv] = useState<EnvType | 'all'>('all');
    const [filterStage, setFilterStage] = useState<AppStage | 'all'>('all');
    const [filterInteraction, setFilterInteraction] = useState<InteractionLevel | 'all'>('all');
    const [filterProcurement, setFilterProcurement] = useState<Applicability | 'all'>('all');
    const [filterScoreCategory, setFilterScoreCategory] = useState<number | 'all'>('all');
    const [filterScoreWeight, setFilterScoreWeight] = useState<number | 'all'>('all');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [tagInput, setTagInput] = useState('');

    useImperativeHandle(ref, () => ({
      isOnSubpage: reqView !== 'list',
      openCreate: () => { setReqForm({ ...emptyReqForm, tags: [] }); setTagInput(''); setReqView('create'); },
      goBack: () => setReqView('list'),
    }), [reqView]);

    const hasActiveFilters = search || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' ||
      filterEnv !== 'all' || filterStage !== 'all' || filterInteraction !== 'all' ||
      filterProcurement !== 'all' || filterScoreCategory !== 'all' || filterScoreWeight !== 'all';

    const filteredReqs = requirements.filter(r => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase());
      return matchSearch &&
        (filterStatus === 'all' || r.status === filterStatus) &&
        (filterPriority === 'all' || r.priority === filterPriority) &&
        (filterCategory === 'all' || r.category === filterCategory) &&
        (filterEnv === 'all' || r.environments.includes(filterEnv)) &&
        (filterStage === 'all' || r.appStages.includes(filterStage)) &&
        (filterInteraction === 'all' || r.externalWithIod === filterInteraction || r.externalWithoutIod === filterInteraction || r.internalWithIod === filterInteraction || r.internalWithoutIod === filterInteraction) &&
        (filterProcurement === 'all' || r.procurement === filterProcurement) &&
        (filterScoreCategory === 'all' || r.scoringCategory === filterScoreCategory) &&
        (filterScoreWeight === 'all' || r.scoringWeight === filterScoreWeight);
    });

    function resetAllFilters() {
      setSearch(''); setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all');
      setFilterEnv('all'); setFilterStage('all'); setFilterInteraction('all');
      setFilterProcurement('all'); setFilterScoreCategory('all'); setFilterScoreWeight('all');
    }

    const stats = {
      total: requirements.length,
      approved: requirements.filter(r => r.status === 'approved').length,
      review: requirements.filter(r => r.status === 'review').length,
      critical: requirements.filter(r => r.priority === 'critical').length,
    };

    function openReqDetail(req: Requirement) { setSelectedReq(req); setReqView('detail'); }
    function openReqEdit(req: Requirement) {
      setReqForm({ title: req.title, description: req.description, category: req.category, priority: req.priority, status: req.status, tags: [...req.tags], author: req.author, version: req.version, environments: [...req.environments], appStages: [...req.appStages], externalWithIod: req.externalWithIod, externalWithoutIod: req.externalWithoutIod, internalWithIod: req.internalWithIod, internalWithoutIod: req.internalWithoutIod, procurement: req.procurement, scoringCategory: req.scoringCategory, scoringWeight: req.scoringWeight });
      setSelectedReq(req); setTagInput(''); setReqView('edit');
    }
    function saveReqCreate() {
      const now = new Date().toISOString().split('T')[0];
      setRequirements(prev => [{ ...reqForm, id: `REQ-${String(prev.length + 1).padStart(3, '0')}`, createdAt: now, updatedAt: now }, ...prev]);
      setReqView('list');
    }
    function saveReqEdit() {
      if (!selectedReq) return;
      const now = new Date().toISOString().split('T')[0];
      setRequirements(prev => prev.map(r => r.id === selectedReq.id ? { ...r, ...reqForm, updatedAt: now } : r));
      setReqView('list');
    }
    function deleteReq(id: string) { setRequirements(prev => prev.filter(r => r.id !== id)); setReqView('list'); }
    function addTag() {
      const tag = tagInput.trim();
      if (tag && !reqForm.tags.includes(tag)) setReqForm(f => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput('');
    }
    function removeTag(tag: string) { setReqForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) })); }

    return (
      <>
        {/* LIST */}
        {reqView === 'list' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Всего требований', value: stats.total, icon: 'ListChecks', colorFrom: 'from-cyan-500/20', colorTo: 'to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400' },
                { label: 'Утверждено', value: stats.approved, icon: 'CheckCircle', colorFrom: 'from-green-500/20', colorTo: 'to-green-500/5', border: 'border-green-500/20', text: 'text-green-400' },
                { label: 'На ревью', value: stats.review, icon: 'Eye', colorFrom: 'from-blue-500/20', colorTo: 'to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400' },
                { label: 'Критических', value: stats.critical, icon: 'AlertTriangle', colorFrom: 'from-red-500/20', colorTo: 'to-red-500/5', border: 'border-red-500/20', text: 'text-red-400' },
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

            <div className="glass rounded-2xl p-5 mb-6 space-y-3">
              {/* Основные фильтры */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по ID, названию, описанию..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as Status | 'all')}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                  <option value="all">Все статусы</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                  <option value="all">Все приоритеты</option>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as Category | 'all')}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                  <option value="all">Все категории</option>
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={() => setShowAdvanced(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm glass rounded-xl transition-all ${showAdvanced ? 'text-cyan-400 border-cyan-500/30' : 'text-muted-foreground hover:text-foreground'}`}>
                  <Icon name="SlidersHorizontal" size={14} />Доп. фильтры
                  {(filterEnv !== 'all' || filterStage !== 'all' || filterInteraction !== 'all' || filterProcurement !== 'all' || filterScoreCategory !== 'all' || filterScoreWeight !== 'all') && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 ml-0.5" />
                  )}
                </button>
                {hasActiveFilters && (
                  <button onClick={resetAllFilters}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground glass rounded-xl transition-all">
                    <Icon name="X" size={14} />Сбросить
                  </button>
                )}
              </div>

              {/* Расширенные фильтры */}
              {showAdvanced && (
                <div className="border-t border-white/8 pt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <select value={filterEnv} onChange={e => setFilterEnv(e.target.value as EnvType | 'all')}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                    <option value="all">Среда: все</option>
                    {ALL_ENVS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <select value={filterStage} onChange={e => setFilterStage(e.target.value as AppStage | 'all')}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                    <option value="all">Стадия: все</option>
                    {ALL_STAGES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <select value={filterInteraction} onChange={e => setFilterInteraction(e.target.value as InteractionLevel | 'all')}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                    <option value="all">Взаимодействие: все</option>
                    {ALL_INTERACTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <select value={filterProcurement} onChange={e => setFilterProcurement(e.target.value as Applicability | 'all')}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                    <option value="all">Закупки: все</option>
                    {ALL_APPLICABILITY.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <select value={filterScoreCategory} onChange={e => setFilterScoreCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                    <option value="all">Категория: все</option>
                    {[1,2,3,4].map(n => <option key={n} value={n}>Категория {n}</option>)}
                  </select>
                  <select value={filterScoreWeight} onChange={e => setFilterScoreWeight(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                    <option value="all">Вес: все</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Вес {n}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center mb-4">
              <span className="text-sm text-muted-foreground">Найдено: <span className="text-foreground font-medium">{filteredReqs.length}</span> требований</span>
            </div>

            {filteredReqs.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center animate-fade-in">
                <Icon name="SearchX" size={48} className="text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-oswald text-muted-foreground">Требования не найдены</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReqs.map((req, i) => {
                  const prio = PRIORITY_CONFIG[req.priority];
                  const stat = STATUS_CONFIG[req.status];
                  const cat = CATEGORY_CONFIG[req.category];
                  const linkedTech = technologies.filter(t => t.requirementIds.includes(req.id));
                  return (
                    <div key={req.id} onClick={() => openReqDetail(req)}
                      className={`glass rounded-2xl p-5 cursor-pointer card-hover border border-white/8 animate-fade-in ${delayClass(i)}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-oswald text-xs text-muted-foreground tracking-widest">{req.id}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${prio.color}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${prio.dot} mr-1.5`}></span>{prio.label}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${stat.color}`}>{stat.label}</span>
                            <span className={`text-xs flex items-center gap-1 ${cat.color}`}>
                              <Icon name={cat.icon} size={12} />{cat.label}
                            </span>
                            {linkedTech.length > 0 && (
                              <span className="text-xs flex items-center gap-1 text-violet-400">
                                <Icon name="Cpu" size={12} />{linkedTech.map(t => t.name).join(', ')}
                              </span>
                            )}
                          </div>
                          <h3 className="font-oswald text-lg font-medium text-foreground mb-1.5 leading-tight">{req.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{req.description}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <div className="flex flex-wrap gap-1.5">
                              {req.tags.slice(0, 4).map(tag => (
                                <span key={tag} className="text-xs px-2 py-0.5 glass rounded-md text-muted-foreground">#{tag}</span>
                              ))}
                              {req.tags.length > 4 && <span className="text-xs px-2 py-0.5 glass rounded-md text-muted-foreground">+{req.tags.length - 4}</span>}
                            </div>
                            <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5 text-cyan-400/80">
                                <Icon name="Star" size={11} />К:{req.scoringCategory}
                              </span>
                              <span className="flex items-center gap-1.5 text-violet-400/80">
                                <Icon name="Weight" size={11} />В:{req.scoringWeight}
                              </span>
                              <span className="flex items-center gap-1"><Icon name="User" size={12} />{req.author}</span>
                              <span className="flex items-center gap-1"><Icon name="Calendar" size={12} />{req.updatedAt}</span>
                            </div>
                          </div>
                        </div>
                        <Icon name="ChevronRight" size={20} className="text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DETAIL */}
        {reqView === 'detail' && selectedReq && (
          <div className="animate-fade-in max-w-4xl">
            <div className="glass rounded-3xl p-8 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-oswald text-sm text-muted-foreground tracking-widest">{selectedReq.id}</span>
                    <span className="text-xs text-muted-foreground">• v{selectedReq.version}</span>
                  </div>
                  <h1 className="font-oswald text-3xl font-semibold text-foreground leading-tight mb-4">{selectedReq.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-sm px-3 py-1 rounded-full border font-medium ${PRIORITY_CONFIG[selectedReq.priority].color}`}>
                      <span className={`inline-block w-2 h-2 rounded-full ${PRIORITY_CONFIG[selectedReq.priority].dot} mr-2`}></span>
                      {PRIORITY_CONFIG[selectedReq.priority].label}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full border font-medium ${STATUS_CONFIG[selectedReq.status].color}`}>
                      {STATUS_CONFIG[selectedReq.status].label}
                    </span>
                    <span className={`text-sm flex items-center gap-1.5 px-3 py-1 glass rounded-full ${CATEGORY_CONFIG[selectedReq.category].color}`}>
                      <Icon name={CATEGORY_CONFIG[selectedReq.category].icon} size={14} />
                      {CATEGORY_CONFIG[selectedReq.category].label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openReqEdit(selectedReq)} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm hover:border-cyan-500/40 transition-all">
                    <Icon name="Pencil" size={15} />Редактировать
                  </button>
                  <button onClick={() => deleteReq(selectedReq.id)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/20 transition-all">
                    <Icon name="Trash2" size={15} />Удалить
                  </button>
                </div>
              </div>
              <div className="border-t border-white/8 pt-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-3">Описание</h2>
                <p className="text-foreground leading-relaxed text-[15px]">{selectedReq.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Теги</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedReq.tags.length === 0 && <span className="text-sm text-muted-foreground">Теги не указаны</span>}
                  {selectedReq.tags.map(tag => (
                    <span key={tag} className="text-sm px-3 py-1.5 glass rounded-lg text-muted-foreground border border-white/10">#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Информация</h2>
                <div className="space-y-3">
                  {[
                    { icon: 'User', label: 'Автор', value: selectedReq.author || '—' },
                    { icon: 'Calendar', label: 'Создано', value: selectedReq.createdAt },
                    { icon: 'RefreshCw', label: 'Обновлено', value: selectedReq.updatedAt },
                    { icon: 'Tag', label: 'Версия', value: `v${selectedReq.version}` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name={item.icon} size={14} />{item.label}
                      </span>
                      <span className="text-sm text-foreground font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Среда и стадия применения */}
              <div className="glass rounded-2xl p-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Среда применения</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedReq.environments.length === 0
                    ? <span className="text-sm text-muted-foreground">Не указана</span>
                    : selectedReq.environments.map(env => (
                      <span key={env} className="text-xs px-2.5 py-1 glass rounded-lg border border-cyan-500/20 text-cyan-400">{env}</span>
                    ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Стадия применения</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedReq.appStages.length === 0
                    ? <span className="text-sm text-muted-foreground">Не указана</span>
                    : selectedReq.appStages.map(stage => (
                      <span key={stage} className="text-xs px-2.5 py-1 glass rounded-lg border border-violet-500/20 text-violet-400">{stage}</span>
                    ))}
                </div>
              </div>

              {/* Взаимодействие */}
              <div className="glass rounded-2xl p-6 md:col-span-2">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Взаимодействие</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Внешнее с ИОД', value: selectedReq.externalWithIod },
                    { label: 'Внешнее без ИОД', value: selectedReq.externalWithoutIod },
                    { label: 'Внутреннее с ИОД', value: selectedReq.internalWithIod },
                    { label: 'Внутреннее без ИОД', value: selectedReq.internalWithoutIod },
                  ].map(item => (
                    <div key={item.label}>
                      <span className="block text-xs text-muted-foreground/70 mb-1.5">{item.label}</span>
                      <span className={`text-sm font-medium ${
                        item.value === 'Обязательный' ? 'text-red-400' :
                        item.value === 'Рекомендуется' ? 'text-yellow-400' : 'text-muted-foreground'
                      }`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Закупки и скорринг */}
              <div className="glass rounded-2xl p-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Закупки</h2>
                <span className={`text-sm font-medium ${selectedReq.procurement === 'Применимо' ? 'text-cyan-400' : 'text-muted-foreground'}`}>
                  {selectedReq.procurement}
                </span>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Скорринг баллы</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Оценка Категории</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(n => (
                          <div key={n} className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${n <= selectedReq.scoringCategory ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/40' : 'bg-white/5 text-muted-foreground/30 border border-white/10'}`}>{n}</div>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-cyan-400">{selectedReq.scoringCategory}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Оценка Веса</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <div key={n} className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold ${n <= selectedReq.scoringWeight ? 'bg-violet-500/30 text-violet-400 border border-violet-500/40' : 'bg-white/5 text-muted-foreground/30 border border-white/10'}`}>{n}</div>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-violet-400">{selectedReq.scoringWeight}</span>
                    </div>
                  </div>
                </div>
              </div>

              {(() => {
                const linked = technologies.filter(t => t.requirementIds.includes(selectedReq.id));
                return linked.length > 0 ? (
                  <div className="glass rounded-2xl p-6 md:col-span-2">
                    <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Привязанные технологии</h2>
                    <div className="flex flex-wrap gap-2">
                      {linked.map(t => (
                        <button key={t.id} onClick={() => onNavigateToTech(t)}
                          className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-sm text-violet-400 border border-violet-400/20 hover:border-violet-400/40 transition-all">
                          <Icon name="Cpu" size={14} />{t.name} <span className="text-muted-foreground text-xs">v{t.version}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* CREATE / EDIT */}
        {(reqView === 'create' || reqView === 'edit') && (
          <div className="animate-fade-in max-w-3xl">
            <div className="mb-6">
              <h1 className="font-oswald text-3xl font-semibold gradient-text">
                {reqView === 'create' ? 'Новое требование' : 'Редактирование'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {reqView === 'create' ? 'Заполните поля для создания нового требования' : `Изменение ${selectedReq?.id}`}
              </p>
            </div>
            <div className="glass rounded-3xl p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Название *</label>
                <input value={reqForm.title} onChange={e => setReqForm(f => ({ ...f, title: e.target.value }))} placeholder="Краткое название требования"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-muted-foreground/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Описание *</label>
                <textarea value={reqForm.description} onChange={e => setReqForm(f => ({ ...f, description: e.target.value }))} rows={5}
                  placeholder="Подробное описание, критерии приёмки, ограничения..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all resize-none placeholder:text-muted-foreground/50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Категория', key: 'category', opts: CATEGORY_CONFIG, setter: (v: string) => setReqForm(f => ({ ...f, category: v as Category })) },
                  { label: 'Приоритет', key: 'priority', opts: PRIORITY_CONFIG, setter: (v: string) => setReqForm(f => ({ ...f, priority: v as Priority })) },
                  { label: 'Статус', key: 'status', opts: STATUS_CONFIG, setter: (v: string) => setReqForm(f => ({ ...f, status: v as Status })) },
                ].map(({ label, key, opts, setter }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">{label}</label>
                    <select value={reqForm[key as keyof typeof reqForm] as string} onChange={e => setter(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                      {Object.entries(opts).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Автор</label>
                  <input value={reqForm.author} onChange={e => setReqForm(f => ({ ...f, author: e.target.value }))} placeholder="Имя автора"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Версия</label>
                  <input value={reqForm.version} onChange={e => setReqForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Теги</label>
                <div className="flex gap-2 mb-3">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Введите тег и нажмите Enter"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-muted-foreground/50" />
                  <button type="button" onClick={addTag} className="px-4 py-3 glass rounded-xl hover:border-cyan-500/40 transition-all text-foreground">
                    <Icon name="Plus" size={18} />
                  </button>
                </div>
                {reqForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reqForm.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 text-sm px-3 py-1.5 glass rounded-lg text-muted-foreground border border-white/10">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors"><Icon name="X" size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Среда и стадия применения */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">Среда применения</label>
                  <div className="space-y-2">
                    {(['Prod', 'ProdLike', 'Stage', 'Test', 'Dev'] as EnvType[]).map(env => (
                      <label key={env} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={reqForm.environments.includes(env)}
                          onChange={e => setReqForm(f => ({ ...f, environments: e.target.checked ? [...f.environments, env] : f.environments.filter(x => x !== env) }))}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 accent-cyan-500 cursor-pointer" />
                        <span className="text-sm text-foreground group-hover:text-cyan-400 transition-colors">{env}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">Стадия применения</label>
                  <div className="space-y-2">
                    {(['Стадия Дизайна', 'Стадия Деплоя', 'Стадия Рантайма'] as AppStage[]).map(stage => (
                      <label key={stage} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={reqForm.appStages.includes(stage)}
                          onChange={e => setReqForm(f => ({ ...f, appStages: e.target.checked ? [...f.appStages, stage] : f.appStages.filter(x => x !== stage) }))}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 accent-cyan-500 cursor-pointer" />
                        <span className="text-sm text-foreground group-hover:text-cyan-400 transition-colors">{stage}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Внешнее и внутреннее взаимодействие */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Внешнее взаимодействие', withIodKey: 'externalWithIod', withoutIodKey: 'externalWithoutIod' },
                  { label: 'Внутреннее взаимодействие', withIodKey: 'internalWithIod', withoutIodKey: 'internalWithoutIod' },
                ].map(({ label, withIodKey, withoutIodKey }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">{label}</label>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground/70 mb-1.5 block">с ИОД</span>
                        <select value={reqForm[withIodKey as keyof typeof reqForm] as string}
                          onChange={e => setReqForm(f => ({ ...f, [withIodKey]: e.target.value as InteractionLevel }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-cyan-500/50 cursor-pointer text-sm">
                          {(['Обязательный', 'Рекомендуется', 'Не требуется'] as InteractionLevel[]).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground/70 mb-1.5 block">Без ИОД</span>
                        <select value={reqForm[withoutIodKey as keyof typeof reqForm] as string}
                          onChange={e => setReqForm(f => ({ ...f, [withoutIodKey]: e.target.value as InteractionLevel }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-cyan-500/50 cursor-pointer text-sm">
                          {(['Обязательный', 'Рекомендуется', 'Не требуется'] as InteractionLevel[]).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Закупки и Скорринг */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">Закупки</label>
                  <select value={reqForm.procurement} onChange={e => setReqForm(f => ({ ...f, procurement: e.target.value as Applicability }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 cursor-pointer">
                    {(['Применимо', 'Не применимо'] as Applicability[]).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">Скорринг баллы</label>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground/70 mb-1.5 block">Оценка Категории (1–4): <span className="text-cyan-400 font-medium">{reqForm.scoringCategory}</span></span>
                      <input type="range" min={1} max={4} value={reqForm.scoringCategory}
                        onChange={e => setReqForm(f => ({ ...f, scoringCategory: Number(e.target.value) }))}
                        className="w-full accent-cyan-500 cursor-pointer" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground/70 mb-1.5 block">Оценка Веса (1–10): <span className="text-violet-400 font-medium">{reqForm.scoringWeight}</span></span>
                      <input type="range" min={1} max={10} value={reqForm.scoringWeight}
                        onChange={e => setReqForm(f => ({ ...f, scoringWeight: Number(e.target.value) }))}
                        className="w-full accent-violet-500 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={reqView === 'create' ? saveReqCreate : saveReqEdit}
                  disabled={!reqForm.title.trim() || !reqForm.description.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon name="Save" size={16} />
                  {reqView === 'create' ? 'Создать требование' : 'Сохранить изменения'}
                </button>
                <button onClick={() => setReqView('list')} className="px-6 py-3 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">Отмена</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

RequirementsTab.displayName = 'RequirementsTab';

export default RequirementsTab;