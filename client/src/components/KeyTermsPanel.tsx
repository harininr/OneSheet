import { useState, useMemo } from "react";
import type { KeyTerm } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Star, ChevronDown, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyTermsPanelProps {
    terms: KeyTerm[];
}

const IMPORTANCE_CONFIG = {
    critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]", dot: "bg-red-500", label: "Critical" },
    important: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", glow: "shadow-[0_0_15px_rgba(249,115,22,0.2)]", dot: "bg-orange-500", label: "Important" },
    supplementary: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]", dot: "bg-blue-400", label: "Supplementary" },
};

export function KeyTermsPanel({ terms }: KeyTermsPanelProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
    const [filterImportance, setFilterImportance] = useState<string | null>(null);

    const filtered = useMemo(() => {
        let result = terms;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
            );
        }
        if (filterImportance) {
            result = result.filter(t => t.importance === filterImportance);
        }
        return result;
    }, [terms, searchQuery, filterImportance]);

    const criticalCount = terms.filter(t => t.importance === "critical").length;
    const importantCount = terms.filter(t => t.importance === "important").length;
    const supplementaryCount = terms.filter(t => t.importance === "supplementary").length;

    if (!terms.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 glass-card bg-white/[0.02] border-white/5">
                <BookOpen className="h-12 w-12 mb-4 text-slate-700 opacity-30" />
                <p className="text-sm font-black tracking-widest text-slate-500 uppercase">Glossary unlinked</p>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/10">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Core Lexicon</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{terms.length} Neural concepts defined</p>
                    </div>
                </div>

                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH NEURAL NODES..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 text-xs font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.04] transition-all tracking-widest"
                    />
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2.5">
                <button
                    onClick={() => setFilterImportance(null)}
                    className={cn(
                        "glass-pill px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                        !filterImportance 
                            ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                            : "text-slate-500 border-white/5 hover:border-white/20 hover:text-slate-300"
                    )}
                >
                    ALL ENTRIES <span className="opacity-40 ml-1.5">{terms.length}</span>
                </button>
                {[
                    { key: "critical", count: criticalCount, color: "text-red-400" },
                    { key: "important", count: importantCount, color: "text-orange-400" },
                    { key: "supplementary", count: supplementaryCount, color: "text-blue-400" },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilterImportance(filterImportance === f.key ? null : f.key)}
                        className={cn(
                            "glass-pill px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                            filterImportance === f.key
                                ? "bg-white/10 text-white border-white/20 shadow-xl"
                                : "text-slate-500 border-white/5 hover:border-white/20 hover:text-slate-300"
                        )}
                    >
                        <span className={cn("mr-2", f.color)}>●</span>
                        {f.key} <span className="opacity-40 ml-1.5">{f.count}</span>
                    </button>
                ))}
            </div>

            {/* Terms Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-4 lg:grid-cols-2"
            >
                <AnimatePresence mode="popLayout">
                    {filtered.map((term) => {
                        const config = IMPORTANCE_CONFIG[term.importance];
                        const isExpanded = expandedTerm === term.term;

                        return (
                            <motion.div
                                key={term.term}
                                variants={item}
                                layout
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => setExpandedTerm(isExpanded ? null : term.term)}
                                className={cn(
                                    "group relative p-6 rounded-3xl border transition-all cursor-pointer overflow-hidden",
                                    isExpanded 
                                        ? "bg-white/[0.04] border-white/20 shadow-2xl" 
                                        : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02] hover:border-white/10"
                                )}
                            >
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-2.5 w-2.5 rounded-full", config.dot, config.glow)} />
                                        <h4 className="text-lg font-black text-white uppercase tracking-tighter">{term.term}</h4>
                                    </div>
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest",
                                        config.bg, config.text, config.border
                                    )}>
                                        {config.label}
                                    </div>
                                </div>

                                <p className={cn(
                                    "text-sm leading-relaxed transition-colors",
                                    isExpanded ? "text-slate-200" : "text-slate-500 line-clamp-3"
                                )}>
                                    {term.definition}
                                </p>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-6 pt-6 border-t border-white/5 space-y-4"
                                        >
                                            {term.relatedTerms && term.relatedTerms.length > 0 && (
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-3">SYNAPTIC LINKS</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {term.relatedTerms.map(rt => (
                                                            <button
                                                                key={rt}
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setExpandedTerm(rt);
                                                                    setSearchQuery("");
                                                                }}
                                                                className="glass-pill px-3 py-1.5 text-[10px] font-black text-slate-400 border-white/5 hover:border-orange-500/20 hover:text-orange-400 transition-all flex items-center gap-1.5"
                                                            >
                                                                <ArrowRight className="h-3 w-3" />
                                                                {rt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-end">
                                               <Sparkles className="h-4 w-4 text-orange-500/20" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <div className={cn(
                                    "absolute bottom-4 right-4 text-slate-800 transition-opacity",
                                    isExpanded ? "opacity-0" : "opacity-100 group-hover:text-slate-700"
                                )}>
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-700">
                    <Sparkles className="h-10 w-10 mb-4 opacity-10" />
                    <p className="text-sm font-black tracking-widest uppercase">Neural match zero</p>
                </div>
            )}
        </div>
    );
}
