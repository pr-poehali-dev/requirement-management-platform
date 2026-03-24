import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import Icon from '@/components/ui/icon';
import {
  Tab, Technology, Requirement,
  MOCK_REQUIREMENTS, MOCK_TECHNOLOGIES, MOCK_TECH_DOMAINS, MOCK_DOMAINS, MOCK_SOLUTIONS, MOCK_ARCHITECTURES,
} from '@/types';
import DataIOModal from '@/components/DataIOModal';
import { AppData } from '@/lib/dataIO';
import RequirementsTab, { RequirementsTabHandle } from '@/components/tabs/RequirementsTab';
import TechnologiesTab, { TechnologiesTabHandle } from '@/components/tabs/TechnologiesTab';
import DomainsTab, { DomainsTabHandle } from '@/components/tabs/DomainsTab';
import SolutionsTab, { SolutionsTabHandle } from '@/components/tabs/SolutionsTab';
import ArchitecturesTab, { ArchitecturesTabHandle } from '@/components/tabs/ArchitecturesTab';

const Index = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('domains');
  const [isOnSubpage, setIsOnSubpage] = useState(false);

  const [requirements, setRequirements] = useLocalStorage('reqflow_requirements', MOCK_REQUIREMENTS);
  const [technologies, setTechnologies] = useLocalStorage('reqflow_technologies', MOCK_TECHNOLOGIES);
  const [domains, setDomains] = useLocalStorage('reqflow_domains', MOCK_DOMAINS);
  const [techDomains, setTechDomains] = useLocalStorage('reqflow_techDomains', MOCK_TECH_DOMAINS);
  const [solutions, setSolutions] = useLocalStorage('reqflow_solutions', MOCK_SOLUTIONS);
  const [architectures, setArchitectures] = useLocalStorage('reqflow_architectures', MOCK_ARCHITECTURES);
  const [ioOpen, setIoOpen] = useState(false);

  const reqTabRef = useRef<RequirementsTabHandle>(null);
  const techTabRef = useRef<TechnologiesTabHandle>(null);
  const domainsTabRef = useRef<DomainsTabHandle>(null);
  const solutionsTabRef = useRef<SolutionsTabHandle>(null);
  const archTabRef = useRef<ArchitecturesTabHandle>(null);

  function navigateToTech(tech: Technology) {
    setTab('technologies');
    setIsOnSubpage(true);
    setTimeout(() => techTabRef.current?.openDetail(tech), 0);
  }
  function navigateToReq(_req: Requirement) {
    setTab('requirements');
    setIsOnSubpage(false);
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setIsOnSubpage(false);
  }

  function goBack() {
    if (tab === 'requirements') reqTabRef.current?.goBack();
    else if (tab === 'technologies') techTabRef.current?.goBack();
    else if (tab === 'solutions') solutionsTabRef.current?.goBack();
    else if (tab === 'architectures') archTabRef.current?.goBack();
    else if (tab === 'domains') domainsTabRef.current?.goBackDomain();
    else domainsTabRef.current?.goBackTechDomain();
    setIsOnSubpage(false);
  }

  function openCreate() {
    if (tab === 'requirements') reqTabRef.current?.openCreate();
    else if (tab === 'technologies') techTabRef.current?.openCreate();
    else if (tab === 'solutions') solutionsTabRef.current?.openCreate();
    else if (tab === 'architectures') archTabRef.current?.openCreate();
    else if (tab === 'domains') domainsTabRef.current?.openDomainCreate();
    else domainsTabRef.current?.openTechDomainCreate();
    setIsOnSubpage(true);
  }

  function handleLogoClick() {
    reqTabRef.current?.goBack();
    techTabRef.current?.goBack();
    solutionsTabRef.current?.goBack();
    archTabRef.current?.goBack();
    domainsTabRef.current?.goBackDomain();
    domainsTabRef.current?.goBackTechDomain();
    setIsOnSubpage(false);
  }

  const createLabel = tab === 'requirements' ? 'Новое требование'
    : tab === 'technologies' ? 'Новая технология'
    : tab === 'solutions' ? 'Новое решение'
    : tab === 'architectures' ? 'Новая архитектура'
    : tab === 'domains' ? 'Новый домен'
    : 'Новый тех. домен';

  const createGradient = tab === 'requirements' ? 'from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 shadow-cyan-500/20'
    : tab === 'technologies' ? 'from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 shadow-violet-500/20'
    : tab === 'solutions' ? 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20'
    : tab === 'architectures' ? 'from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 shadow-indigo-500/20'
    : tab === 'domains' ? 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20'
    : 'from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 shadow-violet-500/20';

  return (
    <div className="min-h-screen bg-background mesh-bg font-golos">

      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg">
              <Icon name="Database" size={18} className="text-white" />
            </div>
            <div>
              <span className="font-oswald font-semibold text-xl gradient-text">ReqFlow</span>
              <span className="block text-xs text-muted-foreground leading-none">Управление требованиями</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/catalog')} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 transition-all">
              <Icon name="BookOpen" size={15} />
              Каталог
            </button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 transition-all">
              <Icon name="Network" size={15} />
              Карта данных
            </button>
            {isOnSubpage && (
              <button onClick={goBack} className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">
                <Icon name="ArrowLeft" size={16} />Назад
              </button>
            )}
            {!isOnSubpage && (
              <>
                <button onClick={() => setIoOpen(true)} className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 transition-all">
                  <Icon name="ArrowLeftRight" size={15} />
                  Импорт / Экспорт
                </button>
                <button onClick={openCreate} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg bg-gradient-to-r ${createGradient}`}>
                  <Icon name="Plus" size={16} />
                  {createLabel}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        {!isOnSubpage && (
          <div className="max-w-7xl mx-auto px-6 pb-0 flex gap-1 overflow-x-auto">
            {([
              { key: 'domains', label: 'Орг. домены', icon: 'Building2', count: domains.length },
              { key: 'techdomains', label: 'Тех. домены', icon: 'Server', count: techDomains.length },
              { key: 'requirements', label: 'Требования', icon: 'ListChecks', count: requirements.length },
              { key: 'technologies', label: 'Технологии', icon: 'Cpu', count: technologies.length },
              { key: 'solutions', label: 'Тех. решения', icon: 'LayoutGrid', count: solutions.length },
              { key: 'architectures', label: 'Архитектуры', icon: 'Blocks', count: architectures.length },
            ] as { key: Tab; label: string; icon: string; count: number }[]).map(t => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                  tab === t.key
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${tab === t.key ? 'bg-cyan-400/20 text-cyan-400' : 'bg-white/8 text-muted-foreground'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'requirements' && (
          <RequirementsTab
            ref={reqTabRef}
            requirements={requirements}
            setRequirements={setRequirements}
            technologies={technologies}
            onNavigateToTech={navigateToTech}
          />
        )}
        {tab === 'technologies' && (
          <TechnologiesTab
            ref={techTabRef}
            technologies={technologies}
            setTechnologies={setTechnologies}
            requirements={requirements}
            onNavigateToReq={navigateToReq}
          />
        )}
        {tab === 'solutions' && (
          <SolutionsTab
            ref={solutionsTabRef}
            solutions={solutions}
            setSolutions={setSolutions}
            technologies={technologies}
            requirements={requirements}
            onNavigateToTech={navigateToTech}
          />
        )}
        {tab === 'architectures' && (
          <ArchitecturesTab
            ref={archTabRef}
            architectures={architectures}
            setArchitectures={setArchitectures}
            techDomains={techDomains}
            solutions={solutions}
            requirements={requirements}
          />
        )}
        {(tab === 'domains' || tab === 'techdomains') && (
          <DomainsTab
            ref={domainsTabRef}
            domains={domains}
            setDomains={setDomains}
            techDomains={techDomains}
            setTechDomains={setTechDomains}
            technologies={technologies}
            activeTab={tab as 'domains' | 'techdomains'}
          />
        )}
      </main>

      <DataIOModal
        open={ioOpen}
        onClose={() => setIoOpen(false)}
        data={{ requirements, technologies, domains, techDomains, solutions, architectures }}
        onImport={(imported: Partial<AppData>) => {
          if (imported.requirements) setRequirements(imported.requirements);
          if (imported.technologies) setTechnologies(imported.technologies);
          if (imported.domains) setDomains(imported.domains);
          if (imported.techDomains) setTechDomains(imported.techDomains);
          if (imported.solutions) setSolutions(imported.solutions);
          if (imported.architectures) setArchitectures(imported.architectures);
        }}
      />
    </div>
  );
};

export default Index;