import { useState, useMemo, useCallback } from "react";
import type { Quiz as QuizType, QuizQuestion } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain, CheckCircle2, XCircle, ArrowRight, RotateCcw,
    Trophy, Target, Flame, Clock, Sparkles, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizModeProps {
    quiz: QuizType;
}

type QuizState = "intro" | "playing" | "results";

const DIFFICULTY_STYLE = {
    easy: { text: "text-emerald-400", dot: "bg-emerald-500", glow: "shadow-[0_0_10px_rgba(16,185,129,0.3)]" },
    medium: { text: "text-orange-400", dot: "bg-orange-500", glow: "shadow-[0_0_10px_rgba(249,115,22,0.3)]" },
    hard: { text: "text-red-400", dot: "bg-red-500", glow: "shadow-[0_0_10px_rgba(239,68,68,0.3)]" },
};

export function QuizMode({ quiz }: QuizModeProps) {
    const [state, setState] = useState<QuizState>("intro");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, number>>(new Map());
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    const questions = quiz.questions;
    const current = questions[currentIndex];

    const score = useMemo(() => {
        let correct = 0;
        answers.forEach((answer, qId) => {
            const q = questions.find(q => q.id === qId);
            if (q && q.correctIndex === answer) correct++;
        });
        return correct;
    }, [answers, questions]);

    const totalAnswered = answers.size;

    const handleSelectOption = useCallback((optionIndex: number) => {
        if (showExplanation) return;
        setSelectedOption(optionIndex);
        setShowExplanation(true);
        setAnswers(prev => {
            const next = new Map(prev);
            next.set(current.id, optionIndex);
            return next;
        });

        if (optionIndex === current.correctIndex) {
            setStreak(s => {
                const next = s + 1;
                setBestStreak(b => Math.max(b, next));
                return next;
            });
        } else {
            setStreak(0);
        }
    }, [showExplanation, current]);

    const handleNext = useCallback(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            setState("results");
        }
    }, [currentIndex, questions.length]);

    const handleRestart = useCallback(() => {
        setCurrentIndex(0);
        setAnswers(new Map());
        setSelectedOption(null);
        setShowExplanation(false);
        setState("intro");
        setStreak(0);
        setBestStreak(0);
        setStartTime(Date.now());
    }, []);

    if (!questions.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 glass-card bg-white/[0.02]">
                <Brain className="h-12 w-12 mb-4 text-slate-700 opacity-20" />
                <p className="text-sm font-black tracking-widest text-slate-500 uppercase">Neural engine idle</p>
            </div>
        );
    }

    // ── INTRO SCREEN ─────────────────────────────────────────────────────────
    if (state === "intro") {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-10 py-10">
                <div className="relative group">
                    <div className="absolute inset-0 bg-orange-500/20 blur-[80px] rounded-full group-hover:bg-orange-500/30 transition-all duration-700" />
                    <div className="relative h-24 w-24 rounded-[2.5rem] bg-orange-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(249,115,22,0.4)] border-4 border-white/10 group-hover:scale-105 transition-transform duration-500">
                        <Brain className="h-12 w-12" />
                    </div>
                </div>

                <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase">Knowledge Synthesis</h3>
                    <p className="text-sm text-slate-400 max-w-sm font-medium leading-relaxed">
                        Ready to validate your neural retention? {questions.length} hyper-focused questions await your analysis.
                    </p>
                </div>

                <div className="flex gap-3">
                    {["easy", "medium", "hard"].map(diff => {
                        const count = questions.filter(q => q.difficulty === diff).length;
                        if (count === 0) return null;
                        const style = DIFFICULTY_STYLE[diff as keyof typeof DIFFICULTY_STYLE];
                        return (
                            <div key={diff} className="glass-pill px-4 py-2 border-white/5 bg-white/[0.02] flex items-center gap-2">
                                <div className={cn("h-1.5 w-1.5 rounded-full", style.dot, style.glow)} />
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", style.text)}>{diff}</span>
                                <span className="text-xs font-black text-white ml-1">{count}</span>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => setState("playing")}
                    className="group relative h-14 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden shadow-2xl shadow-white/10"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-3">
                        Initiate Protocol <ChevronRight className="h-4 w-4" />
                    </span>
                </button>
            </motion.div>
        );
    }

    // ── RESULTS SCREEN ───────────────────────────────────────────────────────
    if (state === "results") {
        const pct = Math.round((score / questions.length) * 100);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        
        return (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-10 py-10">

                <div className="relative h-48 w-48 flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/5 rounded-full shadow-inner" />
                    <svg className="absolute inset-0 transform -rotate-90">
                        <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                        <circle cx="96" cy="96" r="88" fill="none" 
                            stroke={pct >= 80 ? "#10b981" : pct >= 50 ? "#f97316" : "#ef4444"}
                            strokeWidth="12" strokeLinecap="round"
                            strokeDasharray={`${(pct / 100) * 552.9} 552.9`}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="relative text-center z-10">
                        <div className="text-5xl font-black text-white tracking-tighter">{pct}%</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Global Score</div>
                    </div>
                    {/* Glowing outer ring */}
                    <div className={cn(
                        "absolute inset-0 rounded-full blur-[40px] opacity-20",
                        pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-orange-500" : "bg-red-500"
                    )} />
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Retention Summary</h3>
                    <p className="text-sm text-slate-400 font-medium">Neural processing complete for {questions.length} concepts.</p>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                    {[
                        { icon: Target, label: "Accuracy", value: `${score}/${questions.length}`, color: "text-white" },
                        { icon: Flame, label: "Peak Streak", value: bestStreak, color: "text-orange-500" },
                        { icon: Clock, label: "Sync Time", value: `${elapsed}s`, color: "text-blue-400" },
                    ].map(s => (
                        <div key={s.label} className="glass-card p-4 border-white/5 bg-white/[0.02] flex flex-col items-center gap-2">
                            <s.icon className={cn("h-4 w-4", s.color)} />
                            <span className={cn("text-xl font-black text-white", s.color)}>{s.value}</span>
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={handleRestart}
                        className="glass-pill h-12 px-8 flex items-center gap-2 border-white/10 text-[11px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/5 transition-all">
                        <RotateCcw className="h-4 w-4" /> Reset Sync
                    </button>
                    <button onClick={handleRestart}
                        className="glass-pill h-12 px-8 flex items-center gap-2 border-orange-500/20 bg-orange-500/10 text-[11px] font-black text-orange-400 uppercase tracking-widest hover:bg-orange-500/20 transition-all shadow-xl shadow-orange-500/10">
                        <Trophy className="h-4 w-4" /> Knowledge Base
                    </button>
                </div>
            </motion.div>
        );
    }

    // ── PLAYING SCREEN ───────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-10">
            {/* Header info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</div>
                        <div className="text-sm font-black text-white uppercase tracking-tight">{current.difficulty} Node Synchronization</div>
                    </div>
                </div>
                {streak > 1 && (
                    <div className="glass-pill px-4 py-1.5 border-orange-500/30 bg-orange-500/10 flex items-center gap-2">
                        <Flame className="h-3.5 w-3.5 text-orange-500 animate-bounce" />
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{streak} STREAK</span>
                    </div>
                )}
            </div>

            {/* Neural Progress Bar */}
            <div className="h-2 w-full glass-card border-none bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                />
            </div>

            {/* Main Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-10 border-white/5 bg-white/[0.02]"
                >
                    <div className="text-2xl font-black text-white leading-tight uppercase tracking-tight mb-8">
                        {current.question}
                    </div>

                    <AnimatePresence>
                        {showExplanation && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-8 pt-8 border-t border-white/10"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-4 w-4 text-blue-400" />
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Neural Insight</span>
                                </div>
                                <p className="text-sm text-slate-300 font-medium leading-relaxed italic">
                                    "{current.explanation}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <div className="space-y-3">
                    {current.options.map((option, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrect = idx === current.correctIndex;
                        const revealStatus = showExplanation;

                        return (
                            <button
                                key={idx}
                                disabled={showExplanation}
                                onClick={() => handleSelectOption(idx)}
                                className={cn(
                                    "w-full group relative h-16 rounded-2xl border transition-all flex items-center px-6 gap-4 overflow-hidden",
                                    !revealStatus && "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/20 active:scale-[0.98]",
                                    revealStatus && isCorrect && "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
                                    revealStatus && isSelected && !isCorrect && "bg-red-500/10 border-red-500/50",
                                    revealStatus && !isSelected && !isCorrect && "opacity-20 bg-transparent border-white/5"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                                    !revealStatus && "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white",
                                    revealStatus && isCorrect && "bg-emerald-500 text-white",
                                    revealStatus && isSelected && !isCorrect && "bg-red-500 text-white"
                                )}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className={cn(
                                    "text-sm font-black uppercase tracking-tight flex-1 text-left transition-colors",
                                    !revealStatus && "text-slate-400 group-hover:text-white",
                                    revealStatus && isCorrect && "text-emerald-400",
                                    revealStatus && isSelected && !isCorrect && "text-red-400"
                                )}>
                                    {option}
                                </span>
                                {revealStatus && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                {revealStatus && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                            </button>
                        );
                    })}

                    <AnimatePresence>
                        {showExplanation && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleNext}
                                className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 mt-10 shadow-2xl shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {currentIndex < questions.length - 1 ? (
                                    <>ADVANCE PHASE <ArrowRight className="h-4 w-4" /></>
                                ) : (
                                    <>FINALIZE SYNC <Trophy className="h-4 w-4" /></>
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
