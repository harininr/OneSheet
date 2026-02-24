import { Navbar } from "@/components/Navbar";
import { Dropzone } from "@/components/Dropzone";
import { useUploadCheatSheet, useUploadText, useProcessCheatSheet } from "@/hooks/use-cheatsheets";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Create() {
  const uploadMutation = useUploadCheatSheet();
  const uploadTextMutation = useUploadText();
  const processMutation = useProcessCheatSheet();
  const [, setLocation] = useLocation();

  const isWorking = uploadMutation.isPending || uploadTextMutation.isPending || processMutation.isPending;

  const handleImageUpload = async (file: File) => {
    try {
      const result = await uploadMutation.mutateAsync(file);
      await processMutation.mutateAsync(result.id);
      setLocation(`/cheatsheet/${result.id}`);
    } catch (error) {
      console.error("Creation flow (image) failed", error);
    }
  };

  const handleTextSubmit = async (text: string, title?: string) => {
    try {
      const result = await uploadTextMutation.mutateAsync({ text, title });
      await processMutation.mutateAsync(result.id);
      setLocation(`/cheatsheet/${result.id}`);
    } catch (error) {
      console.error("Creation flow (text) failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfb]">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <Link href="/">
          <button className="mb-8 flex items-center gap-2 text-sm font-medium text-[#627352] transition-colors hover:text-[#9CAF88]">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-2 font-display text-3xl font-bold text-[#30382a]">
            Create New Cheat Sheet
          </h1>
          <p className="mb-8 text-[#627352]">
            Upload an image of your notes <strong>or</strong> paste raw text. Our AI will compress it into a clean one-page study sheet.
          </p>

          <div className="rounded-3xl bg-white p-2 shadow-xl shadow-[#9CAF88]/10 ring-1 ring-[#d4e2cc]">
            <Dropzone
              onDropImage={handleImageUpload}
              onSubmitText={handleTextSubmit}
              isUploading={isWorking}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
