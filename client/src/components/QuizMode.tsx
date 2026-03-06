import { useState, useMemo, useCallback } from "react";
import type { Quiz as QuizType, QuizQuestion } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain, CheckCircle2, XCircle, ArrowRight, RotateCcw,
    Trophy, Target, Flame, Clock, Sparkles, ChevronRight
} from "lucide-react";

interface QuizModeProps {
    quiz: QuizType;
}

type QuizState = "intro" | "playing" | "review" | "results";

const DIFFICULTY_COLORS = {
    easy: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
    medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    hard: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

export function QuizMode({ quiz }: QuizModeProps) {
    const [state, setState] = useState<QuizState>("intro");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, number>>(new Map());
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [startTime] = useState(Date.now());

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
    const progress = (totalAnswered / questions.length) * 100;

    const handleSelectOption = useCallback((optionIndex: number) => {
        if (showExplanation) return;
        setSelectedOption(optionIndex);
        setShowExplanation(true);
        setAnswers(prev => {
            const next = new Map(prev);
            next.set(current.id, optionIndex);
            return next;
        });
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
    }, []);

    const handleReview = useCallback(() => {
        setCurrentIndex(0);
        setState("review");
    }, []);

    const getGrade = (pct: number) => {
        if (pct >= 90) return { label: "A+", color: "text-emerald-600", bg: "bg-emerald-50", emoji: "🏆", message: "Outstanding! You've mastered this topic!" };
        if (pct >= 80) return { label: "A", color: "text-emerald-600", bg: "bg-emerald-50", emoji: "🌟", message: "Excellent work! Almost perfect!" };
        if (pct >= 70) return { label: "B", color: "text-blue-600", bg: "bg-blue-50", emoji: "💪", message: "Great job! You know this material well." };
        if (pct >= 60) return { label: "C", color: "text-amber-600", bg: "bg-amber-50", emoji: "📚", message: "Good effort! Review the marked sections." };
        return { label: "D", color: "text-red-600", bg: "bg-red-50", emoji: "🔄", message: "Keep studying! Try again after reviewing." };
    };

    if (!questions.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-emerald-400">
                <Brain className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium">No quiz available</p>
            </div>
        );
    }

    // ── INTRO SCREEN ─────────────────────────────────────────────────────────
    if (state === "intro") {
        const diffCounts = { easy: 0, medium: 0, hard: 0 };
        questions.forEach(q => diffCounts[q.difficulty]++);

        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6 py-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-violet-500/30">
                    <Brain className="h-10 w-10" />
                </div>

                <div className="text-center">
                    <h3 className="text-2xl font-bold text-emerald-900 mb-2">Test Your Knowledge</h3>
                    <p className="text-sm text-emerald-600 max-w-md">
                        {questions.length} questions generated from your study material.
                        See how well you understand the concepts!
                    </p>
                </div>

                <div className="flex gap-4">
                    {Object.entries(diffCounts).filter(([, c]) => c > 0).map(([diff, count]) => {
                        const style = DIFFICULTY_COLORS[diff as keyof typeof DIFFICULTY_COLORS];
                        return (
                            <div key={diff} className={`flex items-center gap-2 rounded-xl border ${style.border} ${style.bg} px-4 py-2`}>
                                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                <span className={`text-xs font-bold ${style.text} uppercase`}>{diff}</span>
                                <span className={`text-sm font-black ${style.text}`}>{count}</span>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => setState("playing")}
                    className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Sparkles className="h-4 w-4" />
                    Start Quiz
                    <ChevronRight className="h-4 w-4" />
                </button>
            </motion.div>
        );
    }

    // ── RESULTS SCREEN ───────────────────────────────────────────────────────
    if (state === "results") {
        const pct = Math.round((score / questions.length) * 100);
        const grade = getGrade(pct);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 py-6">

                <div className="text-6xl mb-2">{grade.emoji}</div>

                <div className="text-center">
                    <h3 className="text-3xl font-black text-emerald-900 mb-1">Quiz Complete!</h3>
                    <p className="text-sm text-emerald-600">{grade.message}</p>
                </div>

                {/* Score indicator */}
                <div className="relative">
                    <svg width="180" height="180" viewBox="0 0 180 180">
                        <circle cx="90" cy="90" r="80" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle cx="90" cy="90" r="80" fill="none" stroke={pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${(pct / 100) * 502.65} 502.65`}
                            transform="rotate(-90 90 90)"
                            style={{ transition: "stroke-dasharray 1s ease" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-black ${grade.color}`}>{pct}%</span>
                        <span className={`text-sm font-bold ${grade.color} px-3 py-0.5 rounded-full ${grade.bg}`}>{grade.label}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                    {[
                        { icon: Target, label: "Correct", value: `${score}/${questions.length}`, color: "text-emerald-600" },
                        { icon: Flame, label: "Accuracy", value: `${pct}%`, color: "text-amber-600" },
                        { icon: Clock, label: "Time", value: `${minutes}:${seconds.toString().padStart(2, "0")}`, color: "text-blue-600" },
                    ].map(s => (
                        <div key={s.label} className="flex flex-col items-center rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
                            <s.icon className={`h-4 w-4 ${s.color} mb-1`} />
                            <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                            <span className="text-[10px] text-emerald-400 font-medium">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button onClick={handleReview}
                        className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                        <Target className="h-4 w-4" />
                        Review Answers
                    </button>
                    <button onClick={handleRestart}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl">
                        <RotateCcw className="h-4 w-4" />
                        Try Again
                    </button>
                </div>
            </motion.div>
        );
    }

    // ── PLAYING / REVIEW SCREEN ──────────────────────────────────────────────
    const isReview = state === "review";
    const reviewAnswer = isReview ? answers.get(current.id) : undefined;
    const isCorrectReview = reviewAnswer === current.correctIndex;

    return (
        <div className="flex flex-col gap-4">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-emerald-100 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <span className="text-xs font-bold text-emerald-500">
                    {currentIndex + 1}/{questions.length}
                </span>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
                >
                    {/* Question header */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${DIFFICULTY_COLORS[current.difficulty].bg
                                    } ${DIFFICULTY_COLORS[current.difficulty].text} ${DIFFICULTY_COLORS[current.difficulty].border}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full mr-1 ${DIFFICULTY_COLORS[current.difficulty].dot}`} />
                                    {current.difficulty.toUpperCase()}
                                </span>
                                <span className="text-[10px] font-medium text-emerald-400">
                                    {current.relatedSection}
                                </span>
                            </div>
                            <h4 className="text-base font-bold text-emerald-900 leading-relaxed">{current.question}</h4>
                        </div>

                        {isReview && (
                            <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl ${isCorrectReview ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                }`}>
                                {isCorrectReview ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                            </div>
                        )}
                    </div>

                    {/* Options */}
                    <div className="space-y-2.5 mb-4">
                        {current.options.map((option, optIdx) => {
                            const isSelected = isReview ? reviewAnswer === optIdx : selectedOption === optIdx;
                            const isCorrect = optIdx === current.correctIndex;
                            const showResult = isReview || (showExplanation && isSelected);
                            const showCorrectHighlight = (isReview || showExplanation) && isCorrect;

                            let borderColor = "border-emerald-100 hover:border-emerald-300";
                            let bgColor = "bg-white";

                            if (showResult && isSelected && isCorrect) {
                                borderColor = "border-green-400"; bgColor = "bg-green-50";
                            } else if (showResult && isSelected && !isCorrect) {
                                borderColor = "border-red-400"; bgColor = "bg-red-50";
                            } else if (showCorrectHighlight) {
                                borderColor = "border-green-300"; bgColor = "bg-green-50/50";
                            }

                            return (
                                <button
                                    key={optIdx}
                                    onClick={() => !isReview && handleSelectOption(optIdx)}
                                    disabled={isReview || showExplanation}
                                    className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${borderColor} ${bgColor} ${!isReview && !showExplanation ? "cursor-pointer hover:shadow-sm" : ""
                                        }`}
                                >
                                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isSelected ? (isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white") :
                                            showCorrectHighlight ? "bg-green-500 text-white" :
                                                "bg-emerald-50 text-emerald-600"
                                        }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="text-sm text-emerald-900 font-medium flex-1">{option}</span>
                                    {showResult && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                                    {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    <AnimatePresence>
                        {(showExplanation || isReview) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-2"
                            >
                                <p className="text-xs font-bold text-blue-700 mb-1">💡 Explanation</p>
                                <p className="text-sm text-blue-800 leading-relaxed">{current.explanation}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                {isReview ? (
                    <>
                        <button
                            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-30"
                        >
                            Previous
                        </button>
                        <button onClick={() => setState("results")}
                            className="text-xs text-emerald-500 font-medium hover:text-emerald-700">
                            Back to Results
                        </button>
                        <button
                            onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                            disabled={currentIndex === questions.length - 1}
                            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-30"
                        >
                            Next
                        </button>
                    </>
                ) : (
                    <>
                        <div className="text-xs text-emerald-400 font-medium">
                            Score: <span className="font-bold text-emerald-600">{score}</span>/{totalAnswered}
                        </div>
                        {showExplanation && (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {currentIndex < questions.length - 1 ? (
                                    <>Next Question <ArrowRight className="h-4 w-4" /></>
                                ) : (
                                    <>See Results <Trophy className="h-4 w-4" /></>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
