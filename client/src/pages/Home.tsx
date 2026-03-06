import { Navbar } from "@/components/Navbar";
import { useCheatSheets, useUploadCheatSheet, useUploadText, useProcessCheatSheet } from "@/hooks/use-cheatsheets";
import { CheatSheetCard } from "@/components/CheatSheetCard";
import { Dropzone } from "@/components/Dropzone";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, FileText, Brain, Zap, Download, Network, BookOpen } from "lucide-react";
import type { Domain, Layout } from "@shared/schema";

export default function Home() {
  const { data: sheets, isLoading } = useCheatSheets();
  const uploadMutation = useUploadCheatSheet();
  const uploadTextMutation = useUploadText();
  const processMutation = useProcessCheatSheet();
  const [, setLocation] = useLocation();

  const isWorking = uploadMutation.isPending || uploadTextMutation.isPending || processMutation.isPending;

  const handleImageUpload = async (file: File, domain: Domain, layout: Layout) => {
    try {
      const result = await uploadMutation.mutateAsync(file);
      await processMutation.mutateAsync({ id: result.id, domain, layout });
      setLocation(`/cheatsheet/${result.id}`);
    } catch (error) {
      console.error("Image upload flow failed", error);
    }
  };

  const handleTextSubmit = async (text: string, title: string | undefined, domain: Domain, layout: Layout) => {
    try {
      const result = await uploadTextMutation.mutateAsync({ text, title });
      await processMutation.mutateAsync({ id: result.id, domain, layout });
      setLocation(`/cheatsheet/${result.id}`);
    } catch (error) {
      console.error("Text upload flow failed", error);
    }
  };

  const features = [
    { icon: Brain, title: "AI Quiz Generator", desc: "Auto-generate MCQ quizzes from your notes with instant grading & explanations" },
    { icon: Network, title: "Smart Concept Maps", desc: "Interactive SVG maps revealing hidden relationships between concepts" },
    { icon: BookOpen, title: "Key Term Glossary", desc: "Critical terms extracted, defined, and cross-linked for quick review" },
    { icon: Zap, title: "Exam Priority ⭐", desc: "AI marks the most exam-critical concepts automatically" },
    { icon: Download, title: "Multi-Mode Export", desc: "4 study modes + pixel-perfect PNG/PDF cheat sheet export" },
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 -mr-20 -mt-20 h-[600px] w-[600px] rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 left-0 -ml-20 h-[400px] w-[400px] rounded-full bg-teal-300/15 blur-[80px] pointer-events-none"
        />

        <div className="mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/50 backdrop-blur-sm px-4 py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 shadow-sm mb-8">
              <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span className="tracking-wide">AI-POWERED ACADEMIC COMPRESSION</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black font-display text-emerald-950 mb-6 tracking-tight leading-[1.1]">
              Turn your notes into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Visual Knowledge.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-emerald-800 leading-relaxed mb-10 opacity-90 font-medium">
              Upload handwritten notes, slides, or textbooks.
              Our AI transforms them into <span className="text-emerald-600">complete study packages</span>—cheat sheets,
              interactive maps, and smart quizzes—in seconds.
            </p>

            <div className="flex flex-wrap justify-center gap-2.5 mb-12">
              {[
                { label: "Concept Maps", icon: Network },
                { label: "AI Quiz", icon: Brain },
                { label: "Key Terms", icon: BookOpen },
                { label: "Exam Priority ⭐", icon: Zap },
                { label: "PNG / PDF", icon: Download }
              ].map(tag => (
                <span key={tag.label} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white/80 px-4 py-1.5 text-xs font-bold text-emerald-700 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] backdrop-blur-sm">
                  <tag.icon className="h-3 w-3 text-emerald-500" />
                  {tag.label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.25 }} className="mx-auto max-w-2xl">
            <div className="rounded-[40px] bg-white p-3 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.15)] ring-1 ring-emerald-100/50 backdrop-blur-xl">
              <Dropzone
                onDropImage={handleImageUpload}
                onSubmitText={handleTextSubmit}
                isUploading={isWorking}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 text-sm leading-tight">{f.title}</p>
                <p className="text-[11px] text-emerald-600 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Sheets */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
            <FileText className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold font-display text-emerald-900">Recent Sheets</h2>
          {sheets && sheets.length > 0 && (
            <span className="ml-auto text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
              {sheets.length} Sheets
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-emerald-50" />
            ))}
          </div>
        ) : sheets?.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-[40px] border border-dashed border-emerald-200 bg-white text-center p-8">
            <div className="mb-4 rounded-full bg-emerald-50 p-6 text-emerald-500">
              <Sparkles className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-emerald-900">Start your first sheet</h3>
            <p className="text-emerald-600 mt-2 max-w-xs">Upload an image or paste your notes above to see the magic happen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sheets?.map((sheet, i) => <CheatSheetCard key={sheet.id} sheet={sheet} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}
