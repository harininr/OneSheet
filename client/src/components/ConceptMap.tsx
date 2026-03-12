import { useMemo, useState, useRef, useEffect } from "react";
import type { ConceptMap as ConceptMapType, ConceptNode, ConceptEdge } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Network, ZoomIn, ZoomOut, Maximize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConceptMapProps {
    data: ConceptMapType;
}

interface PositionedNode extends ConceptNode {
    x: number;
    y: number;
}

const IMPORTANCE_SIZES = { high: 56, medium: 42, low: 34 };
const IMPORTANCE_COLORS = {
    high: { fill: "#f97316", stroke: "#fb923c", text: "#ffffff", glow: "rgba(249,115,22,0.4)" },
    medium: { fill: "#8b5cf6", stroke: "#a78bfa", text: "#ffffff", glow: "rgba(139,92,246,0.3)" },
    low: { fill: "#1e293b", stroke: "#334155", text: "#94a3b8", glow: "rgba(148,163,184,0.1)" },
};

const GROUP_COLORS = [
    "#f97316", "#8b5cf6", "#3b82f6", "#06b6d4", "#ec4899", "#84cc16"
];

function computeLayout(nodes: ConceptNode[], edges: ConceptEdge[], width: number, height: number): PositionedNode[] {
    if (nodes.length === 0) return [];

    const groups = [...new Set(nodes.map(n => n.group))];
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;

    const positioned: PositionedNode[] = nodes.map((node, i) => {
        const groupIndex = groups.indexOf(node.group);
        const nodesInGroup = nodes.filter(n => n.group === node.group);
        const indexInGroup = nodesInGroup.indexOf(node);

        const groupAngle = (groupIndex / groups.length) * Math.PI * 2 - Math.PI / 2;
        const distFactor = node.importance === "high" ? 0.4 : node.importance === "medium" ? 0.75 : 1.1;
        const groupSpread = nodesInGroup.length > 1 ? (indexInGroup - (nodesInGroup.length - 1) / 2) * 60 : 0;

        const x = cx + Math.cos(groupAngle) * radius * distFactor + Math.cos(groupAngle + Math.PI / 2) * groupSpread;
        const y = cy + Math.sin(groupAngle) * radius * distFactor + Math.sin(groupAngle + Math.PI / 2) * groupSpread;

        return { ...node, x, y };
    });

    for (let iter = 0; iter < 12; iter++) {
        for (let i = 0; i < positioned.length; i++) {
            for (let j = i + 1; j < positioned.length; j++) {
                const dx = positioned[j].x - positioned[i].x;
                const dy = positioned[j].y - positioned[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const minDist = 110; 
                if (dist < minDist) {
                    const force = (minDist - dist) / 2;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    positioned[i].x -= fx;
                    positioned[i].y -= fy;
                    positioned[j].x += fx;
                    positioned[j].y += fy;
                }
            }
        }
    }

    const pad = 80;
    positioned.forEach(n => {
        n.x = Math.max(pad, Math.min(width - pad, n.x));
        n.y = Math.max(pad, Math.min(height - pad, n.y));
    });

    return positioned;
}

export function ConceptMap({ data }: ConceptMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDims = () => {
            if (containerRef.current) {
                setDimensions({ 
                    width: containerRef.current.clientWidth, 
                    height: 600 
                });
            }
        };
        updateDims();
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    const nodes = useMemo(
        () => computeLayout(data.nodes, data.edges, dimensions.width, dimensions.height),
        [data.nodes, data.edges, dimensions]
    );

    const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
    const groups = useMemo(() => [...new Set(data.nodes.map(n => n.group))], [data.nodes]);

    const activeNode = selectedNode || hoveredNode;
    
    const highlightedEdges = useMemo(() => {
        if (!activeNode) return new Set<string>();
        return new Set(
            data.edges
                .filter(e => e.from === activeNode || e.to === activeNode)
                .map((e, i) => `${e.from}-${e.to}-${i}`)
        );
    }, [activeNode, data.edges]);

    const connectedNodes = useMemo(() => {
        if (!activeNode) return new Set<string>();
        const connected = new Set<string>([activeNode]);
        data.edges.forEach(e => {
            if (e.from === activeNode) connected.add(e.to);
            if (e.to === activeNode) connected.add(e.from);
        });
        return connected;
    }, [activeNode, data.edges]);

    if (!data.nodes.length) {
        return (
            <div className="flex flex-col items-center justify-center p-20 glass-card bg-white/[0.02]">
                <Network className="h-12 w-12 mb-4 text-slate-700 animate-pulse" />
                <p className="text-sm font-black tracking-widest text-slate-500 uppercase">Neural map empty</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Immersive Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/10">
                        <Network className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Knowledge Graph</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{data.nodes.length} Nodes · {data.edges.length} Synapses</p>
                    </div>
                </div>
                
                <div className="glass-pill p-1.5 flex items-center gap-1.5 border-white/5 bg-white/[0.02]">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <ZoomOut className="h-4.5 w-4.5" />
                    </button>
                    <div className="px-3 text-[10px] font-black text-slate-300 w-12 text-center uppercase tracking-tighter">{Math.round(zoom * 100)}%</div>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.2))}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <ZoomIn className="h-4.5 w-4.5" />
                    </button>
                    <div className="h-4 w-px bg-white/5 mx-1" />
                    <button onClick={() => setZoom(1)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <Maximize2 className="h-4.5 w-4.5" />
                    </button>
                </div>
            </div>

            {/* Neural Legend */}
            <div className="flex flex-wrap items-center gap-6 px-4">
                <div className="flex flex-wrap items-center gap-4 border-r border-white/5 pr-6">
                    {groups.map((g, i) => (
                        <div key={g} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] }} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{g}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    {Object.entries(IMPORTANCE_SIZES).map(([key, size]) => (
                        <div key={key} className="flex items-center gap-2">
                             <div className="rounded-full border border-white/10" style={{ width: size / 4, height: size / 4, background: IMPORTANCE_COLORS[key as keyof typeof IMPORTANCE_COLORS].glow }} />
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Virtual Canvas */}
            <div ref={containerRef}
                className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-black/40 shadow-3xl group/canvas"
                style={{ height: "600px" }}>
                
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,10,30,0.4)_100%)] pointer-events-none" />

                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                    className="cursor-move"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                    <defs>
                        <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <marker id="synapse" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#334155" opacity="0.3" />
                        </marker>
                        <marker id="synapse-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
                        </marker>
                    </defs>

                    {/* Edges */}
                    {data.edges.map((edge, i) => {
                        const from = nodeMap.get(edge.from);
                        const to = nodeMap.get(edge.to);
                        if (!from || !to) return null;

                        const edgeKey = `${edge.from}-${edge.to}-${i}`;
                        const isHighlighted = highlightedEdges.has(edgeKey);
                        const isDimmed = activeNode && !isHighlighted;

                        const dx = to.x - from.x;
                        const dy = to.y - from.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const mx = (from.x + to.x) / 2 + dy * 0.12;
                        const my = (from.y + to.y) / 2 - dx * 0.12;

                        const fromSize = IMPORTANCE_SIZES[from.importance] / 2 + 6;
                        const toSize = IMPORTANCE_SIZES[to.importance] / 2 + 6;
                        const startX = from.x + (dx / dist) * fromSize;
                        const startY = from.y + (dy / dist) * fromSize;
                        const endX = to.x - (dx / dist) * toSize;
                        const endY = to.y - (dy / dist) * toSize;

                        return (
                            <g key={edgeKey} opacity={isDimmed ? 0.05 : 1} style={{ transition: "opacity 0.5s ease" }}>
                                <path
                                    d={`M ${startX} ${startY} Q ${mx} ${my} ${endX} ${endY}`}
                                    fill="none"
                                    stroke={isHighlighted ? "#f97316" : "#1e293b"}
                                    strokeWidth={isHighlighted ? 3 : 1.5}
                                    strokeDasharray={isHighlighted ? "none" : "4 2"}
                                    markerEnd={isHighlighted ? "url(#synapse-active)" : "url(#synapse)"}
                                    style={{ transition: "stroke 0.4s, stroke-width 0.4s" }}
                                />
                                {isHighlighted && (
                                    <text x={mx} y={my - 8} textAnchor="middle" fill="#fb923c" fontSize="10" fontWeight="900" className="uppercase tracking-tighter">
                                        {edge.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node, i) => {
                        const size = IMPORTANCE_SIZES[node.importance];
                        const colors = IMPORTANCE_COLORS[node.importance];
                        const groupColor = GROUP_COLORS[groups.indexOf(node.group) % GROUP_COLORS.length];
                        const isHovered = hoveredNode === node.id;
                        const isSelected = selectedNode === node.id;
                        const isActive = isHovered || isSelected;
                        const isDimmed = activeNode && !connectedNodes.has(node.id);

                        return (
                            <g
                                key={node.id}
                                className="transition-all duration-500"
                                opacity={isDimmed ? 0.1 : 1}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                onClick={() => setSelectedNode(s => s === node.id ? null : node.id)}
                            >
                                <circle cx={node.x} cy={node.y} r={size / 2 + 10} fill={isActive ? colors.glow : "transparent"} style={{ transition: "all 0.4s" }} />
                                
                                <circle cx={node.x} cy={node.y} r={size / 2 + 4} fill="none" stroke={groupColor}
                                    strokeWidth={isActive ? 3 : 1.5} opacity={isActive ? 1 : 0.3} style={{ transition: "all 0.4s" }} />

                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={size / 2}
                                    fill={isActive ? colors.fill : "#0f172a"}
                                    stroke={isActive ? colors.stroke : "rgba(255,255,255,0.1)"}
                                    strokeWidth={isActive ? 3 : 1.5}
                                    filter={isActive ? "url(#nodeGlow)" : "none"}
                                    style={{ transition: "all 0.4s" }}
                                />

                                <text
                                    x={node.x}
                                    y={node.y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill={isActive ? colors.text : "rgba(255,255,255,0.4)"}
                                    fontSize={size / 4.5}
                                    fontWeight={900}
                                    className="uppercase tracking-tighter pointer-events-none"
                                    style={{ transition: "fill 0.4s" }}
                                >
                                    {node.label.length > 12 ? node.label.slice(0, 10) + ".." : node.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Status Overlay */}
                <div className="absolute bottom-8 left-8 flex items-center gap-2 glass-pill px-4 py-2 border-white/5 pointer-events-none">
                    <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Link Active</span>
                </div>
            </div>

            {/* Insight Panel */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="glass-card p-6 border-white/10 bg-white/[0.03] shadow-3xl"
                    >
                        {(() => {
                            const node = nodeMap.get(selectedNode);
                            if (!node) return null;
                            const neighbors = data.edges
                                .filter(e => e.from === node.id || e.to === node.id)
                                .map(e => e.from === node.id ? nodeMap.get(e.to) : nodeMap.get(e.from));
                            
                            return (
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] text-white font-black text-2xl border-4 border-white/5 shadow-2xl"
                                        style={{ background: IMPORTANCE_COLORS[node.importance].fill }}>
                                        {node.label.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{node.label}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{node.group}</span>
                                                <div className="h-1 w-1 rounded-full bg-white/20" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{node.importance} priority neural center</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                            <div>
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-2">Connected Synapses</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {neighbors.map((n, i) => n && (
                                                        <div key={i} className="glass-pill px-2.5 py-1 text-[9px] font-black text-slate-400 border-white/5">{n.label}</div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-end justify-end">
                                                <button onClick={() => setSelectedNode(null)} className="glass-pill px-6 py-2 text-[10px] font-black text-orange-500 border-orange-500/20 hover:bg-orange-500/10 transition-all uppercase tracking-widest">Terminate Focus</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
