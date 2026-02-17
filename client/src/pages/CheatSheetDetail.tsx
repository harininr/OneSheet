import { useParams, Link } from "wouter";
import { useCheatSheet } from "@/hooks/use-cheatsheets";
import { Navbar } from "@/components/Navbar";
import { A4Preview } from "@/components/A4Preview";
import { Loader2, AlertCircle, ArrowLeft, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CheatSheetDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: sheet, isLoading, error } = useCheatSheet(Number(id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfdfb]">
        <Navbar />
        <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center pt-16">
          <Loader2 className="h-12 w-12 animate-spin text-[#9CAF88]" />
          <h2 className="mt-6 font-display text-2xl font-bold text-[#4c593f]">Analyzing Content...</h2>
          <p className="mt-2 max-w-sm text-center text-[#627352]">
            We're extracting text, summarizing key points, and designing your cheat sheet. This might take a minute.
          </p>
          
          <div className="mt-8 flex gap-3">
             <div className="h-2 w-2 rounded-full bg-[#9CAF88] animate-bounce" style={{ animationDelay: '0ms' }} />
             <div className="h-2 w-2 rounded-full bg-[#9CAF88] animate-bounce" style={{ animationDelay: '150ms' }} />
             <div className="h-2 w-2 rounded-full bg-[#9CAF88] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="min-h-screen bg-[#fcfdfb]">
        <Navbar />
        <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center pt-16">
          <div className="rounded-full bg-red-50 p-4 text-red-500 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#30382a]">Something went wrong</h2>
          <p className="mt-2 text-[#627352]">We couldn't load this cheat sheet.</p>
          <Link href="/">
            <button className="btn-primary mt-6">Go Home</button>
          </Link>
        </div>
      </div>
    );
  }

  const isProcessing = !sheet.structuredContent;

  return (
    <div className="min-h-screen bg-[#fcfdfb]">
      <Navbar />
      
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm font-medium text-[#627352] transition-colors hover:text-[#9CAF88]">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </Link>
          
          {sheet.createdAt && (
            <span className="text-sm text-[#9CAF88] font-medium">
              Generated {new Date(sheet.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[#d4e2cc] shadow-sm">
            <Loader2 className="h-16 w-16 animate-spin text-[#9CAF88] mb-6" />
            <h2 className="text-2xl font-bold font-display text-[#4c593f]">Generative AI at work</h2>
            <p className="text-[#627352] mt-2">Processing your upload...</p>
            
            <div className="mt-8 w-full max-w-md space-y-4">
              <div className="flex items-center gap-3 text-sm text-[#627352]">
                <CheckCircle2 className="h-5 w-5 text-[#9CAF88]" />
                <span>Upload received</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#3c4633] font-medium">
                <Loader2 className="h-5 w-5 animate-spin text-[#9CAF88]" />
                <span>Extracting text (OCR)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#d4e2cc]">
                <div className="h-5 w-5 rounded-full border-2 border-[#d4e2cc]" />
                <span>Summarizing content</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#d4e2cc]">
                <div className="h-5 w-5 rounded-full border-2 border-[#d4e2cc]" />
                <span>Generating layout</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Source Image & Details */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-2xl border border-[#d4e2cc] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#9CAF88]" />
                  <h3 className="font-bold text-[#4c593f]">Source Image</h3>
                </div>
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#f7faf5] border border-[#ecf2e8]">
                  <img 
                    src={sheet.originalImageUrl} 
                    alt="Original Upload" 
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#d4e2cc] bg-[#f7faf5] p-6 shadow-sm">
                <h3 className="mb-2 font-bold text-[#4c593f]">Extracted Text</h3>
                <p className="text-xs text-[#627352] mb-4">
                  Raw text extracted via OCR before processing.
                </p>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-[#d4e2cc] bg-white p-4 text-xs leading-relaxed text-[#3c4633] font-mono">
                  {sheet.ocrText || "No text extracted yet."}
                </div>
              </div>
            </div>

            {/* Right Column: Generated Preview */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <A4Preview data={sheet.structuredContent!} />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
