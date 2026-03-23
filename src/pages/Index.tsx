import { useState } from 'react';
import Icon from '@/components/ui/icon';

type Priority = 'critical' | 'high' | 'medium' | 'low';
type Status = 'draft' | 'review' | 'approved' | 'rejected';
type Category = 'functional' | 'non-functional' | 'security' | 'performance' | 'integration' | 'ui-ux';

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

const MOCK_REQUIREMENTS: Requirement[] = [
  {
    id: 'REQ-001',
    title: 'Аутентификация через SSO',
    description: 'Система должна поддерживать единый вход (SSO) через корпоративный LDAP и OAuth 2.0. Время сессии — 8 часов с автоматическим продлением при активности.',
    category: 'security',
    priority: 'critical',
    status: 'approved',
    tags: ['auth', 'SSO', 'LDAP', 'OAuth'],
    author: 'Алексей Петров',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-10',
    version: '2.1',
  },
  {
    id: 'REQ-002',
    title: 'API Gateway с rate limiting',
    description: 'Все внешние API-запросы проходят через единый шлюз. Rate limit: 1000 запросов/минуту на клиента. При превышении — ответ 429 с заголовком Retry-After.',
    category: 'performance',
    priority: 'high',
    status: 'review',
    tags: ['API', 'gateway', 'rate-limit'],
    author: 'Мария Иванова',
    createdAt: '2024-01-20',
    updatedAt: '2024-02-15',
    version: '1.3',
  },
  {
    id: 'REQ-003',
    title: 'Интеграция с 1С ERP',
    description: 'Двусторонняя синхронизация данных с 1С:Предприятие 8.3. Обмен через REST API 1С, формат JSON. Расписание синхронизации — каждые 15 минут.',
    category: 'integration',
    priority: 'high',
    status: 'draft',
    tags: ['1С', 'ERP', 'sync', 'REST'],
    author: 'Дмитрий Сидоров',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-20',
    version: '1.0',
  },
  {
    id: 'REQ-004',
    title: 'Время загрузки страниц < 2с',
    description: 'Все страницы приложения должны загружаться менее чем за 2 секунды при подключении 10 Мбит/с. LCP не более 2.5с, FID не более 100мс, CLS < 0.1.',
    category: 'performance',
    priority: 'critical',
    status: 'approved',
    tags: ['performance', 'Core Web Vitals', 'LCP'],
    author: 'Елена Козлова',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-28',
    version: '3.0',
  },
  {
    id: 'REQ-005',
    title: 'Адаптивный интерфейс',
    description: 'Интерфейс должен корректно отображаться на устройствах с разрешением от 320px до 4K. Поддержка браузеров: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.',
    category: 'ui-ux',
    priority: 'medium',
    status: 'approved',
    tags: ['responsive', 'mobile', 'browsers'],
    author: 'Антон Новиков',
    createdAt: '2024-01-18',
    updatedAt: '2024-02-05',
    version: '1.5',
  },
  {
    id: 'REQ-006',
    title: 'Шифрование данных в покое',
    description: 'Все персональные данные пользователей хранятся в зашифрованном виде. Алгоритм: AES-256-GCM. Ключи хранятся в HSM, ротация ключей — ежеквартально.',
    category: 'security',
    priority: 'critical',
    status: 'review',
    tags: ['encryption', 'AES-256', 'GDPR', 'HSM'],
    author: 'Алексей Петров',
    createdAt: '2024-02-05',
    updatedAt: '2024-02-22',
    version: '1.2',
  },
];

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

type View = 'list' | 'detail' | 'create' | 'edit';

const emptyForm = {
  title: '',
  description: '',
  category: 'functional' as Category,
  priority: 'medium' as Priority,
  status: 'draft' as Status,
  tags: [] as string[],
  author: '',
  version: '1.0',
};

const Index = () => {
  const [requirements, setRequirements] = useState<Requirement[]>(MOCK_REQUIREMENTS);
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<Requirement | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [tagInput, setTagInput] = useState('');

  const filtered = requirements.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchPriority = filterPriority === 'all' || r.priority === filterPriority;
    const matchCategory = filterCategory === 'all' || r.category === filterCategory;
    return matchSearch && matchStatus && matchPriority && matchCategory;
  });

  const stats = {
    total: requirements.length,
    approved: requirements.filter(r => r.status === 'approved').length,
    review: requirements.filter(r => r.status === 'review').length,
    critical: requirements.filter(r => r.priority === 'critical').length,
  };

  function openDetail(req: Requirement) {
    setSelected(req);
    setView('detail');
  }

  function openCreate() {
    setForm({ ...emptyForm, tags: [] });
    setTagInput('');
    setView('create');
  }

  function openEdit(req: Requirement) {
    setForm({
      title: req.title,
      description: req.description,
      category: req.category,
      priority: req.priority,
      status: req.status,
      tags: [...req.tags],
      author: req.author,
      version: req.version,
    });
    setSelected(req);
    setTagInput('');
    setView('edit');
  }

  function saveCreate() {
    const now = new Date().toISOString().split('T')[0];
    const newReq: Requirement = {
      ...form,
      id: `REQ-${String(requirements.length + 1).padStart(3, '0')}`,
      createdAt: now,
      updatedAt: now,
    };
    setRequirements(prev => [newReq, ...prev]);
    setView('list');
  }

  function saveEdit() {
    if (!selected) return;
    const now = new Date().toISOString().split('T')[0];
    setRequirements(prev => prev.map(r => r.id === selected.id ? { ...r, ...form, updatedAt: now } : r));
    setView('list');
  }

  function deleteReq(id: string) {
    setRequirements(prev => prev.filter(r => r.id !== id));
    setView('list');
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  }

  const delayClass = (i: number) => {
    const delays = ['', 'delay-100', 'delay-200', 'delay-300', 'delay-400'];
    return delays[Math.min(i, 4)];
  };

  return (
    <div className="min-h-screen bg-background mesh-bg font-golos">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('list')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg">
              <Icon name="Database" size={18} className="text-white" />
            </div>
            <div>
              <span className="font-oswald font-semibold text-xl gradient-text">ReqFlow</span>
              <span className="block text-xs text-muted-foreground leading-none">Управление требованиями</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {view !== 'list' && (
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"
              >
                <Icon name="ArrowLeft" size={16} />
                Назад
              </button>
            )}
            {view === 'list' && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all shadow-lg shadow-cyan-500/20"
              >
                <Icon name="Plus" size={16} />
                Новое требование
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Всего требований', value: stats.total, icon: 'ListChecks', colorFrom: 'from-cyan-500/20', colorTo: 'to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400' },
                { label: 'Утверждено', value: stats.approved, icon: 'CheckCircle', colorFrom: 'from-green-500/20', colorTo: 'to-green-500/5', border: 'border-green-500/20', text: 'text-green-400' },
                { label: 'На ревью', value: stats.review, icon: 'Eye', colorFrom: 'from-blue-500/20', colorTo: 'to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400' },
                { label: 'Критических', value: stats.critical, icon: 'AlertTriangle', colorFrom: 'from-red-500/20', colorTo: 'to-red-500/5', border: 'border-red-500/20', text: 'text-red-400' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={`glass rounded-2xl p-5 border ${s.border} bg-gradient-to-br ${s.colorFrom} ${s.colorTo} animate-fade-in ${delayClass(i)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                    <Icon name={s.icon} size={18} className={s.text} />
                  </div>
                  <div className={`font-oswald text-4xl font-semibold ${s.text}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="glass rounded-2xl p-5 mb-6 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по ID, названию, описанию..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as Status | 'all')}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
              >
                <option value="all">Все статусы</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>

              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
              >
                <option value="all">Все приоритеты</option>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>

              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as Category | 'all')}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
              >
                <option value="all">Все категории</option>
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>

              {(search || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all'); }}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground glass rounded-xl transition-all"
                >
                  <Icon name="X" size={14} />
                  Сбросить
                </button>
              )}
            </div>

            <div className="flex items-center mb-4">
              <span className="text-sm text-muted-foreground">
                Найдено: <span className="text-foreground font-medium">{filtered.length}</span> требований
              </span>
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center animate-fade-in">
                <Icon name="SearchX" size={48} className="text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-oswald text-muted-foreground">Требования не найдены</div>
                <p className="text-sm text-muted-foreground mt-2">Попробуйте изменить параметры фильтрации</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((req, i) => {
                  const prio = PRIORITY_CONFIG[req.priority];
                  const stat = STATUS_CONFIG[req.status];
                  const cat = CATEGORY_CONFIG[req.category];
                  return (
                    <div
                      key={req.id}
                      onClick={() => openDetail(req)}
                      className={`glass rounded-2xl p-5 cursor-pointer card-hover border border-white/8 animate-fade-in ${delayClass(i)}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-oswald text-xs text-muted-foreground tracking-widest">{req.id}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${prio.color}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${prio.dot} mr-1.5`}></span>
                              {prio.label}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${stat.color}`}>
                              {stat.label}
                            </span>
                            <span className={`text-xs flex items-center gap-1 ${cat.color}`}>
                              <Icon name={cat.icon} size={12} />
                              {cat.label}
                            </span>
                          </div>

                          <h3 className="font-oswald text-lg font-medium text-foreground mb-1.5 leading-tight">{req.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{req.description}</p>

                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <div className="flex flex-wrap gap-1.5">
                              {req.tags.slice(0, 4).map(tag => (
                                <span key={tag} className="text-xs px-2 py-0.5 glass rounded-md text-muted-foreground">
                                  #{tag}
                                </span>
                              ))}
                              {req.tags.length > 4 && (
                                <span className="text-xs px-2 py-0.5 glass rounded-md text-muted-foreground">+{req.tags.length - 4}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Icon name="User" size={12} />
                                {req.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon name="Tag" size={12} />
                                v{req.version}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon name="Calendar" size={12} />
                                {req.updatedAt}
                              </span>
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

        {/* DETAIL VIEW */}
        {view === 'detail' && selected && (
          <div className="animate-fade-in max-w-4xl">
            <div className="glass rounded-3xl p-8 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-oswald text-sm text-muted-foreground tracking-widest">{selected.id}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">v{selected.version}</span>
                  </div>
                  <h1 className="font-oswald text-3xl font-semibold text-foreground leading-tight mb-4">{selected.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-sm px-3 py-1 rounded-full border font-medium ${PRIORITY_CONFIG[selected.priority].color}`}>
                      <span className={`inline-block w-2 h-2 rounded-full ${PRIORITY_CONFIG[selected.priority].dot} mr-2`}></span>
                      {PRIORITY_CONFIG[selected.priority].label}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full border font-medium ${STATUS_CONFIG[selected.status].color}`}>
                      {STATUS_CONFIG[selected.status].label}
                    </span>
                    <span className={`text-sm flex items-center gap-1.5 px-3 py-1 glass rounded-full ${CATEGORY_CONFIG[selected.category].color}`}>
                      <Icon name={CATEGORY_CONFIG[selected.category].icon} size={14} />
                      {CATEGORY_CONFIG[selected.category].label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(selected)}
                    className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm hover:border-cyan-500/40 transition-all"
                  >
                    <Icon name="Pencil" size={15} />
                    Редактировать
                  </button>
                  <button
                    onClick={() => deleteReq(selected.id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Icon name="Trash2" size={15} />
                    Удалить
                  </button>
                </div>
              </div>

              <div className="border-t border-white/8 pt-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-3">Описание</h2>
                <p className="text-foreground leading-relaxed text-[15px]">{selected.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Теги</h2>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.length === 0 && <span className="text-sm text-muted-foreground">Теги не указаны</span>}
                  {selected.tags.map(tag => (
                    <span key={tag} className="text-sm px-3 py-1.5 glass rounded-lg text-muted-foreground border border-white/10">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Информация</h2>
                <div className="space-y-3">
                  {[
                    { icon: 'User', label: 'Автор', value: selected.author || '—' },
                    { icon: 'Calendar', label: 'Создано', value: selected.createdAt },
                    { icon: 'RefreshCw', label: 'Обновлено', value: selected.updatedAt },
                    { icon: 'Tag', label: 'Версия', value: `v${selected.version}` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name={item.icon} size={14} />
                        {item.label}
                      </span>
                      <span className="text-sm text-foreground font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT VIEW */}
        {(view === 'create' || view === 'edit') && (
          <div className="animate-fade-in max-w-3xl">
            <div className="mb-6">
              <h1 className="font-oswald text-3xl font-semibold gradient-text">
                {view === 'create' ? 'Новое требование' : 'Редактирование'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {view === 'create' ? 'Заполните поля для создания нового требования' : `Изменение ${selected?.id}`}
              </p>
            </div>

            <div className="glass rounded-3xl p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Название *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Краткое, ёмкое название требования"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Описание *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Подробное описание требования, критерии приёмки, ограничения..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all resize-none placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Категория</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Приоритет</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Статус</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Автор</label>
                  <input
                    value={form.author}
                    onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                    placeholder="Имя автора"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Версия</label>
                  <input
                    value={form.version}
                    onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                    placeholder="1.0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Теги</label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Введите тег и нажмите Enter"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-3 glass rounded-xl hover:border-cyan-500/40 transition-all text-foreground"
                  >
                    <Icon name="Plus" size={18} />
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 text-sm px-3 py-1.5 glass rounded-lg text-muted-foreground border border-white/10">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                          <Icon name="X" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={view === 'create' ? saveCreate : saveEdit}
                  disabled={!form.title.trim() || !form.description.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="Save" size={16} />
                  {view === 'create' ? 'Создать требование' : 'Сохранить изменения'}
                </button>
                <button
                  onClick={() => setView('list')}
                  className="px-6 py-3 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;