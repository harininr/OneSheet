import { Link } from "wouter";
import { Clock, ArrowRight, FileText, ImageIcon, Sparkles, Layers, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CheatSheet } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useDeleteCheatSheet } from "@/hooks/use-cheatsheets";

interface CheatSheetCardProps {
  sheet: CheatSheet;
  index?: number;
}

const DOMAIN_BADGES: Record<string, { bg: string; label: string }> = {
  general: { bg: "bg-orange-500", label: "GEN" },
  cs: { bg: "bg-blue-500", label: "CS" },
  math: { bg: "bg-violet-500", label: "MATH" },
  biology: { bg: "bg-teal-500", label: "BIO" },
  law: { bg: "bg-amber-500", label: "LAW" },
};

export function CheatSheetCard({ sheet, index = 0 }: CheatSheetCardProps) {
  const deleteMutation = useDeleteCheatSheet();
  const isProcessing = !sheet.structuredContent;
  const isTextInput = sheet.originalImageUrl === "text-input";
  const sc = sheet.structuredContent;
  const sectionCount = sc?.sections?.length ?? 0;
  const domain = sc?.domain || "general";
  const badge = DOMAIN_BADGES[domain] || DOMAIN_BADGES.general;
  const hasAIComponents = (sc?.conceptMap?.nodes?.length ?? 0) > 0 || (sc?.keyTerms?.length ?? 0) > 0 || (sc?.quiz?.questions?.length ?? 0) > 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this neural package?")) {
      deleteMutation.mutate(sheet.id);
    }
  };

  return (
    <Link href={`/cheatsheet/${sheet.id}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ scale: 1.02, translateY: -4 }}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[#E4E4EF] dark:border-[#2A2A38] bg-[#FFFFFF] dark:bg-[#16161F] transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/5 hover:border-orange-500/30"
      >
        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="absolute top-3 right-3 z-20 h-8 w-8 rounded-lg bg-black/10 dark:bg-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-white/10"
          title="Delete Sheet"
        >
          {deleteMutation.isPending ? <Sparkles className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>

        {/* Image / Preview area */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5 dark:bg-white/5 border-b border-[#E4E4EF] dark:border-[#2A2A38]">
          {isTextInput ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-semibold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-widest">Text Input</span>
            </div>
          ) : (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: sheet.originalImageUrl ? `url(${sheet.originalImageUrl})` : "none",
              }}
            >
              {!sheet.originalImageUrl && (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-[#94A3B8] dark:text-[#64748B] opacity-20" />
                </div>
              )}
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Status/Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
             {!isProcessing && (
              <div className={cn("rounded-md px-2 py-0.5 text-[9px] font-bold text-white tracking-widest uppercase", badge.bg)}>
                {badge.label}
              </div>
            )}
            {isProcessing && (
              <div className="rounded-md bg-amber-500 text-white px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase animate-pulse">
                Processing
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4 space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] line-clamp-1 group-hover:text-orange-500 transition-colors">
              {sheet.title || "Untitled Sheet"}
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] dark:text-[#64748B]">
              <Clock className="h-3 w-3" />
              <span>
                {sheet.createdAt
                  ? formatDistanceToNow(new Date(sheet.createdAt), { addSuffix: true })
                  : "Just now"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
             <span className="flex items-center gap-1 rounded-md bg-black/5 dark:bg-white/5 border border-[#E4E4EF] dark:border-[#2A2A38] px-2 py-0.5 text-[10px] font-medium text-[#94A3B8] dark:text-[#64748B]">
                <Layers className="h-3 w-3" /> {sectionCount} Sections
              </span>
              {hasAIComponents && (
                <span className="flex items-center gap-1 rounded-md bg-orange-500/5 border border-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-500">
                   <Sparkles className="h-3 w-3" /> AI Package
                </span>
              )}
          </div>

          <div className="pt-2 mt-auto flex justify-end">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 text-[#94A3B8] dark:text-[#64748B] group-hover:bg-orange-500 group-hover:text-white transition-all">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
