import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DropzoneProps {
  onDrop: (file: File) => void;
  isUploading?: boolean;
}

export function Dropzone({ onDrop, isUploading = false }: DropzoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDropCallback = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDrop(acceptedFiles[0]);
    }
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out",
        isDragActive 
          ? "border-[#9CAF88] bg-[#f7faf5] scale-[1.02]" 
          : "border-[#d4e2cc] bg-white hover:border-[#9CAF88] hover:bg-[#fcfdfb]",
        isUploading && "pointer-events-none opacity-80"
      )}
    >
      <input {...getInputProps()} />
      
      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div 
            key="uploading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 rounded-full bg-[#f7faf5] p-4 text-[#9CAF88]">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-[#4c593f]">Uploading...</h3>
            <p className="mt-2 text-[#627352]">Please wait while we prepare your file</p>
          </motion.div>
        ) : (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center p-8"
          >
            <div className={cn(
              "mb-6 flex h-20 w-20 items-center justify-center rounded-2xl transition-colors duration-300",
              isDragActive ? "bg-[#9CAF88] text-white shadow-lg shadow-[#9CAF88]/30" : "bg-[#f7faf5] text-[#9CAF88]"
            )}>
              {isDragActive ? (
                <File className="h-10 w-10" />
              ) : (
                <UploadCloud className="h-10 w-10" />
              )}
            </div>
            
            <h3 className="font-display text-2xl font-bold text-[#4c593f]">
              {isDragActive ? "Drop it here!" : "Upload your notes"}
            </h3>
            
            <p className="mt-3 max-w-xs text-center text-[#627352]">
              Drag & drop your handwritten notes or slides here, or click to select
            </p>
            
            <div className="mt-8 rounded-full border border-[#d4e2cc] bg-white px-4 py-1.5 text-xs font-medium text-[#7d9169] shadow-sm">
              Supports PNG, JPG, WEBP
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
