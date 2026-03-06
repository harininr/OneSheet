import { useState, useMemo } from "react";
import type { KeyTerm } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Star, ChevronDown, ArrowRight, Sparkles } from "lucide-react";

interface KeyTermsPanelProps {
    terms: KeyTerm[];
}

const IMPORTANCE_BADGES = {
    critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Critical" },
    important: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Important" },
    supplementary: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", dot: "bg-blue-400", label: "Supplementary" },
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
    const otherCount = terms.filter(t => t.importance === "supplementary").length;

    if (!terms.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-emerald-400">
                <BookOpen className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium">No key terms available</p>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.9, y: 10 },
        show: { opacity: 1, scale: 1, y: 0 }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-emerald-900">Key Terms & Glossary</h3>
                        <p className="text-xs text-emerald-500">{terms.length} terms · {criticalCount} critical</p>
                    </div>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
                    <input
                        type="text"
                        placeholder="Search terms..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-emerald-200 bg-white py-2.5 pl-10 pr-4 text-sm text-emerald-900 placeholder:text-emerald-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setFilterImportance(null)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all border ${!filterImportance
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400"
                            }`}
                    >
                        All ({terms.length})
                    </button>
                    {[
                        { key: "critical", count: criticalCount },
                        { key: "important", count: importantCount },
                        { key: "supplementary", count: otherCount },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilterImportance(filterImportance === f.key ? null : f.key)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all border ${filterImportance === f.key
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400"
                                }`}
                        >
                            {f.key.charAt(0).toUpperCase() + f.key.slice(1)} ({f.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Terms Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
                <AnimatePresence mode="popLayout">
                    {filtered.map((term) => {
                        const badge = IMPORTANCE_BADGES[term.importance];
                        const isExpanded = expandedTerm === term.term;

                        return (
                            <motion.div
                                key={term.term}
                                variants={item}
                                layout
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group rounded-xl border bg-white p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${isExpanded ? "border-emerald-400 ring-2 ring-emerald-500/10" : "border-emerald-100 hover:border-emerald-300"
                                    }`}
                                onClick={() => setExpandedTerm(isExpanded ? null : term.term)}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${badge.dot}`} />
                                        <h4 className="text-sm font-bold text-emerald-900 truncate">{term.term}</h4>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                            {badge.label}
                                        </span>
                                        <ChevronDown className={`h-3.5 w-3.5 text-emerald-300 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                    </div>
                                </div>

                                <p className="text-xs text-emerald-700 leading-relaxed">{term.definition}</p>

                                <AnimatePresence>
                                    {isExpanded && term.relatedTerms && term.relatedTerms.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 pt-3 border-t border-emerald-100"
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">Related Terms</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {term.relatedTerms.map(rt => (
                                                    <button
                                                        key={rt}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setExpandedTerm(rt);
                                                            setSearchQuery("");
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                                                    >
                                                        <ArrowRight className="h-3 w-3" />
                                                        {rt}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-emerald-400">
                    <Search className="h-8 w-8 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No terms match your search</p>
                </div>
            )}
        </div>
    );
}
