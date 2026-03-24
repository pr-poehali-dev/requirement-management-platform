// ─── Types ────────────────────────────────────────────────────────────────────

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Status = 'draft' | 'review' | 'approved' | 'rejected';
export type Category = 'functional' | 'non-functional' | 'security' | 'performance' | 'integration' | 'ui-ux';
export type EnvType = 'Prod' | 'ProdLike' | 'Stage' | 'Test' | 'Dev';
export type AppStage = 'Стадия Дизайна' | 'Стадия Деплоя' | 'Стадия Рантайма';
export type InteractionLevel = 'Обязательный' | 'Рекомендуется' | 'Не требуется';
export type Applicability = 'Применимо' | 'Не применимо';
export type DomainStatus = 'active' | 'draft' | 'archived' | 'review';
export type Tab = 'requirements' | 'technologies' | 'domains' | 'techdomains';
export type ReqView = 'list' | 'detail' | 'create' | 'edit';
export type TechView = 'list' | 'detail' | 'create' | 'edit';
export type DomainView = 'list' | 'detail' | 'create' | 'edit';
export type TechDomainView = 'list' | 'detail' | 'create' | 'edit';

export interface MermaidScheme {
  id: string;
  name: string;
  content: string;
  uploadedAt: string;
}

export interface Technology {
  id: string;
  name: string;
  description: string;
  version: string;
  schemes: MermaidScheme[];
  requirementIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrgDomain {
  id: string;
  name: string;
  version: string;
  owner: string;
  status: DomainStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechDomain {
  id: string;
  name: string;
  version: string;
  owner: string;
  status: DomainStatus;
  description: string;
  orgDomainIds: string[];
  technologyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReqAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface Requirement {
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
  environments: EnvType[];
  appStages: AppStage[];
  externalWithIod: InteractionLevel;
  externalWithoutIod: InteractionLevel;
  internalWithIod: InteractionLevel;
  internalWithoutIod: InteractionLevel;
  procurement: Applicability;
  scoringCategory: number;
  scoringWeight: number;
  attachments: ReqAttachment[];
}

// ─── Configs ──────────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Критический', color: 'text-red-400 bg-red-400/10 border-red-400/30', dot: 'bg-red-400' },
  high: { label: 'Высокий', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', dot: 'bg-orange-400' },
  medium: { label: 'Средний', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', dot: 'bg-yellow-400' },
  low: { label: 'Низкий', color: 'text-green-400 bg-green-400/10 border-green-400/30', dot: 'bg-green-400' },
};

export const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
  review: { label: 'На ревью', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  approved: { label: 'Утверждено', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  rejected: { label: 'Отклонено', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
};

export const CATEGORY_CONFIG: Record<Category, { label: string; icon: string; color: string }> = {
  functional: { label: 'Функциональные', icon: 'Zap', color: 'text-cyan-400' },
  'non-functional': { label: 'Нефункциональные', icon: 'Settings', color: 'text-purple-400' },
  security: { label: 'Безопасность', icon: 'Shield', color: 'text-red-400' },
  performance: { label: 'Производительность', icon: 'Gauge', color: 'text-yellow-400' },
  integration: { label: 'Интеграции', icon: 'GitBranch', color: 'text-blue-400' },
  'ui-ux': { label: 'UI/UX', icon: 'Layers', color: 'text-pink-400' },
};

export const DOMAIN_STATUS_CONFIG: Record<DomainStatus, { label: string; color: string }> = {
  active: { label: 'Активен', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  draft: { label: 'Черновик', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
  review: { label: 'На ревью', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  archived: { label: 'В архиве', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
};

// ─── Empty forms ──────────────────────────────────────────────────────────────

export const emptyReqForm = {
  title: '', description: '', category: 'functional' as Category,
  priority: 'medium' as Priority, status: 'draft' as Status,
  tags: [] as string[], author: '', version: '1.0',
  environments: [] as EnvType[],
  appStages: [] as AppStage[],
  externalWithIod: 'Не требуется' as InteractionLevel,
  externalWithoutIod: 'Не требуется' as InteractionLevel,
  internalWithIod: 'Не требуется' as InteractionLevel,
  internalWithoutIod: 'Не требуется' as InteractionLevel,
  procurement: 'Не применимо' as Applicability,
  scoringCategory: 1,
  scoringWeight: 1,
  attachments: [] as ReqAttachment[],
};

export const emptyTechForm = {
  name: '', description: '', version: '',
};

export const emptyDomainForm = {
  name: '', version: '1.0', owner: '', status: 'draft' as DomainStatus, description: '',
};

export const emptyTechDomainForm = {
  name: '', version: '1.0', owner: '', status: 'draft' as DomainStatus, description: '', orgDomainIds: [] as string[], technologyIds: [] as string[],
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const DEFAULT_REQ_EXTRA = {
  environments: [] as EnvType[], appStages: [] as AppStage[],
  externalWithIod: 'Не требуется' as InteractionLevel, externalWithoutIod: 'Не требуется' as InteractionLevel,
  internalWithIod: 'Не требуется' as InteractionLevel, internalWithoutIod: 'Не требуется' as InteractionLevel,
  procurement: 'Не применимо' as Applicability, scoringCategory: 1, scoringWeight: 1,
  attachments: [] as ReqAttachment[],
};

export const MOCK_REQUIREMENTS: Requirement[] = [
  {
    id: 'REQ-001', title: 'Аутентификация через SSO',
    description: 'Система должна поддерживать единый вход (SSO) через корпоративный LDAP и OAuth 2.0. Время сессии — 8 часов с автоматическим продлением при активности.',
    category: 'security', priority: 'critical', status: 'approved',
    tags: ['auth', 'SSO', 'LDAP', 'OAuth'], author: 'Алексей Петров', createdAt: '2024-01-15', updatedAt: '2024-02-10', version: '2.1',
    ...DEFAULT_REQ_EXTRA, environments: ['ProdLike', 'Dev'], appStages: ['Стадия Деплоя', 'Стадия Рантайма'],
    externalWithIod: 'Обязательный', internalWithIod: 'Обязательный', procurement: 'Применимо', scoringCategory: 3, scoringWeight: 8,
  },
  {
    id: 'REQ-002', title: 'API Gateway с rate limiting',
    description: 'Все внешние API-запросы проходят через единый шлюз. Rate limit: 1000 запросов/минуту на клиента.',
    category: 'performance', priority: 'high', status: 'review',
    tags: ['API', 'gateway', 'rate-limit'], author: 'Мария Иванова', createdAt: '2024-01-20', updatedAt: '2024-02-15', version: '1.3',
    ...DEFAULT_REQ_EXTRA,
  },
  {
    id: 'REQ-003', title: 'Интеграция с 1С ERP',
    description: 'Двусторонняя синхронизация данных с 1С:Предприятие 8.3. Обмен через REST API 1С, формат JSON.',
    category: 'integration', priority: 'high', status: 'draft',
    tags: ['1С', 'ERP', 'sync', 'REST'], author: 'Дмитрий Сидоров', createdAt: '2024-02-01', updatedAt: '2024-02-20', version: '1.0',
    ...DEFAULT_REQ_EXTRA,
  },
  {
    id: 'REQ-004', title: 'Время загрузки страниц < 2с',
    description: 'Все страницы приложения должны загружаться менее чем за 2 секунды при подключении 10 Мбит/с.',
    category: 'performance', priority: 'critical', status: 'approved',
    tags: ['performance', 'Core Web Vitals', 'LCP'], author: 'Елена Козлова', createdAt: '2024-01-10', updatedAt: '2024-01-28', version: '3.0',
    ...DEFAULT_REQ_EXTRA,
  },
  {
    id: 'REQ-005', title: 'Адаптивный интерфейс',
    description: 'Интерфейс должен корректно отображаться на устройствах с разрешением от 320px до 4K.',
    category: 'ui-ux', priority: 'medium', status: 'approved',
    tags: ['responsive', 'mobile', 'browsers'], author: 'Антон Новиков', createdAt: '2024-01-18', updatedAt: '2024-02-05', version: '1.5',
    ...DEFAULT_REQ_EXTRA,
  },
  {
    id: 'REQ-006', title: 'Шифрование данных в покое',
    description: 'Все персональные данные хранятся в зашифрованном виде. Алгоритм: AES-256-GCM.',
    category: 'security', priority: 'critical', status: 'review',
    tags: ['encryption', 'AES-256', 'GDPR', 'HSM'], author: 'Алексей Петров', createdAt: '2024-02-05', updatedAt: '2024-02-22', version: '1.2',
    ...DEFAULT_REQ_EXTRA,
  },
];

export const MOCK_TECHNOLOGIES: Technology[] = [
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

export const MOCK_TECH_DOMAINS: TechDomain[] = [
  {
    id: 'TDOM-001', name: 'Сервис авторизации', version: '3.1', owner: 'Дмитрий Орлов',
    status: 'active', description: 'Технический домен, обеспечивающий аутентификацию и авторизацию пользователей через OAuth 2.0 и JWT.',
    orgDomainIds: ['DOM-001'], technologyIds: ['TECH-001'],
    createdAt: '2024-01-15', updatedAt: '2024-02-20',
  },
  {
    id: 'TDOM-002', name: 'Платёжный процессор', version: '2.0', owner: 'Алексей Петров',
    status: 'review', description: 'Обработка и маршрутизация платёжных транзакций, интеграция с внешними шлюзами.',
    orgDomainIds: ['DOM-002'], technologyIds: ['TECH-002'],
    createdAt: '2024-01-22', updatedAt: '2024-02-25',
  },
];

export const MOCK_DOMAINS: OrgDomain[] = [
  {
    id: 'DOM-001', name: 'Управление клиентами', version: '2.0', owner: 'Мария Иванова',
    status: 'active', description: 'Домен отвечает за жизненный цикл клиента: онбординг, профиль, сегментация и взаимодействие с CRM-системой.',
    createdAt: '2024-01-10', updatedAt: '2024-02-18',
  },
  {
    id: 'DOM-002', name: 'Платёжный домен', version: '1.3', owner: 'Алексей Петров',
    status: 'review', description: 'Обработка платежей, интеграция с платёжными шлюзами, управление транзакциями и возвратами.',
    createdAt: '2024-01-20', updatedAt: '2024-02-22',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const delayClass = (i: number) => ['', 'delay-100', 'delay-200', 'delay-300', 'delay-400'][Math.min(i, 4)];