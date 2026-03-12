import { useState } from "react";
import { useCheatSheets, useUploadCheatSheet, useUploadText, useProcessCheatSheet } from "@/hooks/use-cheatsheets";
import { CheatSheetCard } from "@/components/CheatSheetCard";
import { Sidebar } from "@/components/Sidebar";
import { UploadZone } from "@/components/UploadZone";
import { ControlsRow } from "@/components/ControlsRow";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Plus, LayoutGrid, FileText } from "lucide-react";
import type { Domain, Layout } from "@shared/schema";

export default function Home({ onAskAI }: { onAskAI?: () => void }) {
  const { data: sheets, isLoading } = useCheatSheets();
  const uploadMutation = useUploadCheatSheet();
  const uploadTextMutation = useUploadText();
  const processMutation = useProcessCheatSheet();
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<"image" | "text">("image");
  const [domain, setDomain] = useState<Domain>("general");
  const [layout, setLayout] = useState<Layout>("grid");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const isWorking = uploadMutation.isPending || uploadTextMutation.isPending || processMutation.isPending;

  const handleImageUpload = async (file: File) => {
    try {
      const result = await uploadMutation.mutateAsync(file);
      await processMutation.mutateAsync({ id: result.id, domain, layout });
      setLocation(`/cheatsheet/${result.id}`);
    } catch (error) {
      console.error("Image upload flow failed", error);
    }
  };

  const handleTextSubmit = async () => {
    if (text.trim().length < 10) return;
    try {
      const result = await uploadTextMutation.mutateAsync({ text: text.trim(), title: title.trim() || undefined });
      await processMutation.mutateAsync({ id: result.id, domain, layout });
      setLocation(`/cheatsheet/${result.id}`);
    } catch (error) {
      console.error("Text upload flow failed", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F8FB] dark:bg-[#0E0E14] text-[#0F172A] dark:text-[#F1F5F9]">
      {/* Sidebar - Fixed 260px (w-64) */}
      <Sidebar onAction={(id) => id === "ask-ai" && onAskAI?.()} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-[#E4E4EF] dark:border-[#2A2A38] bg-[#F8F8FB] dark:bg-[#0E0E14] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          </div>
          <Link href="/create">
            <button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Sheet
            </button>
          </Link>
        </header>

        <div className="p-10 space-y-12 max-w-5xl mx-auto w-full">
          {/* Controls Section */}
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mode Toggle Pills Style */}
            <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-lg w-fit">
              <button
                onClick={() => setMode("image")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === "image" ? "bg-white dark:bg-[#16161F] text-orange-500 shadow-sm" : "text-[#94A3B8] dark:text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
                }`}
              >
                Image Upload
              </button>
              <button
                onClick={() => setMode("text")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mode === "text" ? "bg-white dark:bg-[#16161F] text-orange-500 shadow-sm" : "text-[#94A3B8] dark:text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
                }`}
              >
                Text Input
              </button>
            </div>

            <ControlsRow
              domain={domain}
              setDomain={setDomain}
              layout={layout}
              setLayout={setLayout}
              isUploading={isWorking}
            />
          </section>

          {/* Upload Zone Section */}
          <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            <UploadZone
              mode={mode}
              onDropImage={handleImageUpload}
              text={text}
              setText={setText}
              title={title}
              setTitle={setTitle}
              handleTextSubmit={handleTextSubmit}
              isUploading={isWorking}
            />
          </section>

          {/* Recent Sheets Section */}
          <section className="pt-12 border-t border-[#E4E4EF] dark:border-[#2A2A38] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <h4 className="section-label">Recent neural packages</h4>
              </div>
              {sheets && sheets.length > 0 && (
                <span className="text-xs font-medium text-[#94A3B8] dark:text-[#64748B] px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full">
                  {sheets.length} Sheets
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 animate-pulse rounded-xl bg-black/5 dark:bg-white/5 border border-[#E4E4EF] dark:border-[#2A2A38]" />
                ))}
              </div>
            ) : sheets?.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E4E4EF] dark:border-[#2A2A38] bg-black/[0.01] dark:bg-white/[0.01] text-center p-8">
                <FileText className="h-10 w-10 text-[#94A3B8] dark:text-[#64748B] mb-4 opacity-20" />
                <h3 className="text-lg font-semibold mb-1">No study sheets yet</h3>
                <p className="text-sm text-[#94A3B8] dark:text-[#64748B]">Start by uploading your first notes above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {sheets?.map((sheet, i) => <CheatSheetCard key={sheet.id} sheet={sheet} index={i} />)}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
