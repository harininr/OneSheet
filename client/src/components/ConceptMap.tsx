import { useMemo, useState, useRef, useEffect } from "react";
import type { ConceptMap as ConceptMapType, ConceptNode, ConceptEdge } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Network, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react";

interface ConceptMapProps {
    data: ConceptMapType;
}

// ── Force-directed layout positions ──────────────────────────────────────────
interface PositionedNode extends ConceptNode {
    x: number;
    y: number;
}

const IMPORTANCE_SIZES = { high: 52, medium: 40, low: 32 };
const IMPORTANCE_COLORS = {
    high: { fill: "#059669", stroke: "#047857", text: "#ffffff", glow: "rgba(5,150,105,0.3)" },
    medium: { fill: "#3b82f6", stroke: "#2563eb", text: "#ffffff", glow: "rgba(59,130,246,0.3)" },
    low: { fill: "#8b5cf6", stroke: "#7c3aed", text: "#ffffff", glow: "rgba(139,92,246,0.2)" },
};

const GROUP_COLORS = [
    "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
    "#06b6d4", "#ec4899", "#84cc16"
];

function computeLayout(nodes: ConceptNode[], edges: ConceptEdge[], width: number, height: number): PositionedNode[] {
    if (nodes.length === 0) return [];

    // Group-based radial layout with jitter
    const groups = [...new Set(nodes.map(n => n.group))];
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.32;

    const positioned: PositionedNode[] = nodes.map((node, i) => {
        const groupIndex = groups.indexOf(node.group);
        const nodesInGroup = nodes.filter(n => n.group === node.group);
        const indexInGroup = nodesInGroup.indexOf(node);

        // Spread groups around center
        const groupAngle = (groupIndex / groups.length) * Math.PI * 2 - Math.PI / 2;

        // High importance nodes closer to center
        const distFactor = node.importance === "high" ? 0.5 : node.importance === "medium" ? 0.8 : 1.0;
        const groupSpread = nodesInGroup.length > 1 ? (indexInGroup - (nodesInGroup.length - 1) / 2) * 55 : 0;

        const x = cx + Math.cos(groupAngle) * radius * distFactor + Math.cos(groupAngle + Math.PI / 2) * groupSpread;
        const y = cy + Math.sin(groupAngle) * radius * distFactor + Math.sin(groupAngle + Math.PI / 2) * groupSpread;

        return { ...node, x, y };
    });

    // Force-directed relaxation — more iterations for cleaner layout
    for (let iter = 0; iter < 8; iter++) {
        for (let i = 0; i < positioned.length; i++) {
            for (let j = i + 1; j < positioned.length; j++) {
                const dx = positioned[j].x - positioned[i].x;
                const dy = positioned[j].y - positioned[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = 100; // minimum separation
                if (dist < minDist) {
                    const force = (minDist - dist) / 2;
                    const fx = (dx / Math.max(dist, 1)) * force;
                    const fy = (dy / Math.max(dist, 1)) * force;
                    positioned[i].x -= fx;
                    positioned[i].y -= fy;
                    positioned[j].x += fx;
                    positioned[j].y += fy;
                }
            }
        }
    }

    // Clamp within bounds
    const pad = 60;
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
    const [dimensions, setDimensions] = useState({ width: 800, height: 550 });

    useEffect(() => {
        if (containerRef.current) {
            const w = containerRef.current.clientWidth;
            setDimensions({ width: Math.max(600, w), height: 550 });
        }
    }, []);

    const nodes = useMemo(
        () => computeLayout(data.nodes, data.edges, dimensions.width, dimensions.height),
        [data.nodes, data.edges, dimensions]
    );

    const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

    const groups = useMemo(() => [...new Set(data.nodes.map(n => n.group))], [data.nodes]);

    const highlightedEdges = useMemo(() => {
        if (!hoveredNode && !selectedNode) return new Set<string>();
        const active = selectedNode || hoveredNode;
        return new Set(
            data.edges
                .filter(e => e.from === active || e.to === active)
                .map((e, i) => `${e.from}-${e.to}-${i}`)
        );
    }, [hoveredNode, selectedNode, data.edges]);

    const connectedNodes = useMemo(() => {
        if (!hoveredNode && !selectedNode) return new Set<string>();
        const active = selectedNode || hoveredNode;
        const connected = new Set<string>();
        connected.add(active!);
        data.edges.forEach(e => {
            if (e.from === active) connected.add(e.to);
            if (e.to === active) connected.add(e.from);
        });
        return connected;
    }, [hoveredNode, selectedNode, data.edges]);

    if (!data.nodes.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-emerald-400">
                <Network className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium">No concept map data available</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                        <Network className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-emerald-900">Smart Concept Map</h3>
                        <p className="text-xs text-emerald-500">{data.nodes.length} concepts · {data.edges.length} connections</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600 transition hover:bg-emerald-50">
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-semibold text-emerald-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.15))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600 transition hover:bg-emerald-50">
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <button onClick={() => setZoom(1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600 transition hover:bg-emerald-50">
                        <Maximize2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3">
                {groups.map((g, i) => (
                    <span key={g} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] }} />
                        {g}
                    </span>
                ))}
                <span className="text-gray-300 mx-1">|</span>
                {Object.entries(IMPORTANCE_SIZES).map(([key, size]) => (
                    <span key={key} className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                        <span className="rounded-full border-2 border-gray-300" style={{ width: size / 3, height: size / 3 }} />
                        {key}
                    </span>
                ))}
            </div>

            {/* SVG Canvas */}
            <div ref={containerRef}
                className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 shadow-inner"
                style={{ height: "550px" }}>

                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                    style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.3s ease" }}
                >
                    <defs>
                        {/* Glow filter */}
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        {/* Arrow marker */}
                        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                        </marker>
                        <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
                        </marker>
                    </defs>

                    {/* Grid dots background */}
                    {Array.from({ length: Math.ceil(dimensions.width / 30) }).map((_, i) =>
                        Array.from({ length: Math.ceil(dimensions.height / 30) }).map((_, j) => (
                            <circle key={`${i}-${j}`} cx={i * 30} cy={j * 30} r="0.8" fill="#e2e8f0" opacity="0.5" />
                        ))
                    )}

                    {/* Edges */}
                    {data.edges.map((edge, i) => {
                        const from = nodeMap.get(edge.from);
                        const to = nodeMap.get(edge.to);
                        if (!from || !to) return null;

                        const edgeKey = `${edge.from}-${edge.to}-${i}`;
                        const isHighlighted = highlightedEdges.has(edgeKey);
                        const isDimmed = (hoveredNode || selectedNode) && !isHighlighted;

                        // Curved path
                        const dx = to.x - from.x;
                        const dy = to.y - from.y;
                        const mx = (from.x + to.x) / 2 + dy * 0.15;
                        const my = (from.y + to.y) / 2 - dx * 0.15;

                        // Shorten line to not overlap node circles
                        const fromSize = IMPORTANCE_SIZES[from.importance] / 2 + 4;
                        const toSize = IMPORTANCE_SIZES[to.importance] / 2 + 4;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const startX = from.x + (dx / dist) * fromSize;
                        const startY = from.y + (dy / dist) * fromSize;
                        const endX = to.x - (dx / dist) * toSize;
                        const endY = to.y - (dy / dist) * toSize;

                        return (
                            <g key={edgeKey} style={{ transition: "opacity 0.3s" }} opacity={isDimmed ? 0.1 : 1}>
                                {/* Edge line */}
                                <path
                                    d={`M ${startX} ${startY} Q ${mx} ${my} ${endX} ${endY}`}
                                    fill="none"
                                    stroke={isHighlighted ? "#10b981" : "#cbd5e1"}
                                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                                    markerEnd={isHighlighted ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                    style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                                />
                                {/* Edge label */}
                                <text
                                    x={mx}
                                    y={my - 6}
                                    textAnchor="middle"
                                    fill={isHighlighted ? "#059669" : "#94a3b8"}
                                    fontSize="9"
                                    fontWeight={isHighlighted ? 700 : 500}
                                    fontFamily="'DM Sans', sans-serif"
                                    style={{ transition: "fill 0.3s" }}
                                >
                                    {edge.label}
                                </text>
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node, i) => {
                        const size = IMPORTANCE_SIZES[node.importance];
                        const colors = IMPORTANCE_COLORS[node.importance];
                        const groupIndex = groups.indexOf(node.group);
                        const groupColor = GROUP_COLORS[groupIndex % GROUP_COLORS.length];
                        const isHovered = hoveredNode === node.id;
                        const isSelected = selectedNode === node.id;
                        const isDimmed = (hoveredNode || selectedNode) && !connectedNodes.has(node.id);

                        return (
                            <g
                                key={node.id}
                                style={{ cursor: "pointer", transition: "opacity 0.3s" }}
                                opacity={isDimmed ? 0.15 : 1}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                onClick={() => setSelectedNode(s => s === node.id ? null : node.id)}
                            >
                                {/* Outer glow ring */}
                                {(isHovered || isSelected) && (
                                    <circle cx={node.x} cy={node.y} r={size / 2 + 8} fill={colors.glow} filter="url(#glow)" />
                                )}

                                {/* Group color ring */}
                                <circle cx={node.x} cy={node.y} r={size / 2 + 3} fill="none" stroke={groupColor}
                                    strokeWidth={isHovered || isSelected ? 3 : 2}
                                    strokeDasharray={node.importance === "low" ? "3 3" : "none"}
                                    opacity={0.6} />

                                {/* Main circle */}
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={size / 2}
                                    fill={colors.fill}
                                    stroke={colors.stroke}
                                    strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
                                    style={{ transition: "r 0.2s" }}
                                />

                                {/* Label */}
                                <text
                                    x={node.x}
                                    y={node.y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill={colors.text}
                                    fontSize={node.label.length > 12 ? 8 : node.label.length > 8 ? 9 : 10}
                                    fontWeight={700}
                                    fontFamily="'DM Sans', sans-serif"
                                >
                                    {node.label.length > 16 ? node.label.slice(0, 14) + "…" : node.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Selected node details */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm"
                    >
                        {(() => {
                            const node = nodeMap.get(selectedNode);
                            if (!node) return null;
                            const inEdges = data.edges.filter(e => e.to === node.id);
                            const outEdges = data.edges.filter(e => e.from === node.id);
                            return (
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-sm"
                                        style={{ background: IMPORTANCE_COLORS[node.importance].fill }}>
                                        {node.label.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-emerald-900">{node.label}</h4>
                                        <p className="text-xs text-emerald-500 mb-2">
                                            {node.group} · {node.importance} importance
                                        </p>
                                        {inEdges.length > 0 && (
                                            <div className="text-xs text-gray-600 mb-1">
                                                <span className="font-semibold text-emerald-700">Incoming: </span>
                                                {inEdges.map(e => `${nodeMap.get(e.from)?.label || e.from} (${e.label})`).join(", ")}
                                            </div>
                                        )}
                                        {outEdges.length > 0 && (
                                            <div className="text-xs text-gray-600">
                                                <span className="font-semibold text-emerald-700">Outgoing: </span>
                                                {outEdges.map(e => `${nodeMap.get(e.to)?.label || e.to} (${e.label})`).join(", ")}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => setSelectedNode(null)}
                                        className="text-xs text-emerald-400 hover:text-emerald-600 font-medium">
                                        Close
                                    </button>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-[10px] text-emerald-400 text-center">
                Click a concept to explore connections · Hover to highlight relationships
            </p>
        </div>
    );
}
