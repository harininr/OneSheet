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
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute top-40 left-0 -ml-20 h-[300px] w-[300px] rounded-full bg-emerald-300/15 blur-3xl" />

        <div className="mx-auto max-w-4xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-sm font-medium text-emerald-700 shadow-sm mb-6">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>Domain-Intelligent Compression</span>
            </div>

            <h1 className="font-display text-5xl font-bold tracking-tight text-emerald-950 sm:text-6xl mb-6">
              Turn messy notes into <br />
              <span className="text-emerald-500">one perfect cheat sheet</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-emerald-700 mb-4 leading-relaxed">
              Upload notes or paste text. AI generates a <strong>complete study package</strong> —
              cheat sheet, concept map, key terms glossary, and interactive quiz. All in one click.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {["Concept Maps", "AI Quiz", "Key Terms", "Exam Priority ⭐", "Multi-Mode", "PNG / PDF"].map(tag => (
                <span key={tag} className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }} className="mx-auto max-w-xl">
            <div className="rounded-3xl bg-white p-2 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-200">
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
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900 text-sm">{f.title}</p>
                <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">{f.desc}</p>
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
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-emerald-50" />
            ))}
          </div>
        ) : sheets?.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-white text-center">
            <div className="mb-4 rounded-full bg-emerald-50 p-4 text-emerald-500">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900">No cheat sheets yet</h3>
            <p className="text-emerald-600">Select a domain, then upload an image or paste notes!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sheets?.map(sheet => <CheatSheetCard key={sheet.id} sheet={sheet} />)}
          </div>
        )}
      </section>
    </div>
  );
}
