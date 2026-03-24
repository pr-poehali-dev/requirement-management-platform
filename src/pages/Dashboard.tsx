import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  MOCK_REQUIREMENTS, MOCK_TECHNOLOGIES, MOCK_TECH_DOMAINS, MOCK_DOMAINS, MOCK_SOLUTIONS, MOCK_ARCHITECTURES,
  OrgDomain, TechDomain, Technology, Requirement, TechnicalSolution, TypicalArchitecture,
  DOMAIN_STATUS_CONFIG, ARCH_STATUS_CONFIG, SOLUTION_STATUS_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG,
} from '@/types';

type NodeType = 'org' | 'tech' | 'technology' | 'requirement' | 'solution' | 'architecture';

interface Node {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  status?: string;
  count?: number;
  subLabel?: string;
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

const NODE_COLORS: Record<NodeType, { bg: string; border: string; text: string; glow: string }> = {
  org:          { bg: '#0f2a1a', border: '#22c55e', text: '#22c55e', glow: 'rgba(34,197,94,0.35)' },
  tech:         { bg: '#1a1030', border: '#a855f7', text: '#a855f7', glow: 'rgba(168,85,247,0.35)' },
  technology:   { bg: '#0d1f2d', border: '#00d4ff', text: '#00d4ff', glow: 'rgba(0,212,255,0.35)' },
  requirement:  { bg: '#1a1a0a', border: '#f59e0b', text: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
  solution:     { bg: '#0a1a2a', border: '#3b82f6', text: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
  architecture: { bg: '#1a0d1a', border: '#ec4899', text: '#ec4899', glow: 'rgba(236,72,153,0.35)' },
};

const TYPE_LABELS: Record<NodeType, string> = {
  org: 'Орг. домен',
  tech: 'Тех. домен',
  technology: 'Технология',
  requirement: 'Требование',
  solution: 'Решение',
  architecture: 'Архитектура',
};

const TYPE_ICONS: Record<NodeType, string> = {
  org: 'Building2',
  tech: 'Server',
  technology: 'Cpu',
  requirement: 'ListChecks',
  solution: 'LayoutGrid',
  architecture: 'Blocks',
};

const TAB_MAP: Record<NodeType, string> = {
  org: 'domains',
  tech: 'techdomains',
  technology: 'technologies',
  requirement: 'requirements',
  solution: 'solutions',
  architecture: 'architectures',
};

const LEGEND: { type: NodeType; label: string }[] = [
  { type: 'org', label: 'Орг. домены' },
  { type: 'tech', label: 'Тех. домены' },
  { type: 'technology', label: 'Технологии' },
  { type: 'requirement', label: 'Требования' },
  { type: 'solution', label: 'Решения' },
  { type: 'architecture', label: 'Архитектуры' },
];

function truncate(s: string, n = 18) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

const W = 1200;
const H = 820;
const NODE_W = 148;
const NODE_H = 54;
const R = 8;

function buildGraph(
  orgDomains: OrgDomain[],
  techDomains: TechDomain[],
  technologies: Technology[],
  requirements: Requirement[],
  solutions: TechnicalSolution[],
  architectures: TypicalArchitecture[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Layout columns: org → tech → tech/solution → req/arch
  // Column X positions
  const COL = [100, 290, 510, 730, 950];

  // Vertical spacing helper
  function yPos(items: unknown[], idx: number, col: number) {
    const total = items.length;
    const spacing = Math.min(72, (H - 100) / Math.max(total, 1));
    const startY = (H - spacing * (total - 1)) / 2;
    return startY + idx * spacing;
  }

  orgDomains.forEach((d, i) => {
    nodes.push({ id: `org_${d.id}`, label: truncate(d.name), type: 'org', x: COL[0], y: yPos(orgDomains, i, 0), subLabel: d.owner });
  });

  techDomains.forEach((d, i) => {
    nodes.push({ id: `tech_${d.id}`, label: truncate(d.name), type: 'tech', x: COL[1], y: yPos(techDomains, i, 1), subLabel: d.owner });
    d.orgDomainIds?.forEach(oid => {
      if (orgDomains.find(o => o.id === oid)) edges.push({ from: `org_${oid}`, to: `tech_${d.id}` });
    });
  });

  technologies.forEach((t, i) => {
    nodes.push({ id: `technology_${t.id}`, label: truncate(t.name), type: 'technology', x: COL[2], y: yPos(technologies, i, 2), subLabel: `v${t.version}` });
    techDomains.forEach(td => {
      if (td.technologyIds?.includes(t.id)) edges.push({ from: `tech_${td.id}`, to: `technology_${t.id}` });
    });
  });

  requirements.forEach((r, i) => {
    nodes.push({ id: `requirement_${r.id}`, label: truncate(r.title), type: 'requirement', x: COL[4], y: yPos(requirements, i, 4), subLabel: r.author });
    r.requirementIds?.forEach?.(() => {});
    technologies.forEach(t => {
      if (t.requirementIds?.includes(r.id)) edges.push({ from: `technology_${t.id}`, to: `requirement_${r.id}` });
    });
  });

  solutions.forEach((s, i) => {
    nodes.push({ id: `solution_${s.id}`, label: truncate(s.name), type: 'solution', x: COL[3], y: yPos(solutions, i, 3), subLabel: `v${s.version}` });
    s.technologyIds?.forEach(tid => {
      if (technologies.find(t => t.id === tid)) edges.push({ from: `technology_${tid}`, to: `solution_${s.id}` });
    });
  });

  architectures.forEach((a, i) => {
    const aIdx = solutions.length + i;
    const total = solutions.length + architectures.length;
    const spacing = Math.min(72, (H - 100) / Math.max(total, 1));
    const startY = (H - spacing * (total - 1)) / 2;
    const yOff = startY + aIdx * spacing;
    nodes.push({ id: `architecture_${a.id}`, label: truncate(a.name), type: 'architecture', x: COL[3], y: yOff, subLabel: a.author });
    a.solutionIds?.forEach(sid => {
      if (solutions.find(s => s.id === sid)) edges.push({ from: `solution_${sid}`, to: `architecture_${a.id}` });
    });
    if (a.techDomainId) {
      if (techDomains.find(td => td.id === a.techDomainId)) edges.push({ from: `tech_${a.techDomainId}`, to: `architecture_${a.id}` });
    }
  });

  return { nodes, edges };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [orgDomains] = useLocalStorage('reqflow_domains', MOCK_DOMAINS);
  const [techDomains] = useLocalStorage('reqflow_techDomains', MOCK_TECH_DOMAINS);
  const [technologies] = useLocalStorage('reqflow_technologies', MOCK_TECHNOLOGIES);
  const [requirements] = useLocalStorage('reqflow_requirements', MOCK_REQUIREMENTS);
  const [solutions] = useLocalStorage('reqflow_solutions', MOCK_SOLUTIONS);
  const [architectures] = useLocalStorage('reqflow_architectures', MOCK_ARCHITECTURES);

  const { nodes, edges } = buildGraph(orgDomains, techDomains, technologies, requirements, solutions, architectures);

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;

  function getConnected(nodeId: string): string[] {
    return edges.flatMap(e => {
      if (e.from === nodeId) return [e.to];
      if (e.to === nodeId) return [e.from];
      return [];
    });
  }

  function isEdgeHighlighted(edge: Edge): boolean {
    if (!hoveredNode && !selectedNode) return false;
    const active = selectedNode || hoveredNode;
    return edge.from === active || edge.to === active;
  }

  function isNodeFaded(nodeId: string): boolean {
    const active = selectedNode || hoveredNode;
    if (!active) return false;
    if (nodeId === active) return false;
    return !getConnected(active).includes(nodeId);
  }

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(3, Math.max(0.3, z * delta)));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  }

  function onMouseUp() {
    setDragging(false);
    dragStart.current = null;
  }

  function handleNodeClick(node: Node) {
    setSelectedNode(prev => prev === node.id ? null : node.id);
  }

  function goToTab(type: NodeType) {
    navigate(`/?tab=${TAB_MAP[type]}`);
  }

  // Stats
  const stats = [
    { label: 'Орг. домены', count: orgDomains.length, type: 'org' as NodeType, icon: 'Building2' },
    { label: 'Тех. домены', count: techDomains.length, type: 'tech' as NodeType, icon: 'Server' },
    { label: 'Технологии', count: technologies.length, type: 'technology' as NodeType, icon: 'Cpu' },
    { label: 'Требования', count: requirements.length, type: 'requirement' as NodeType, icon: 'ListChecks' },
    { label: 'Решения', count: solutions.length, type: 'solution' as NodeType, icon: 'LayoutGrid' },
    { label: 'Архитектуры', count: architectures.length, type: 'architecture' as NodeType, icon: 'Blocks' },
  ];

  return (
    <div className="min-h-screen bg-background mesh-bg font-golos flex flex-col">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg">
              <Icon name="Database" size={18} className="text-white" />
            </div>
            <div>
              <span className="font-oswald font-semibold text-xl gradient-text">ReqFlow</span>
              <span className="block text-xs text-muted-foreground leading-none">Карта данных</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 transition-all"
            >
              <Icon name="LayoutDashboard" size={15} />
              К данным
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {stats.map(s => {
            const c = NODE_COLORS[s.type];
            return (
              <button
                key={s.type}
                onClick={() => goToTab(s.type)}
                className="glass rounded-xl px-4 py-3 flex flex-col gap-1 hover:border-white/20 transition-all group text-left"
                style={{ borderColor: `${c.border}33` }}
              >
                <div className="flex items-center gap-2">
                  <Icon name={s.icon} size={14} style={{ color: c.text }} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <span className="text-2xl font-oswald font-semibold" style={{ color: c.text }}>{s.count}</span>
              </button>
            );
          })}
        </div>

        {/* Diagram card */}
        <div className="glass rounded-2xl border border-white/8 flex flex-col overflow-hidden" style={{ minHeight: 520 }}>
          {/* Diagram toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Icon name="Network" size={16} className="text-cyan-400" />
              <span className="text-sm font-medium text-foreground">Диаграмма взаимодействия</span>
              <span className="text-xs text-muted-foreground ml-2">
                {nodes.length} узлов · {edges.length} связей
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Legend */}
              <div className="hidden md:flex items-center gap-3">
                {LEGEND.map(l => (
                  <div key={l.type} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: NODE_COLORS[l.type].border }} />
                    <span className="text-xs text-muted-foreground">{l.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 glass rounded-lg px-2 py-1">
                <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="ZoomIn" size={14} />
                </button>
                <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="ZoomOut" size={14} />
                </button>
                <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-1">
                  <Icon name="Maximize2" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative flex-1" style={{ minHeight: 460 }}>
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${W} ${H}`}
              style={{ cursor: dragging ? 'grabbing' : 'grab', display: 'block', minHeight: 460 }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <defs>
                {Object.entries(NODE_COLORS).map(([type, c]) => (
                  <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor={c.border} floodOpacity="0.6" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                ))}
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.2)" />
                </marker>
                <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(0,212,255,0.8)" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}
                 style={{ transformOrigin: `${W / 2}px ${H / 2}px` }}>

                {/* Column labels */}
                {[
                  { x: 100, label: 'Орг. домены', color: NODE_COLORS.org.border },
                  { x: 290, label: 'Тех. домены', color: NODE_COLORS.tech.border },
                  { x: 510, label: 'Технологии', color: NODE_COLORS.technology.border },
                  { x: 730, label: 'Решения / Арх.', color: NODE_COLORS.solution.border },
                  { x: 950, label: 'Требования', color: NODE_COLORS.requirement.border },
                ].map(col => (
                  <g key={col.x}>
                    <line x1={col.x} y1={30} x2={col.x} y2={H - 20} stroke={col.color} strokeWidth="1" strokeOpacity="0.12" strokeDasharray="4 6" />
                    <text x={col.x} y={22} textAnchor="middle" fontSize="11" fill={col.color} fillOpacity="0.7" fontFamily="Oswald, sans-serif" letterSpacing="0.5">
                      {col.label}
                    </text>
                  </g>
                ))}

                {/* Edges */}
                {edges.map((edge, i) => {
                  const from = nodes.find(n => n.id === edge.from);
                  const to = nodes.find(n => n.id === edge.to);
                  if (!from || !to) return null;
                  const highlighted = isEdgeHighlighted(edge);
                  const x1 = from.x + NODE_W / 2;
                  const y1 = from.y;
                  const x2 = to.x - NODE_W / 2;
                  const y2 = to.y;
                  const cx1 = x1 + (x2 - x1) * 0.45;
                  const cx2 = x1 + (x2 - x1) * 0.55;
                  return (
                    <path
                      key={i}
                      d={`M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`}
                      fill="none"
                      stroke={highlighted ? 'rgba(0,212,255,0.75)' : 'rgba(255,255,255,0.1)'}
                      strokeWidth={highlighted ? 2 : 1}
                      markerEnd={highlighted ? 'url(#arrow-active)' : 'url(#arrow)'}
                      style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map(node => {
                  const c = NODE_COLORS[node.type];
                  const isHov = hoveredNode === node.id;
                  const isSel = selectedNode === node.id;
                  const faded = isNodeFaded(node.id);
                  const active = isHov || isSel;
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x - NODE_W / 2},${node.y - NODE_H / 2})`}
                      style={{ cursor: 'pointer', opacity: faded ? 0.3 : 1, transition: 'opacity 0.2s' }}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => handleNodeClick(node)}
                    >
                      {active && (
                        <rect
                          x={-3} y={-3}
                          width={NODE_W + 6} height={NODE_H + 6}
                          rx={R + 2}
                          fill="none"
                          stroke={c.border}
                          strokeWidth="1.5"
                          strokeOpacity="0.5"
                          style={{ filter: `drop-shadow(0 0 8px ${c.glow})` }}
                        />
                      )}
                      <rect
                        x={0} y={0}
                        width={NODE_W} height={NODE_H}
                        rx={R}
                        fill={c.bg}
                        stroke={isSel ? c.border : active ? c.border : `${c.border}55`}
                        strokeWidth={isSel ? 1.5 : 1}
                        filter={active ? `url(#glow-${node.type})` : undefined}
                      />
                      {/* Icon strip */}
                      <rect x={0} y={0} width={28} height={NODE_H} rx={R} fill={`${c.border}18`} />
                      <rect x={16} y={0} width={12} height={NODE_H} fill={`${c.border}18`} />
                      <text x={14} y={NODE_H / 2 + 5} textAnchor="middle" fontSize="13" fill={c.text}>
                        {node.type === 'org' ? '🏢' : node.type === 'tech' ? '🖥' : node.type === 'technology' ? '⚙' : node.type === 'requirement' ? '📋' : node.type === 'solution' ? '🔧' : '🏛'}
                      </text>
                      {/* Label */}
                      <text x={36} y={NODE_H / 2 - 4} fontSize="11" fill={c.text} fontWeight="600" fontFamily="Golos Text, sans-serif">
                        {node.label}
                      </text>
                      {node.subLabel && (
                        <text x={36} y={NODE_H / 2 + 9} fontSize="9" fill={`${c.text}88`} fontFamily="Golos Text, sans-serif">
                          {truncate(node.subLabel, 16)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Hint */}
            {!selectedNode && !hoveredNode && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground glass rounded-lg px-3 py-1.5 pointer-events-none">
                Нажмите на узел для подсветки связей · Колёсико для масштаба · Перетаскивание для панорамы
              </div>
            )}

            {/* Selected info panel */}
            {selectedNodeData && (
              <div
                className="absolute top-4 right-4 glass rounded-xl p-4 min-w-52 max-w-64 border"
                style={{ borderColor: `${NODE_COLORS[selectedNodeData.type].border}44` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon name={TYPE_ICONS[selectedNodeData.type] as string} size={14} style={{ color: NODE_COLORS[selectedNodeData.type].text }} />
                    <span className="text-xs text-muted-foreground">{TYPE_LABELS[selectedNodeData.type]}</span>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="X" size={14} />
                  </button>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{selectedNodeData.label}</p>
                {selectedNodeData.subLabel && (
                  <p className="text-xs text-muted-foreground mb-3">{selectedNodeData.subLabel}</p>
                )}
                <div className="text-xs text-muted-foreground mb-3">
                  Связей: <span className="text-foreground font-medium">{getConnected(selectedNodeData.id).length}</span>
                </div>
                <button
                  onClick={() => goToTab(selectedNodeData.type)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background: `${NODE_COLORS[selectedNodeData.type].border}22`, color: NODE_COLORS[selectedNodeData.type].text, border: `1px solid ${NODE_COLORS[selectedNodeData.type].border}44` }}
                >
                  Открыть раздел <Icon name="ArrowRight" size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Relationship legend */}
        <div className="glass rounded-xl border border-white/8 px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Share2" size={15} className="text-cyan-400" />
            <span className="text-sm font-medium">Схема взаимосвязей</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { from: 'org', to: 'tech', label: 'Орг. домен → содержит → Тех. домен' },
              { from: 'tech', to: 'technology', label: 'Тех. домен → использует → Технологии' },
              { from: 'tech', to: 'architecture', label: 'Тех. домен → описывает → Архитектуру' },
              { from: 'technology', to: 'requirement', label: 'Технология → реализует → Требования' },
              { from: 'technology', to: 'solution', label: 'Технология → входит в → Решение' },
              { from: 'solution', to: 'architecture', label: 'Решение → формирует → Архитектуру' },
            ].map((rel, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-2 h-2 rounded-full" style={{ background: NODE_COLORS[rel.from as NodeType].border }} />
                  <div className="w-8 h-px bg-white/20" />
                  <Icon name="ArrowRight" size={10} className="text-muted-foreground" />
                  <div className="w-2 h-2 rounded-full" style={{ background: NODE_COLORS[rel.to as NodeType].border }} />
                </div>
                <span className="text-xs text-muted-foreground">{rel.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
