import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Loader2, Wand2, FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface UploadZoneProps {
  mode: "image" | "text";
  onDropImage: (file: File) => void;
  text: string;
  setText: (text: string) => void;
  title: string;
  setTitle: (title: string) => void;
  handleTextSubmit: () => void;
  isUploading: boolean;
}

export function UploadZone({
  mode,
  onDropImage,
  text,
  setText,
  title,
  setTitle,
  handleTextSubmit,
  isUploading
}: UploadZoneProps) {
  const onDropCallback = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDropImage(acceptedFiles[0]);
    }
  }, [onDropImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept: { 
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'], 
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    disabled: isUploading || mode !== "image",
    noClick: mode !== "image",
  });

  const isTextReady = text.trim().length >= 10;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {mode === "image" ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-200 cursor-pointer",
                isDragActive 
                  ? "border-orange-500 bg-orange-500/5" 
                  : "border-[#E4E4EF] dark:border-[#2A2A38] bg-transparent hover:border-[#F97316]/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]",
                isUploading && "pointer-events-none opacity-50"
              )}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
                  <h3 className="text-xl font-semibold text-[#0F172A] dark:text-[#F1F5F9]">Processing...</h3>
                  <p className="mt-2 text-sm text-[#94A3B8] dark:text-[#64748B]">Our neural engine is reading your notes</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="h-10 w-10 text-orange-500 mb-4" />
                  <h3 className="text-xl font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                    {isDragActive ? "Release to process" : "Upload study material"}
                  </h3>
                  <p className="mt-1 text-sm text-[#94A3B8] dark:text-[#64748B]">
                    Drop images, PDFs, Word docs, or PPT slides here
                  </p>
                  <div className="mt-8 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-[#E4E4EF] dark:border-[#2A2A38] text-[10px] uppercase tracking-widest text-[#94A3B8] dark:text-[#64748B]">
                    HANDWRITING · DOCUMENTS · SLIDES
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Note Title (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                className="w-full rounded-lg border border-[#E4E4EF] dark:border-[#2A2A38] bg-transparent px-4 py-3 text-sm text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
              <textarea
                placeholder="Paste your messy notes here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isUploading}
                rows={10}
                className="w-full resize-none rounded-lg border border-[#E4E4EF] dark:border-[#2A2A38] bg-transparent px-4 py-4 text-sm leading-relaxed text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94A3B8] dark:text-[#64748B]">
                {text.length} Characters
              </span>
              <button
                type="button"
                onClick={handleTextSubmit}
                disabled={!isTextReady || isUploading}
                className="btn-primary"
              >
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
  );
}
