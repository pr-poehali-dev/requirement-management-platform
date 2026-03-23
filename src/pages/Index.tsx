import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'critical' | 'high' | 'medium' | 'low';
type Status = 'draft' | 'review' | 'approved' | 'rejected';
type Category = 'functional' | 'non-functional' | 'security' | 'performance' | 'integration' | 'ui-ux';

interface MermaidScheme {
  id: string;
  name: string;
  content: string;
  uploadedAt: string;
}

interface Technology {
  id: string;
  name: string;
  description: string;
  version: string;
  schemes: MermaidScheme[];
  requirementIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  version: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REQUIREMENTS: Requirement[] = [
  {
    id: 'REQ-001', title: 'Аутентификация через SSO',
    description: 'Система должна поддерживать единый вход (SSO) через корпоративный LDAP и OAuth 2.0. Время сессии — 8 часов с автоматическим продлением при активности.',
    category: 'security', priority: 'critical', status: 'approved',
    tags: ['auth', 'SSO', 'LDAP', 'OAuth'], author: 'Алексей Петров', createdAt: '2024-01-15', updatedAt: '2024-02-10', version: '2.1',
  },
  {
    id: 'REQ-002', title: 'API Gateway с rate limiting',
    description: 'Все внешние API-запросы проходят через единый шлюз. Rate limit: 1000 запросов/минуту на клиента.',
    category: 'performance', priority: 'high', status: 'review',
    tags: ['API', 'gateway', 'rate-limit'], author: 'Мария Иванова', createdAt: '2024-01-20', updatedAt: '2024-02-15', version: '1.3',
  },
  {
    id: 'REQ-003', title: 'Интеграция с 1С ERP',
    description: 'Двусторонняя синхронизация данных с 1С:Предприятие 8.3. Обмен через REST API 1С, формат JSON.',
    category: 'integration', priority: 'high', status: 'draft',
    tags: ['1С', 'ERP', 'sync', 'REST'], author: 'Дмитрий Сидоров', createdAt: '2024-02-01', updatedAt: '2024-02-20', version: '1.0',
  },
  {
    id: 'REQ-004', title: 'Время загрузки страниц < 2с',
    description: 'Все страницы приложения должны загружаться менее чем за 2 секунды при подключении 10 Мбит/с.',
    category: 'performance', priority: 'critical', status: 'approved',
    tags: ['performance', 'Core Web Vitals', 'LCP'], author: 'Елена Козлова', createdAt: '2024-01-10', updatedAt: '2024-01-28', version: '3.0',
  },
  {
    id: 'REQ-005', title: 'Адаптивный интерфейс',
    description: 'Интерфейс должен корректно отображаться на устройствах с разрешением от 320px до 4K.',
    category: 'ui-ux', priority: 'medium', status: 'approved',
    tags: ['responsive', 'mobile', 'browsers'], author: 'Антон Новиков', createdAt: '2024-01-18', updatedAt: '2024-02-05', version: '1.5',
  },
  {
    id: 'REQ-006', title: 'Шифрование данных в покое',
    description: 'Все персональные данные хранятся в зашифрованном виде. Алгоритм: AES-256-GCM.',
    category: 'security', priority: 'critical', status: 'review',
    tags: ['encryption', 'AES-256', 'GDPR', 'HSM'], author: 'Алексей Петров', createdAt: '2024-02-05', updatedAt: '2024-02-22', version: '1.2',
  },
];

const MOCK_TECHNOLOGIES: Technology[] = [
  {
    id: 'TECH-001', name: 'Keycloak', description: 'Сервер управления идентификацией и доступом с поддержкой SSO, LDAP и OAuth 2.0.',
    version: '22.0.5', schemes: [], requirementIds: ['REQ-001', 'REQ-006'],
    createdAt: '2024-01-14', updatedAt: '2024-02-10',
  },
  {
    id: 'TECH-002', name: 'Kong Gateway', description: 'API Gateway с плагинами rate limiting, аутентификации и мониторинга.',
    version: '3.5.0', schemes: [], requirementIds: ['REQ-002'],
    createdAt: '2024-01-19', updatedAt: '2024-02-15',
  },
];

// ─── Configs ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Критический', color: 'text-red-400 bg-red-400/10 border-red-400/30', dot: 'bg-red-400' },
  high: { label: 'Высокий', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', dot: 'bg-orange-400' },
  medium: { label: 'Средний', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', dot: 'bg-yellow-400' },
  low: { label: 'Низкий', color: 'text-green-400 bg-green-400/10 border-green-400/30', dot: 'bg-green-400' },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
  review: { label: 'На ревью', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  approved: { label: 'Утверждено', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  rejected: { label: 'Отклонено', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
};

const CATEGORY_CONFIG: Record<Category, { label: string; icon: string; color: string }> = {
  functional: { label: 'Функциональные', icon: 'Zap', color: 'text-cyan-400' },
  'non-functional': { label: 'Нефункциональные', icon: 'Settings', color: 'text-purple-400' },
  security: { label: 'Безопасность', icon: 'Shield', color: 'text-red-400' },
  performance: { label: 'Производительность', icon: 'Gauge', color: 'text-yellow-400' },
  integration: { label: 'Интеграции', icon: 'GitBranch', color: 'text-blue-400' },
  'ui-ux': { label: 'UI/UX', icon: 'Layers', color: 'text-pink-400' },
};

// ─── Empty forms ──────────────────────────────────────────────────────────────

const emptyReqForm = {
  title: '', description: '', category: 'functional' as Category,
  priority: 'medium' as Priority, status: 'draft' as Status,
  tags: [] as string[], author: '', version: '1.0',
};

const emptyTechForm = {
  name: '', description: '', version: '',
};

// ─── View types ───────────────────────────────────────────────────────────────

type Tab = 'requirements' | 'technologies';
type ReqView = 'list' | 'detail' | 'create' | 'edit';
type TechView = 'list' | 'detail' | 'create' | 'edit';

// ─── Component ────────────────────────────────────────────────────────────────

const Index = () => {
  const [tab, setTab] = useState<Tab>('requirements');

  // Requirements state
  const [requirements, setRequirements] = useState<Requirement[]>(MOCK_REQUIREMENTS);
  const [reqView, setReqView] = useState<ReqView>('list');
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [reqForm, setReqForm] = useState({ ...emptyReqForm });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [tagInput, setTagInput] = useState('');

  // Technologies state
  const [technologies, setTechnologies] = useState<Technology[]>(MOCK_TECHNOLOGIES);
  const [techView, setTechView] = useState<TechView>('list');
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [techForm, setTechForm] = useState({ ...emptyTechForm });
  const [techReqIds, setTechReqIds] = useState<string[]>([]);
  const schemeInputRef = useRef<HTMLInputElement>(null);

  // ── Requirement helpers ──

  const filteredReqs = requirements.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    return matchSearch &&
      (filterStatus === 'all' || r.status === filterStatus) &&
      (filterPriority === 'all' || r.priority === filterPriority) &&
      (filterCategory === 'all' || r.category === filterCategory);
  });

  const stats = {
    total: requirements.length,
    approved: requirements.filter(r => r.status === 'approved').length,
    review: requirements.filter(r => r.status === 'review').length,
    critical: requirements.filter(r => r.priority === 'critical').length,
  };

  function openReqDetail(req: Requirement) { setSelectedReq(req); setReqView('detail'); }
  function openReqCreate() { setReqForm({ ...emptyReqForm, tags: [] }); setTagInput(''); setReqView('create'); }
  function openReqEdit(req: Requirement) {
    setReqForm({ title: req.title, description: req.description, category: req.category, priority: req.priority, status: req.status, tags: [...req.tags], author: req.author, version: req.version });
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

  // ── Technology helpers ──

  function openTechDetail(tech: Technology) { setSelectedTech(tech); setTechView('detail'); }
  function openTechCreate() {
    setTechForm({ ...emptyTechForm }); setTechReqIds([]); setTechView('create');
  }
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

  const delayClass = (i: number) => ['', 'delay-100', 'delay-200', 'delay-300', 'delay-400'][Math.min(i, 4)];

  const isOnSubpage = (tab === 'requirements' && reqView !== 'list') || (tab === 'technologies' && techView !== 'list');

  function goBack() {
    if (tab === 'requirements') setReqView('list');
    else setTechView('list');
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background mesh-bg font-golos">

      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setReqView('list'); setTechView('list'); }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg">
              <Icon name="Database" size={18} className="text-white" />
            </div>
            <div>
              <span className="font-oswald font-semibold text-xl gradient-text">ReqFlow</span>
              <span className="block text-xs text-muted-foreground leading-none">Управление требованиями</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOnSubpage && (
              <button onClick={goBack} className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">
                <Icon name="ArrowLeft" size={16} />Назад
              </button>
            )}
            {!isOnSubpage && tab === 'requirements' && (
              <button onClick={openReqCreate} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all shadow-lg shadow-cyan-500/20">
                <Icon name="Plus" size={16} />Новое требование
              </button>
            )}
            {!isOnSubpage && tab === 'technologies' && (
              <button onClick={openTechCreate} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl text-sm font-medium text-white hover:from-violet-400 hover:to-pink-400 transition-all shadow-lg shadow-violet-500/20">
                <Icon name="Plus" size={16} />Новая технология
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {!isOnSubpage && (
          <div className="max-w-7xl mx-auto px-6 pb-0 flex gap-1">
            {([
              { key: 'requirements', label: 'Требования', icon: 'ListChecks' },
              { key: 'technologies', label: 'Технологии', icon: 'Cpu' },
            ] as { key: Tab; label: string; icon: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 ${
                  tab === t.key
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${tab === t.key ? 'bg-cyan-400/20 text-cyan-400' : 'bg-white/8 text-muted-foreground'}`}>
                  {t.key === 'requirements' ? requirements.length : technologies.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ══════════════════ REQUIREMENTS TAB ══════════════════ */}
        {tab === 'requirements' && (
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

                <div className="glass rounded-2xl p-5 mb-6 flex flex-wrap gap-3 items-center">
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
                  {(search || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all') && (
                    <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all'); }}
                      className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground glass rounded-xl transition-all">
                      <Icon name="X" size={14} />Сбросить
                    </button>
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
                                  <span className="flex items-center gap-1"><Icon name="User" size={12} />{req.author}</span>
                                  <span className="flex items-center gap-1"><Icon name="Tag" size={12} />v{req.version}</span>
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

                  {/* Linked technologies */}
                  {(() => {
                    const linked = technologies.filter(t => t.requirementIds.includes(selectedReq.id));
                    return linked.length > 0 ? (
                      <div className="glass rounded-2xl p-6 md:col-span-2">
                        <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Привязанные технологии</h2>
                        <div className="flex flex-wrap gap-2">
                          {linked.map(t => (
                            <button key={t.id} onClick={() => { setTab('technologies'); openTechDetail(t); }}
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
        )}

        {/* ══════════════════ TECHNOLOGIES TAB ══════════════════ */}
        {tab === 'technologies' && (
          <>
            {/* LIST */}
            {techView === 'list' && (
              <div className="animate-fade-in">
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

                {technologies.length === 0 ? (
                  <div className="glass rounded-2xl p-16 text-center animate-fade-in">
                    <Icon name="Cpu" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <div className="text-lg font-oswald text-muted-foreground">Технологии не добавлены</div>
                    <button onClick={openTechCreate} className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl text-sm font-medium text-white">
                      <Icon name="Plus" size={16} />Добавить первую
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {technologies.map((tech, i) => (
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
                )}
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
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">
                    Привязанные требования <span className="text-cyan-400">({selectedTech.requirementIds.length})</span>
                  </h2>
                  {selectedTech.requirementIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Требования не привязаны</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTech.requirementIds.map(reqId => {
                        const req = requirements.find(r => r.id === reqId);
                        if (!req) return null;
                        return (
                          <button key={reqId} onClick={() => { setTab('requirements'); openReqDetail(req); }}
                            className="w-full flex items-center gap-3 p-3 glass rounded-xl text-left hover:border-cyan-500/30 transition-all">
                            <span className="text-xs font-oswald text-muted-foreground tracking-widest shrink-0">{req.id}</span>
                            <span className="text-sm text-foreground flex-1 truncate">{req.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_CONFIG[req.priority].color} shrink-0`}>
                              {PRIORITY_CONFIG[req.priority].label}
                            </span>
                            <Icon name="ChevronRight" size={14} className="text-muted-foreground shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
        )}
      </main>
    </div>
  );
};

export default Index;
