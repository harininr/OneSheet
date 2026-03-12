import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { UploadZone } from "@/components/UploadZone";
import { ControlsRow } from "@/components/ControlsRow";
import { useUploadCheatSheet, useUploadText, useProcessCheatSheet } from "@/hooks/use-cheatsheets";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import type { Domain, Layout } from "@shared/schema";

export default function Create() {
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
      console.error("Creation flow (image) failed", error);
    }
  };

  const handleTextSubmit = async () => {
    if (text.trim().length < 10) return;
    try {
      const result = await uploadTextMutation.mutateAsync({ text: text.trim(), title: title.trim() || undefined });
      await processMutation.mutateAsync({ id: result.id, domain, layout });
      setLocation(`/cheatsheet/${result.id}`);
    } catch (error) {
      console.error("Creation flow (text) failed", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F8FB] dark:bg-[#0E0E14] text-[#0F172A] dark:text-[#F1F5F9]">
      <Sidebar />

      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="h-20 flex items-center justify-between px-8 border-b border-[#E4E4EF] dark:border-[#2A2A38] bg-[#F8F8FB] dark:bg-[#0E0E14] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">Create New Sheet</h1>
          </div>
        </header>

        <div className="p-10 max-w-4xl mx-auto w-full space-y-12">
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Forge New Knowledge</h2>
              <p className="text-sm text-[#94A3B8] dark:text-[#64748B]">
                Upload study material or paste notes to generate an interactive neural package.
              </p>
            </div>

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
        </div>
      </main>
    </div>
  );
}
