import { useState, forwardRef, useImperativeHandle } from 'react';
import Icon from '@/components/ui/icon';
import {
  OrgDomain, TechDomain, Technology, DomainStatus, DomainView, TechDomainView,
  DOMAIN_STATUS_CONFIG, emptyDomainForm, emptyTechDomainForm, delayClass,
} from '@/types';

export interface DomainsTabHandle {
  domainIsOnSubpage: boolean;
  techDomainIsOnSubpage: boolean;
  openDomainCreate: () => void;
  openTechDomainCreate: () => void;
  goBackDomain: () => void;
  goBackTechDomain: () => void;
}

interface Props {
  domains: OrgDomain[];
  setDomains: React.Dispatch<React.SetStateAction<OrgDomain[]>>;
  techDomains: TechDomain[];
  setTechDomains: React.Dispatch<React.SetStateAction<TechDomain[]>>;
  technologies: Technology[];
  activeTab: 'domains' | 'techdomains';
}

const DomainsTab = forwardRef<DomainsTabHandle, Props>(
  ({ domains, setDomains, techDomains, setTechDomains, technologies, activeTab }, ref) => {
    const [domainView, setDomainView] = useState<DomainView>('list');
    const [selectedDomain, setSelectedDomain] = useState<OrgDomain | null>(null);
    const [domainForm, setDomainForm] = useState({ ...emptyDomainForm });

    const [techDomainView, setTechDomainView] = useState<TechDomainView>('list');
    const [selectedTechDomain, setSelectedTechDomain] = useState<TechDomain | null>(null);
    const [techDomainForm, setTechDomainForm] = useState({ ...emptyTechDomainForm });

    useImperativeHandle(ref, () => ({
      domainIsOnSubpage: domainView !== 'list',
      techDomainIsOnSubpage: techDomainView !== 'list',
      openDomainCreate: () => { setDomainForm({ ...emptyDomainForm }); setDomainView('create'); },
      openTechDomainCreate: () => { setTechDomainForm({ ...emptyTechDomainForm }); setTechDomainView('create'); },
      goBackDomain: () => setDomainView('list'),
      goBackTechDomain: () => setTechDomainView('list'),
    }), [domainView, techDomainView]);

    // ── Org Domain helpers ──
    function openDomainDetail(domain: OrgDomain) { setSelectedDomain(domain); setDomainView('detail'); }
    function openDomainEdit(domain: OrgDomain) {
      setDomainForm({ name: domain.name, version: domain.version, owner: domain.owner, status: domain.status, description: domain.description });
      setSelectedDomain(domain); setDomainView('edit');
    }
    function saveDomainCreate() {
      const now = new Date().toISOString().split('T')[0];
      setDomains(prev => [{ ...domainForm, id: `DOM-${String(prev.length + 1).padStart(3, '0')}`, createdAt: now, updatedAt: now }, ...prev]);
      setDomainView('list');
    }
    function saveDomainEdit() {
      if (!selectedDomain) return;
      const now = new Date().toISOString().split('T')[0];
      setDomains(prev => prev.map(d => d.id === selectedDomain.id ? { ...d, ...domainForm, updatedAt: now } : d));
      setDomainView('list');
    }
    function deleteDomain(id: string) { setDomains(prev => prev.filter(d => d.id !== id)); setDomainView('list'); }

    // ── Tech Domain helpers ──
    function openTechDomainDetail(td: TechDomain) { setSelectedTechDomain(td); setTechDomainView('detail'); }
    function openTechDomainEdit(td: TechDomain) {
      setTechDomainForm({ name: td.name, version: td.version, owner: td.owner, status: td.status, description: td.description, orgDomainIds: [...td.orgDomainIds], technologyIds: [...td.technologyIds] });
      setSelectedTechDomain(td); setTechDomainView('edit');
    }
    function saveTechDomainCreate() {
      const now = new Date().toISOString().split('T')[0];
      setTechDomains(prev => [{ ...techDomainForm, id: `TDOM-${String(prev.length + 1).padStart(3, '0')}`, createdAt: now, updatedAt: now }, ...prev]);
      setTechDomainView('list');
    }
    function saveTechDomainEdit() {
      if (!selectedTechDomain) return;
      const now = new Date().toISOString().split('T')[0];
      setTechDomains(prev => prev.map(d => d.id === selectedTechDomain.id ? { ...d, ...techDomainForm, updatedAt: now } : d));
      setTechDomainView('list');
    }
    function deleteTechDomain(id: string) { setTechDomains(prev => prev.filter(d => d.id !== id)); setTechDomainView('list'); }
    function toggleTechDomainOrgLink(orgId: string) {
      setTechDomainForm(f => ({
        ...f,
        orgDomainIds: f.orgDomainIds.includes(orgId) ? f.orgDomainIds.filter(x => x !== orgId) : [...f.orgDomainIds, orgId],
      }));
    }
    function toggleTechDomainTechLink(techId: string) {
      setTechDomainForm(f => ({
        ...f,
        technologyIds: f.technologyIds.includes(techId) ? f.technologyIds.filter(x => x !== techId) : [...f.technologyIds, techId],
      }));
    }

    // ════ DOMAINS TAB ════
    if (activeTab === 'domains') return (
      <>
        {/* LIST */}
        {domainView === 'list' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Всего доменов', value: domains.length, icon: 'Building2', colorFrom: 'from-emerald-500/20', colorTo: 'to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
                { label: 'Активных', value: domains.filter(d => d.status === 'active').length, icon: 'CheckCircle', colorFrom: 'from-green-500/20', colorTo: 'to-green-500/5', border: 'border-green-500/20', text: 'text-green-400' },
                { label: 'На ревью', value: domains.filter(d => d.status === 'review').length, icon: 'Eye', colorFrom: 'from-cyan-500/20', colorTo: 'to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400' },
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

            {domains.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center animate-fade-in">
                <Icon name="Building2" size={48} className="text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-oswald text-muted-foreground">Домены не добавлены</div>
                <button onClick={() => { setDomainForm({ ...emptyDomainForm }); setDomainView('create'); }} className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-sm font-medium text-white">
                  <Icon name="Plus" size={16} />Добавить первый
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {domains.map((domain, i) => {
                  const st = DOMAIN_STATUS_CONFIG[domain.status];
                  return (
                    <div key={domain.id} onClick={() => openDomainDetail(domain)}
                      className={`glass rounded-2xl p-6 cursor-pointer card-hover border border-white/8 animate-fade-in ${delayClass(i)}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-oswald text-xs text-muted-foreground tracking-widest">{domain.id}</span>
                          </div>
                          <h3 className="font-oswald text-xl font-semibold text-foreground">{domain.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">v{domain.version}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${st.color}`}>{st.label}</span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Icon name="Building2" size={20} className="text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{domain.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Icon name="User" size={13} className="text-emerald-400" />{domain.owner || '—'}
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          <Icon name="Calendar" size={12} />{domain.updatedAt}
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
        {domainView === 'detail' && selectedDomain && (
          <div className="animate-fade-in max-w-3xl">
            <div className="glass rounded-3xl p-8 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-oswald text-sm text-muted-foreground tracking-widest">{selectedDomain.id}</span>
                  </div>
                  <h1 className="font-oswald text-3xl font-semibold text-foreground mb-3">{selectedDomain.name}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">v{selectedDomain.version}</span>
                    <span className={`text-sm px-3 py-1 rounded-full border font-medium ${DOMAIN_STATUS_CONFIG[selectedDomain.status].color}`}>
                      {DOMAIN_STATUS_CONFIG[selectedDomain.status].label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openDomainEdit(selectedDomain)} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm hover:border-emerald-500/40 transition-all">
                    <Icon name="Pencil" size={15} />Редактировать
                  </button>
                  <button onClick={() => deleteDomain(selectedDomain.id)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/20 transition-all">
                    <Icon name="Trash2" size={15} />Удалить
                  </button>
                </div>
              </div>
              <div className="border-t border-white/8 pt-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-3">Описание</h2>
                <p className="text-foreground leading-relaxed text-[15px]">{selectedDomain.description}</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Информация</h2>
              <div className="space-y-3">
                {[
                  { icon: 'User', label: 'Владелец', value: selectedDomain.owner || '—' },
                  { icon: 'Tag', label: 'Версия', value: `v${selectedDomain.version}` },
                  { icon: 'Calendar', label: 'Создано', value: selectedDomain.createdAt },
                  { icon: 'RefreshCw', label: 'Обновлено', value: selectedDomain.updatedAt },
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
          </div>
        )}

        {/* CREATE / EDIT */}
        {(domainView === 'create' || domainView === 'edit') && (
          <div className="animate-fade-in max-w-3xl">
            <div className="mb-6">
              <h1 className="font-oswald text-3xl font-semibold" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {domainView === 'create' ? 'Новый орг. домен' : 'Редактирование'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {domainView === 'create' ? 'Создайте карточку организационного домена' : `Изменение ${selectedDomain?.id}`}
              </p>
            </div>
            <div className="glass rounded-3xl p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Название *</label>
                  <input value={domainForm.name} onChange={e => setDomainForm(f => ({ ...f, name: e.target.value }))} placeholder="Название домена"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Версия</label>
                  <input value={domainForm.version} onChange={e => setDomainForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Владелец</label>
                  <input value={domainForm.owner} onChange={e => setDomainForm(f => ({ ...f, owner: e.target.value }))} placeholder="Имя владельца домена"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Статус</label>
                  <select value={domainForm.status} onChange={e => setDomainForm(f => ({ ...f, status: e.target.value as DomainStatus }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 cursor-pointer">
                    {Object.entries(DOMAIN_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Описание</label>
                <textarea value={domainForm.description} onChange={e => setDomainForm(f => ({ ...f, description: e.target.value }))} rows={5}
                  placeholder="Назначение домена, границы ответственности, ключевые процессы..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500/50 transition-all resize-none placeholder:text-muted-foreground/50" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={domainView === 'create' ? saveDomainCreate : saveDomainEdit}
                  disabled={!domainForm.name.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-sm font-medium text-white hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon name="Save" size={16} />
                  {domainView === 'create' ? 'Создать домен' : 'Сохранить изменения'}
                </button>
                <button onClick={() => setDomainView('list')} className="px-6 py-3 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">Отмена</button>
              </div>
            </div>
          </div>
        )}
      </>
    );

    // ════ TECH DOMAINS TAB ════
    return (
      <>
        {/* LIST */}
        {techDomainView === 'list' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Всего', value: techDomains.length, icon: 'Server', colorFrom: 'from-violet-500/20', colorTo: 'to-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400' },
                { label: 'Активных', value: techDomains.filter(d => d.status === 'active').length, icon: 'CheckCircle', colorFrom: 'from-green-500/20', colorTo: 'to-green-500/5', border: 'border-green-500/20', text: 'text-green-400' },
                { label: 'На ревью', value: techDomains.filter(d => d.status === 'review').length, icon: 'Eye', colorFrom: 'from-cyan-500/20', colorTo: 'to-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400' },
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

            {techDomains.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center animate-fade-in">
                <Icon name="Server" size={48} className="text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-oswald text-muted-foreground">Технические домены не добавлены</div>
                <button onClick={() => { setTechDomainForm({ ...emptyTechDomainForm }); setTechDomainView('create'); }} className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-sm font-medium text-white">
                  <Icon name="Plus" size={16} />Добавить первый
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {techDomains.map((td, i) => {
                  const st = DOMAIN_STATUS_CONFIG[td.status];
                  const linkedOrgs = domains.filter(d => td.orgDomainIds.includes(d.id));
                  return (
                    <div key={td.id} onClick={() => openTechDomainDetail(td)}
                      className={`glass rounded-2xl p-6 cursor-pointer card-hover border border-white/8 animate-fade-in ${delayClass(i)}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-oswald text-xs text-muted-foreground tracking-widest">{td.id}</span>
                          </div>
                          <h3 className="font-oswald text-xl font-semibold text-foreground">{td.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full">v{td.version}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${st.color}`}>{st.label}</span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 border border-violet-500/20 flex items-center justify-center shrink-0">
                          <Icon name="Server" size={20} className="text-violet-400" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{td.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {linkedOrgs.length > 0 ? linkedOrgs.map(org => (
                          <span key={org.id} className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                            <Icon name="Building2" size={11} />{org.name}
                          </span>
                        )) : (
                          <span className="text-xs text-muted-foreground/50">Орг. домены не привязаны</span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <Icon name="User" size={12} className="text-violet-400" />{td.owner || '—'}
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
        {techDomainView === 'detail' && selectedTechDomain && (
          <div className="animate-fade-in max-w-3xl">
            <div className="glass rounded-3xl p-8 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <span className="font-oswald text-sm text-muted-foreground tracking-widest">{selectedTechDomain.id}</span>
                  <h1 className="font-oswald text-3xl font-semibold text-foreground mt-2 mb-3">{selectedTechDomain.name}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-violet-400 bg-violet-400/10 border border-violet-400/20 px-3 py-1 rounded-full">v{selectedTechDomain.version}</span>
                    <span className={`text-sm px-3 py-1 rounded-full border font-medium ${DOMAIN_STATUS_CONFIG[selectedTechDomain.status].color}`}>
                      {DOMAIN_STATUS_CONFIG[selectedTechDomain.status].label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openTechDomainEdit(selectedTechDomain)} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm hover:border-violet-500/40 transition-all">
                    <Icon name="Pencil" size={15} />Редактировать
                  </button>
                  <button onClick={() => deleteTechDomain(selectedTechDomain.id)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/20 transition-all">
                    <Icon name="Trash2" size={15} />Удалить
                  </button>
                </div>
              </div>
              <div className="border-t border-white/8 pt-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-3">Описание</h2>
                <p className="text-foreground leading-relaxed text-[15px]">{selectedTechDomain.description}</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 mb-4">
              <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Информация</h2>
              <div className="space-y-3">
                {[
                  { icon: 'User', label: 'Владелец', value: selectedTechDomain.owner || '—' },
                  { icon: 'Tag', label: 'Версия', value: `v${selectedTechDomain.version}` },
                  { icon: 'Calendar', label: 'Создано', value: selectedTechDomain.createdAt },
                  { icon: 'RefreshCw', label: 'Обновлено', value: selectedTechDomain.updatedAt },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon name={item.icon} size={14} />{item.label}</span>
                    <span className="text-sm text-foreground font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedTechDomain.orgDomainIds.length > 0 && (
              <div className="glass rounded-2xl p-6 mb-4">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Привязанные орг. домены</h2>
                <div className="flex flex-wrap gap-2">
                  {domains.filter(d => selectedTechDomain.orgDomainIds.includes(d.id)).map(org => (
                    <span key={org.id} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                      <Icon name="Building2" size={14} />{org.name}
                      <span className="text-emerald-400/60 text-xs">v{org.version}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedTechDomain.technologyIds.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h2 className="font-oswald text-sm uppercase tracking-wider text-muted-foreground mb-4">Привязанные технологии</h2>
                <div className="flex flex-wrap gap-2">
                  {technologies.filter(t => selectedTechDomain.technologyIds.includes(t.id)).map(tech => (
                    <span key={tech.id} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
                      <Icon name="Cpu" size={14} />{tech.name}
                      <span className="text-violet-400/60 text-xs">v{tech.version}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CREATE / EDIT */}
        {(techDomainView === 'create' || techDomainView === 'edit') && (
          <div className="animate-fade-in max-w-3xl">
            <div className="mb-6">
              <h1 className="font-oswald text-3xl font-semibold" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {techDomainView === 'create' ? 'Новый тех. домен' : 'Редактирование'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {techDomainView === 'create' ? 'Создайте карточку технического домена' : `Изменение ${selectedTechDomain?.id}`}
              </p>
            </div>
            <div className="glass rounded-3xl p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Название *</label>
                  <input value={techDomainForm.name} onChange={e => setTechDomainForm(f => ({ ...f, name: e.target.value }))} placeholder="Название технического домена"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Версия</label>
                  <input value={techDomainForm.version} onChange={e => setTechDomainForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Владелец</label>
                  <input value={techDomainForm.owner} onChange={e => setTechDomainForm(f => ({ ...f, owner: e.target.value }))} placeholder="Имя владельца домена"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-muted-foreground/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Статус</label>
                  <select value={techDomainForm.status} onChange={e => setTechDomainForm(f => ({ ...f, status: e.target.value as DomainStatus }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-violet-500/50 cursor-pointer">
                    {Object.entries(DOMAIN_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-oswald">Описание</label>
                <textarea value={techDomainForm.description} onChange={e => setTechDomainForm(f => ({ ...f, description: e.target.value }))} rows={4}
                  placeholder="Назначение домена, технические границы, ключевые компоненты..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-violet-500/50 transition-all resize-none placeholder:text-muted-foreground/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">
                  Привязка к орг. доменам
                  {techDomainForm.orgDomainIds.length > 0 && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full normal-case tracking-normal">{techDomainForm.orgDomainIds.length} выбрано</span>
                  )}
                </label>
                {domains.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic">Орг. домены не созданы. Сначала добавьте их в таб «Орг. домены».</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {domains.map(org => {
                      const isSelected = techDomainForm.orgDomainIds.includes(org.id);
                      const st = DOMAIN_STATUS_CONFIG[org.status];
                      return (
                        <button key={org.id} type="button" onClick={() => toggleTechDomainOrgLink(org.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/3 hover:border-white/20'}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                            {isSelected && <Icon name="Check" size={12} className="text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">{org.name}</span>
                              <span className="text-xs text-muted-foreground shrink-0">{org.id}</span>
                            </div>
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${st.color}`}>{st.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-oswald">
                  Привязка к технологиям
                  {techDomainForm.technologyIds.length > 0 && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full normal-case tracking-normal">{techDomainForm.technologyIds.length} выбрано</span>
                  )}
                </label>
                {technologies.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic">Технологии не добавлены. Сначала создайте их в таб «Технологии».</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {technologies.map(tech => {
                      const isSelected = techDomainForm.technologyIds.includes(tech.id);
                      return (
                        <button key={tech.id} type="button" onClick={() => toggleTechDomainTechLink(tech.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 bg-white/3 hover:border-white/20'}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-white/20'}`}>
                            {isSelected && <Icon name="Check" size={12} className="text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">{tech.name}</span>
                              <span className="text-xs text-muted-foreground shrink-0">{tech.id}</span>
                            </div>
                            <span className="text-xs text-violet-400/70">v{tech.version}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={techDomainView === 'create' ? saveTechDomainCreate : saveTechDomainEdit}
                  disabled={!techDomainForm.name.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-sm font-medium text-white hover:from-violet-400 hover:to-purple-400 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon name="Save" size={16} />
                  {techDomainView === 'create' ? 'Создать домен' : 'Сохранить изменения'}
                </button>
                <button onClick={() => setTechDomainView('list')} className="px-6 py-3 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">Отмена</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

DomainsTab.displayName = 'DomainsTab';

export default DomainsTab;
