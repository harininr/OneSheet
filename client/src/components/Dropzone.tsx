import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud, File, Loader2, FileText, Image as ImageIcon, X, Wand2,
  Binary, FlaskConical, Scale, Calculator, Globe,
  LayoutGrid, AlignLeft, Columns, Sparkles
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
  { value: "general", label: "General", icon: Globe, color: "text-orange-400" },
  { value: "cs", label: "CS / Code", icon: Binary, color: "text-blue-400" },
  { value: "math", label: "Math", icon: Calculator, color: "text-violet-400" },
  { value: "biology", label: "Biology", icon: FlaskConical, color: "text-teal-400" },
  { value: "law", label: "Law", icon: Scale, color: "text-amber-400" },
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

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-3xl">
      {/* Mode toggle */}
      <div className="flex border-b border-white/10 bg-white/5 backdrop-blur-md">
        <button type="button" onClick={() => setMode("image")} disabled={isUploading}
          className={cn("flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold transition-all",
            mode === "image" ? "bg-white/10 text-orange-400 shadow-xl border-b-2 border-orange-500"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}>
          <ImageIcon className="h-4 w-4" /> Image
        </button>
        <button type="button" onClick={() => setMode("text")} disabled={isUploading}
          className={cn("flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold transition-all",
            mode === "text" ? "bg-white/10 text-orange-400 shadow-xl border-b-2 border-orange-500"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}>
          <FileText className="h-4 w-4" /> Notes
        </button>
      </div>

      {/* Selectors Area */}
      <div className="bg-white/5 border-b border-white/10 px-6 py-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Domain */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/80 mb-3 ml-1">Knowledge Domain</p>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map(d => {
                const Icon = d.icon;
                const active = domain === d.value;
                return (
                  <button key={d.value} type="button" onClick={() => setDomain(d.value)} disabled={isUploading}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all border",
                      active
                        ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                        : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:bg-white/10"
                    )}>
                    <Icon className="h-3.5 w-3.5" />{d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layout */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/80 mb-3 ml-1">Layout Preset</p>
            <div className="flex gap-2">
              {LAYOUTS.map(l => {
                const Icon = l.icon;
                const active = layout === l.value;
                return (
                  <button key={l.value} type="button" onClick={() => setLayout(l.value)} disabled={isUploading}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all border",
                      active
                        ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
                        : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:bg-white/10"
                    )}>
                    <Icon className="h-3.5 w-3.5" />{l.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main interaction Area */}
      <div className="bg-white/5">
        <AnimatePresence mode="wait">
          {mode === "image" ? (
            <motion.div key="image-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} className="p-2">
              <div {...getRootProps()} className={cn(
                "relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-500 ease-out p-8 text-center",
                isDragActive ? "border-orange-500 bg-orange-500/10 shadow-[inner_0_0_30px_rgba(249,115,22,0.2)] scale-[0.99]"
                  : "border-white/10 bg-transparent hover:border-white/30 hover:bg-white/[0.02]",
                isUploading && "pointer-events-none opacity-50"
              )}>
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                  {isUploading ? (
                    <motion.div key="uploading" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                      <h3 className="text-xl font-black text-white">Compressing...</h3>
                      <p className="mt-2 text-sm text-slate-400 tracking-tight">AI Vision is reading your notes</p>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center">
                      <div className={cn("mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] transition-all duration-500 shadow-2xl",
                        isDragActive ? "bg-orange-500 text-white ring-4 ring-orange-500/20" : "bg-white/5 text-orange-400 ring-1 ring-white/10")}>
                        {isDragActive ? <Sparkles className="h-8 w-8" /> : <UploadCloud className="h-8 w-8" />}
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight leading-none mb-3">
                        {isDragActive ? "Release to process" : "Upload study material"}
                      </h3>
                      <p className="max-w-[280px] text-sm text-slate-400 font-medium mb-6">
                        Drop images of <strong>handwritten notes</strong>, slides, or textbook pages here
                      </p>
                      
                      <div className="glass-pill text-[10px] text-orange-400 border-orange-500/20 tracking-[0.15em] uppercase px-5">
                        Handwriting · Diagrams · Formulas
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div key="text-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} className="flex flex-col gap-4 p-8">
              <div className="space-y-4">
                <input type="text" placeholder="Note Title (Optional)" value={title}
                  onChange={e => setTitle(e.target.value)} disabled={isUploading}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all" />

                <div className="relative">
                  <textarea placeholder={"Paste your messy notes here...\n\nAI will extract, structure, and condense everything into a visual cheat sheet."}
                    value={text} onChange={e => setText(e.target.value)} disabled={isUploading} rows={8}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono" />
                  {text.length > 0 && (
                    <button type="button" onClick={() => setText("")}
                      className="absolute right-4 top-4 rounded-xl p-2 text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-bold tracking-tight",
                  isTextReady ? "text-orange-400" : "text-slate-600")}>
                  {charCount} Characters {!isTextReady && charCount > 0 ? `(${10 - charCount} more needed)` : ""}
                </span>
                
                <button type="button" onClick={handleTextSubmit} disabled={!isTextReady || isUploading}
                  className="btn-primary py-2.5 px-8">
                  {isUploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing</>
                  ) : (
                    <><Wand2 className="h-4 w-4 mr-2" /> Generate Sheet</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
