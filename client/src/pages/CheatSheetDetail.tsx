import { useParams, Link, useLocation } from "wouter";
import { useCheatSheet, useDeleteCheatSheet, useProcessCheatSheet } from "@/hooks/use-cheatsheets";
import { Sidebar } from "@/components/Sidebar";
import { A4Preview, type A4PreviewRef } from "@/components/A4Preview";
import { ConceptMap } from "@/components/ConceptMap";
import { KeyTermsPanel } from "@/components/KeyTermsPanel";
import { QuizMode } from "@/components/QuizMode";
import {
  Loader2, AlertCircle, ArrowLeft, Image as ImageIcon, CheckCircle2,
  FileText, Network, BookOpen, Brain, Layers, Trash2, RefreshCw, Sparkles,
  Home, MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ViewMode = "cheatsheet" | "conceptmap" | "keyterms" | "quiz" | "original";

const OCR_STEPS = [
  "Payload Received",
  "AI Vision Analytical Phase",
  "Neural Extraction",
  "Concept Mapping",
  "Synthesizing Assessment",
  "Finalizing Canvas"
];

const VIEW_TABS: { key: ViewMode; label: string; icon: React.ElementType }[] = [
  { key: "cheatsheet", label: "Cheat Sheet", icon: Layers },
  { key: "conceptmap", label: "Concept Map", icon: Network },
  { key: "keyterms", label: "Key Terms", icon: BookOpen },
  { key: "quiz", label: "Quiz Mode", icon: Brain },
  { key: "original", label: "Original Scan", icon: ImageIcon },
];

export default function CheatSheetDetail({ onAskAI }: { onAskAI?: () => void }) {
  const { id } = useParams<{ id: string }>();
  const { data: sheet, isLoading, error } = useCheatSheet(Number(id));
  const { toast } = useToast();
  const deleteMutation = useDeleteCheatSheet();
  const processMutation = useProcessCheatSheet();
  const [, setLocation] = useLocation();
  const [activeMode, setActiveMode] = useState<ViewMode>("cheatsheet");
  const [activeStep, setActiveStep] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const previewRef = useRef<A4PreviewRef>(null);

  useEffect(() => {
    if (!sheet || sheet.structuredContent) return;
    const timer = setInterval(() => {
      setActiveStep(s => (s < OCR_STEPS.length - 1 ? s + 1 : s));
    }, 4000);
    return () => clearInterval(timer);
  }, [sheet]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8FB] dark:bg-[#0E0E14] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
        <h2 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">Initializing neural canvas...</h2>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="min-h-screen bg-[#F8F8FB] dark:bg-[#0E0E14] flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-md w-full p-8 rounded-2xl border border-[#E4E4EF] dark:border-[#2A2A38] bg-white dark:bg-[#16161F]">
          <div className="mx-auto w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-2 tracking-tight">Access Denied</h2>
          <p className="text-sm text-[#94A3B8] dark:text-[#64748B] mb-8">This collection might have been moved or discarded.</p>
          <Link href="/">
            <button className="btn-primary w-full px-6 py-2.5 text-sm">Return to Dashboard</button>
          </Link>
        </div>
      </div>
    );
  }

  const isProcessing = !sheet.structuredContent;
  const isTextInput = sheet.originalImageUrl === "text-input";
  const content = sheet.structuredContent;

  const hasConceptMap = (content?.conceptMap?.nodes?.length ?? 0) > 0;
  const hasKeyTerms = (content?.keyTerms?.length ?? 0) > 0;
  const hasQuiz = (content?.quiz?.questions?.length ?? 0) > 0;

  const handleDelete = () => {
    deleteMutation.mutate(sheet.id, {
      onSuccess: () => setLocation("/"),
    });
  };

  const handleReprocess = () => {
    processMutation.mutate({
      id: sheet.id,
      domain: content?.domain || "general",
      layout: content?.layout || "grid",
    });
  };

  const handleAction = (actionId: string) => {
    if (actionId === "pdf-export") {
      previewRef.current?.downloadPDF();
    } else if (actionId === "ask-ai") {
      onAskAI?.();
    } else if (VIEW_TABS.some(tab => tab.key === actionId)) {
      setActiveMode(actionId as ViewMode);
    }
  };

  const sidebarItems = [
    { id: "my-sheets", label: "My Sheets", icon: Home, path: "/" },
    ...VIEW_TABS.map(tab => ({
      id: tab.key,
      label: tab.label,
      icon: tab.icon,
      action: tab.key,
      disabled: (tab.key === "conceptmap" && !hasConceptMap) ||
                (tab.key === "keyterms" && !hasKeyTerms) ||
                (tab.key === "quiz" && !hasQuiz)
    })),
    { id: "pdf-export", label: "PDF Export", icon: Layers, action: "pdf-export" },
    { id: "ask-ai", label: "Ask AI", icon: MessageSquare, action: "ask-ai" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F8FB] dark:bg-[#0E0E14] text-[#0F172A] dark:text-[#F1F5F9]">
      <Sidebar 
        onAction={handleAction} 
        items={sidebarItems.map(item => ({
          ...item,
          // Disable items if no content available (handled in UI via isDisabled before, now we need to handle in Sidebar or just here)
          // For now, let's keep it simple.
        }))}
      />

      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="h-20 flex items-center justify-between px-8 border-b border-[#E4E4EF] dark:border-[#2A2A38] bg-[#F8F8FB] dark:bg-[#0E0E14] sticky top-0 z-30">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/">
              <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <h1 className="text-lg font-semibold tracking-tight truncate max-w-[400px]">{sheet.title}</h1>
          </div>

          <div className="flex items-center gap-3">
             {!isProcessing && (
              <button
                onClick={handleReprocess}
                disabled={processMutation.isPending}
                className="btn-secondary flex items-center gap-2 px-4 py-1.5 text-xs font-semibold"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", processMutation.isPending && "animate-spin")} />
                Reprocess
              </button>
            )}

            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 bg-red-500/10 p-1 rounded-lg border border-red-500/20">
                <button
                  onClick={handleDelete}
                  className="rounded-md bg-red-500 px-3 py-1 text-[10px] font-bold text-white hover:bg-red-600 transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 text-[10px] font-semibold text-[#94A3B8] dark:text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        <div className="p-8 space-y-8">
          {isProcessing ? (
            <div className="max-w-3xl mx-auto py-20 px-8 text-center space-y-12">
              <div className="flex justify-center">
                <div className="relative h-20 w-20 flex items-center justify-center">
                   <div className="absolute inset-0 bg-orange-500/10 rounded-2xl animate-pulse" />
                   <Sparkles className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold tracking-tight">AI Vision Synthesis</h2>
                <p className="text-[#94A3B8] dark:text-[#64748B] text-sm max-w-sm mx-auto">
                  Transforming your study materials into a multi-dimensional knowledge package.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                {OCR_STEPS.map((step, i) => (
                  <div
                    key={step}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      i < activeStep ? "bg-orange-500/5 border-orange-500/20 text-orange-500" :
                      i === activeStep ? "bg-black/5 dark:bg-white/5 border-[#F97316]/30 text-[#0F172A] dark:text-[#F1F5F9] shadow-sm" :
                      "bg-transparent border-[#E4E4EF] dark:border-[#2A2A38] text-[#94A3B8] dark:text-[#64748B] opacity-50"
                    )}
                  >
                    {i < activeStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                     i === activeStep ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 
                     <div className="h-3.5 w-3.5 rounded-full border border-current opacity-20" />}
                    <span className="text-[11px] font-semibold uppercase tracking-wider">{step}</span>
                  </div>
                ))}
              </div>

              <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden max-w-md mx-auto">
                 <motion.div
                  className="h-full bg-orange-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((activeStep + 1) / OCR_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Feature Content Area */}
              <div className="lg:col-span-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMode}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-[#E4E4EF] dark:border-[#2A2A38] bg-white dark:bg-[#16161F] shadow-sm min-h-[800px] overflow-hidden"
                  >
                    {activeMode === "cheatsheet" && <A4Preview ref={previewRef} data={content!} />}
                    {activeMode === "conceptmap" && hasConceptMap && <ConceptMap data={content!.conceptMap!} />}
                    {activeMode === "keyterms" && hasKeyTerms && <KeyTermsPanel terms={content!.keyTerms!} />}
                    {activeMode === "quiz" && hasQuiz && <QuizMode quiz={content!.quiz!} />}
                    {activeMode === "original" && (
                      <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            {isTextInput ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest">{isTextInput ? "Text Input Source" : "Original Scan"}</h3>
                            <p className="text-xs text-[#94A3B8] dark:text-[#64748B]">The source material used to generate your neural canvas.</p>
                          </div>
                        </div>

                        {isTextInput ? (
                          <div className="flex-1 rounded-2xl bg-[#F8F8FB] dark:bg-[#0E0E14] border border-[#E4E4EF] dark:border-[#2A2A38] p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap text-[#64748B]">
                            {sheet.ocrText}
                          </div>
                        ) : (
                          <div className="flex-1 rounded-2xl overflow-hidden border border-[#E4E4EF] dark:border-[#2A2A38] bg-black/5 flex items-center justify-center">
                            <img 
                              src={sheet.originalImageUrl} 
                              className="max-w-full max-h-full object-contain grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
                              alt="Original study material"
                            />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: "Sections", val: content!.sections.length, icon: Layers },
                            { label: "Concepts", val: content!.conceptMap?.nodes.length || 0, icon: Network },
                            { label: "Key Terms", val: content!.keyTerms?.length || 0, icon: BookOpen },
                            { label: "Quiz Count", val: content!.quiz?.questions.length || 0, icon: Brain }
                          ].map(m => (
                            <div key={m.label} className="p-4 rounded-xl border border-[#E4E4EF] dark:border-[#2A2A38] bg-[#F8F8FB] dark:bg-[#0E0E14]">
                              <div className="flex items-center gap-2 text-[#94A3B8] dark:text-[#64748B] mb-1">
                                <m.icon className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                              </div>
                              <div className="text-xl font-black text-orange-500">{m.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
