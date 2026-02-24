import { useParams, Link } from "wouter";
import { useCheatSheet } from "@/hooks/use-cheatsheets";
import { Navbar } from "@/components/Navbar";
import { A4Preview } from "@/components/A4Preview";
import { Loader2, AlertCircle, ArrowLeft, Image as ImageIcon, CheckCircle2, FileText } from "lucide-react";
import { motion } from "framer-motion";

const OCR_STEPS = [
  "Upload received",
  "Extracting text (OCR)",
  "Compressing with AI",
  "Rendering cheat sheet",
];

export default function CheatSheetDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: sheet, isLoading, error } = useCheatSheet(Number(id));

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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-500">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </Link>

          {sheet.createdAt && (
            <span className="text-sm text-emerald-500 font-medium">
              Generated {new Date(sheet.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric"
              })}
            </span>
          )}
        </div>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-emerald-200 shadow-sm">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full border-4 border-emerald-100 animate-pulse" />
              <Loader2 className="absolute inset-0 m-auto h-10 w-10 animate-spin text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold font-display text-emerald-900">AI at work</h2>
            <p className="text-emerald-600 mt-2">Compressing your notes into a one-page sheet...</p>

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
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Source & Details */}
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
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-900 font-mono max-h-64 overflow-y-auto">
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
                <h3 className="text-sm font-bold text-emerald-900 mb-3">Sheet Details</h3>
                <div className="space-y-2 text-xs text-emerald-600">
                  <div className="flex justify-between">
                    <span>Sections</span>
                    <span className="font-semibold text-emerald-900">{sheet.structuredContent!.sections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total points</span>
                    <span className="font-semibold text-emerald-900">
                      {sheet.structuredContent!.sections.reduce((acc, s) => acc + s.points.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source type</span>
                    <span className="font-semibold text-emerald-900">{isTextInput ? "Text" : "Image (OCR)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI model</span>
                    <span className="font-semibold text-emerald-900">Gemini 2.5 Flash</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Generated Preview */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
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
