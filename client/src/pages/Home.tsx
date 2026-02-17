import { Navbar } from "@/components/Navbar";
import { useCheatSheets, useUploadCheatSheet, useProcessCheatSheet } from "@/hooks/use-cheatsheets";
import { CheatSheetCard } from "@/components/CheatSheetCard";
import { Dropzone } from "@/components/Dropzone";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, FileText, ArrowRight } from "lucide-react";

export default function Home() {
  const { data: sheets, isLoading } = useCheatSheets();
  const uploadMutation = useUploadCheatSheet();
  const processMutation = useProcessCheatSheet();
  const [, setLocation] = useLocation();

  const handleUpload = async (file: File) => {
    try {
      const result = await uploadMutation.mutateAsync(file);
      // Immediately start processing
      await processMutation.mutateAsync(result.id);
      setLocation(`/cheatsheet/${result.id}`);
    } catch (error) {
      console.error("Upload flow failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfb] pb-20">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-[#9CAF88]/5 blur-3xl" />
        <div className="absolute top-40 left-0 -ml-20 h-[300px] w-[300px] rounded-full bg-[#9CAF88]/10 blur-3xl" />

        <div className="mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4e2cc] bg-white px-4 py-1.5 text-sm font-medium text-[#627352] shadow-sm mb-6">
              <Sparkles className="h-4 w-4 text-[#9CAF88]" />
              <span>AI-Powered Study Assistant</span>
            </div>
            
            <h1 className="font-display text-5xl font-bold tracking-tight text-[#30382a] sm:text-6xl mb-6">
              Turn your messy notes into <br/>
              <span className="text-[#9CAF88]">beautiful cheat sheets</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-[#627352] mb-12 leading-relaxed">
              Upload your handwritten notes, slides, or textbook photos. 
              Our AI extracts the key concepts and organizes them into a 
              perfectly formatted, exam-ready study guide.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-xl"
          >
            <div className="rounded-3xl bg-white p-2 shadow-xl shadow-[#9CAF88]/10 ring-1 ring-[#d4e2cc]">
              <Dropzone onDrop={handleUpload} isUploading={uploadMutation.isPending || processMutation.isPending} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recent Sheets Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecf2e8] text-[#9CAF88]">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold font-display text-[#4c593f]">Recent Sheets</h2>
          </div>
          
          <button className="group flex items-center gap-1 text-sm font-semibold text-[#9CAF88] hover:text-[#7d9169]">
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-[#f0f4ee]" />
            ))}
          </div>
        ) : sheets?.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-[#d4e2cc] bg-white text-center">
            <div className="mb-4 rounded-full bg-[#f7faf5] p-4 text-[#9CAF88]">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#4c593f]">No cheat sheets yet</h3>
            <p className="text-[#627352]">Upload your first document to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sheets?.map((sheet) => (
              <CheatSheetCard key={sheet.id} sheet={sheet} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
