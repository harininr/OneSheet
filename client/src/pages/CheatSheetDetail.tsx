import { useParams, Link } from "wouter";
import { useCheatSheet, useDeleteCheatSheet } from "@/hooks/use-cheatsheets";
import { Navbar } from "@/components/Navbar";
import { A4Preview } from "@/components/A4Preview";
import { ConceptMap } from "@/components/ConceptMap";
import { KeyTermsPanel } from "@/components/KeyTermsPanel";
import { QuizMode } from "@/components/QuizMode";
import {
  Loader2, AlertCircle, ArrowLeft, Image as ImageIcon, CheckCircle2,
  FileText, Network, BookOpen, Brain, Layers, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type ViewMode = "cheatsheet" | "conceptmap" | "keyterms" | "quiz";

const OCR_STEPS = [
  "Upload received",
  "AI Vision reading your notes ✍️",
  "Generating cheat sheet",
  "Building concept map",
  "Extracting key terms",
  "Creating quiz questions",
  "Rendering results",
];

const VIEW_TABS: { key: ViewMode; label: string; icon: React.ElementType; gradient: string }[] = [
  { key: "cheatsheet", label: "Cheat Sheet", icon: Layers, gradient: "from-emerald-500 to-teal-600" },
  { key: "conceptmap", label: "Concept Map", icon: Network, gradient: "from-cyan-500 to-blue-600" },
  { key: "keyterms", label: "Key Terms", icon: BookOpen, gradient: "from-amber-500 to-orange-600" },
  { key: "quiz", label: "Quiz Mode", icon: Brain, gradient: "from-violet-500 to-purple-600" },
];

export default function CheatSheetDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: sheet, isLoading, error } = useCheatSheet(Number(id));
  const deleteMutation = useDeleteCheatSheet();
  const [activeMode, setActiveMode] = useState<ViewMode>("cheatsheet");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center pt-16">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
          <h2 className="mt-6 font-display text-2xl font-bold text-emerald-900">Loading...</h2>
        </div>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center pt-16">
          <div className="rounded-full bg-red-50 p-4 text-red-500 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold text-emerald-950">Something went wrong</h2>
          <p className="mt-2 text-emerald-600">We couldn't load this cheat sheet.</p>
          <Link href="/">
            <button className="btn-primary mt-6">Go Home</button>
          </Link>
        </div>
      </div>
    );
  }

  const isProcessing = !sheet.structuredContent;
  const isTextInput = sheet.originalImageUrl === "text-input";
  const content = sheet.structuredContent;

  const hasConceptMap = content?.conceptMap && content.conceptMap.nodes.length > 0;
  const hasKeyTerms = content?.keyTerms && content.keyTerms.length > 0;
  const hasQuiz = content?.quiz && content.quiz.questions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/20 to-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-500">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </Link>

          <div className="flex items-center gap-3">
            {sheet.createdAt && (
              <span className="text-sm text-emerald-500 font-medium">
                Generated {new Date(sheet.createdAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric"
                })}
              </span>
            )}
          </div>
        </div>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-emerald-200 shadow-sm">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full border-4 border-emerald-100 animate-pulse" />
              <Loader2 className="absolute inset-0 m-auto h-10 w-10 animate-spin text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold font-display text-emerald-900">AI at work</h2>
            <p className="text-emerald-600 mt-2">Building your complete study package...</p>

            <div className="mt-8 w-full max-w-sm space-y-3">
              {OCR_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3 text-sm">
                  {i === 0 ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                  ) : i === 1 ? (
                    <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-emerald-500" />
                  ) : (
                    <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-emerald-200" />
                  )}
                  <span className={i <= 1 ? "text-emerald-900 font-medium" : "text-emerald-200"}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── Mode Tabs ── */}
            <div className="mb-8 flex flex-wrap gap-2">
              {VIEW_TABS.map(tab => {
                const isActive = activeMode === tab.key;
                const isDisabled =
                  (tab.key === "conceptmap" && !hasConceptMap) ||
                  (tab.key === "keyterms" && !hasKeyTerms) ||
                  (tab.key === "quiz" && !hasQuiz);

                return (
                  <button
                    key={tab.key}
                    onClick={() => !isDisabled && setActiveMode(tab.key)}
                    disabled={isDisabled}
                    className={`relative flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                      : isDisabled
                        ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                        : "bg-white border border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:shadow-sm"
                      }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl bg-white/10"
                        transition={{ type: "spring", bounce: 0.2 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              {/* Left Sidebar */}
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    {isTextInput ? (
                      <FileText className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-emerald-500" />
                    )}
                    <h3 className="font-bold text-emerald-900">
                      {isTextInput ? "Text Input" : "Source Image"}
                    </h3>
                  </div>

                  {isTextInput ? (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-900 font-mono max-h-48 overflow-y-auto">
                      {sheet.ocrText || "No content."}
                    </div>
                  ) : (
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-emerald-50 border border-emerald-100">
                      <img
                        src={sheet.originalImageUrl}
                        alt="Original Upload"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {!isTextInput && sheet.ocrText && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                    <h3 className="mb-2 font-bold text-emerald-900">Extracted Text</h3>
                    <p className="text-xs text-emerald-600 mb-3">
                      Raw OCR text before AI compression.
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-emerald-200 bg-white p-4 text-xs leading-relaxed text-emerald-900 font-mono">
                      {sheet.ocrText}
                    </div>
                  </div>
                )}

                {/* Sheet info */}
                <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-emerald-900 mb-3">Study Package</h3>
                  <div className="space-y-2 text-xs text-emerald-600">
                    <div className="flex justify-between">
                      <span>Sections</span>
                      <span className="font-semibold text-emerald-900">{content!.sections.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Key Points</span>
                      <span className="font-semibold text-emerald-900">
                        {content!.sections.reduce((acc, s) => acc + s.points.length, 0)}
                      </span>
                    </div>
                    {hasConceptMap && (
                      <div className="flex justify-between">
                        <span>Concepts</span>
                        <span className="font-semibold text-emerald-900">{content!.conceptMap!.nodes.length}</span>
                      </div>
                    )}
                    {hasKeyTerms && (
                      <div className="flex justify-between">
                        <span>Key Terms</span>
                        <span className="font-semibold text-emerald-900">{content!.keyTerms!.length}</span>
                      </div>
                    )}
                    {hasQuiz && (
                      <div className="flex justify-between">
                        <span>Quiz Questions</span>
                        <span className="font-semibold text-emerald-900">{content!.quiz!.questions.length}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>AI model</span>
                      <span className="font-semibold text-emerald-900">Gemini 2.5 Flash</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source type</span>
                      <span className="font-semibold text-emerald-900">{isTextInput ? "Text" : "Image (OCR)"}</span>
                    </div>
                  </div>
                </div>

                {/* Feature availability badges */}
                <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-emerald-900 mb-3">Available Modes</h3>
                  <div className="space-y-2">
                    {VIEW_TABS.map(tab => {
                      const available =
                        tab.key === "cheatsheet" ||
                        (tab.key === "conceptmap" && hasConceptMap) ||
                        (tab.key === "keyterms" && hasKeyTerms) ||
                        (tab.key === "quiz" && hasQuiz);

                      return (
                        <div key={tab.key} className="flex items-center gap-2 text-xs">
                          {available ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-200" />
                          )}
                          <span className={available ? "text-emerald-900 font-medium" : "text-gray-300"}>
                            {tab.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMode}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeMode === "cheatsheet" && (
                      <A4Preview data={content!} />
                    )}

                    {activeMode === "conceptmap" && hasConceptMap && (
                      <ConceptMap data={content!.conceptMap!} />
                    )}

                    {activeMode === "keyterms" && hasKeyTerms && (
                      <KeyTermsPanel terms={content!.keyTerms!} />
                    )}

                    {activeMode === "quiz" && hasQuiz && (
                      <QuizMode quiz={content!.quiz!} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
