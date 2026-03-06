import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud, File, Loader2, FileText, Image as ImageIcon, X, Wand2,
  Binary, FlaskConical, Scale, Calculator, Globe,
  LayoutGrid, AlignLeft, Columns
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Domain, Layout } from "@shared/schema";

type Mode = "image" | "text";

interface DropzoneProps {
  onDropImage: (file: File, domain: Domain, layout: Layout) => void;
  onSubmitText: (text: string, title: string | undefined, domain: Domain, layout: Layout) => void;
  isUploading?: boolean;
}

const DOMAINS: { value: Domain; label: string; icon: React.ElementType; color: string }[] = [
  { value: "general", label: "General", icon: Globe, color: "text-emerald-500" },
  { value: "cs", label: "CS / Code", icon: Binary, color: "text-blue-500" },
  { value: "math", label: "Math", icon: Calculator, color: "text-violet-500" },
  { value: "biology", label: "Biology", icon: FlaskConical, color: "text-teal-500" },
  { value: "law", label: "Law", icon: Scale, color: "text-amber-500" },
];

const LAYOUTS: { value: Layout; label: string; icon: React.ElementType }[] = [
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "column", label: "Column", icon: AlignLeft },
  { value: "boxed", label: "Boxed", icon: Columns },
];

export function Dropzone({ onDropImage, onSubmitText, isUploading = false }: DropzoneProps) {
  const [mode, setMode] = useState<Mode>("image");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<Domain>("general");
  const [layout, setLayout] = useState<Layout>("grid");

  const onDropCallback = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDropImage(acceptedFiles[0], domain, layout);
    }
  }, [onDropImage, domain, layout]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.heic', '.heif', '.tiff', '.tif'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isUploading || mode !== "image",
    noClick: mode !== "image",
  });

  const handleTextSubmit = () => {
    if (text.trim().length >= 10) {
      onSubmitText(text.trim(), title.trim() || undefined, domain, layout);
    }
  };

  const charCount = text.length;
  const isTextReady = charCount >= 10;
  const selectedDomain = DOMAINS.find(d => d.value === domain)!;
  const DomainIcon = selectedDomain.icon;

  return (
    <div className="relative flex flex-col gap-0 overflow-hidden rounded-2xl">
      {/* Mode toggle */}
      <div className="flex border-b border-emerald-100 bg-emerald-50">
        <button type="button" onClick={() => setMode("image")} disabled={isUploading}
          className={cn("flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-all",
            mode === "image" ? "bg-white text-emerald-900 shadow-sm border-b-2 border-emerald-500"
              : "text-emerald-600 hover:text-emerald-900 hover:bg-white/50"
          )}>
          <ImageIcon className="h-4 w-4" /> Upload Image
        </button>
        <button type="button" onClick={() => setMode("text")} disabled={isUploading}
          className={cn("flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-all",
            mode === "text" ? "bg-white text-emerald-900 shadow-sm border-b-2 border-emerald-500"
              : "text-emerald-600 hover:text-emerald-900 hover:bg-white/50"
          )}>
          <FileText className="h-4 w-4" /> Paste Text
        </button>
      </div>

      {/* Domain + Layout selectors */}
      <div className="bg-white border-b border-emerald-100 px-4 py-3 space-y-3">
        {/* Domain */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Subject Mode</p>
          <div className="flex flex-wrap gap-1.5">
            {DOMAINS.map(d => {
              const Icon = d.icon;
              const active = domain === d.value;
              return (
                <button key={d.value} type="button" onClick={() => setDomain(d.value)} disabled={isUploading}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border",
                    active
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                      : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400"
                  )}>
                  <Icon className="h-3 w-3" />{d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Layout</p>
          <div className="flex gap-1.5">
            {LAYOUTS.map(l => {
              const Icon = l.icon;
              const active = layout === l.value;
              return (
                <button key={l.value} type="button" onClick={() => setLayout(l.value)} disabled={isUploading}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border",
                    active
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                      : "bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400"
                  )}>
                  <Icon className="h-3 w-3" />{l.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="bg-white">
        <AnimatePresence mode="wait">
          {mode === "image" ? (
            <motion.div key="image-mode" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <div {...getRootProps()} className={cn(
                "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center border-2 border-dashed transition-all duration-300 ease-in-out",
                isDragActive ? "border-emerald-500 bg-emerald-50 scale-[1.01]"
                  : "border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30",
                isUploading && "pointer-events-none opacity-70"
              )}>
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                  {isUploading ? (
                    <motion.div key="uploading" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center text-center p-6">
                      <div className="mb-4 rounded-full bg-emerald-50 p-4 text-emerald-500">
                        <Loader2 className="h-10 w-10 animate-spin" />
                      </div>
                      <h3 className="text-lg font-bold text-emerald-900">Processing...</h3>
                      <p className="mt-1 text-sm text-emerald-600">AI is compressing your notes</p>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center text-center p-6">
                      <div className={cn("mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300",
                        isDragActive ? "bg-emerald-500 text-white shadow-lg" : "bg-emerald-50 text-emerald-500")}>
                        {isDragActive ? <File className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}
                      </div>
                      <h3 className="font-display text-lg font-bold text-emerald-900">
                        {isDragActive ? "Drop it here!" : "Upload your notes"}
                      </h3>
                      <p className="mt-1 max-w-xs text-sm text-emerald-600">
                        Drag & drop <strong>handwritten notes</strong>, slides, textbook photos, or printed pages
                      </p>
                      <p className="mt-1 text-xs text-emerald-400">
                        ✍️ AI Vision reads handwriting, diagrams, formulas & annotations
                      </p>
                      <div className="mt-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-600">
                        PNG · JPG · WEBP · HEIC · BMP · TIFF · PDF
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div key="text-mode" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3 p-4">
              <input type="text" placeholder="Sheet title (optional)" value={title}
                onChange={e => setTitle(e.target.value)} disabled={isUploading}
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />

              <div className="relative">
                <textarea placeholder={"Paste or type your messy notes here...\n\nThe AI will extract, compress, and structure them into a clean one-page cheat sheet."}
                  value={text} onChange={e => setText(e.target.value)} disabled={isUploading} rows={7}
                  className="w-full resize-none rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono" />
                {text.length > 0 && (
                  <button type="button" onClick={() => setText("")}
                    className="absolute right-3 top-3 rounded-full p-1 text-emerald-400 hover:bg-emerald-100 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-medium transition-colors",
                  isTextReady ? "text-emerald-500" : "text-emerald-300")}>
                  {charCount} chars{!isTextReady && charCount > 0 ? ` (need ${10 - charCount} more)` : ""}
                </span>
                <button type="button" onClick={handleTextSubmit} disabled={!isTextReady || isUploading}
                  className={cn("flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all",
                    isTextReady && !isUploading
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-0.5 shadow-emerald-500/20 hover:shadow-lg"
                      : "bg-emerald-50 text-emerald-300 cursor-not-allowed"
                  )}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {isUploading ? "Processing..." : "Generate Sheet"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
