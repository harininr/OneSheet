import { Link } from "wouter";
import { Clock, ArrowRight, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CheatSheet } from "@shared/schema";
import { motion } from "framer-motion";

interface CheatSheetCardProps {
  sheet: CheatSheet;
}

export function CheatSheetCard({ sheet }: CheatSheetCardProps) {
  const isProcessing = !sheet.structuredContent;
  const isTextInput = sheet.originalImageUrl === "text-input";
  const sectionCount = sheet.structuredContent?.sections?.length ?? 0;

  return (
    <Link href={`/cheatsheet/${sheet.id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-emerald-50">
          {isTextInput ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-50 to-emerald-100 transition-all duration-500 group-hover:from-emerald-100 group-hover:to-emerald-200">
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <FileText className="h-10 w-10 text-emerald-500" />
              </div>
              <span className="text-xs font-semibold text-emerald-600">Text Input</span>
            </div>
          ) : (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: sheet.imageUrl
                  ? `url(${sheet.imageUrl})`
                  : sheet.originalImageUrl
                    ? `url(${sheet.originalImageUrl})`
                    : "none",
              }}
            >
              {!sheet.imageUrl && !sheet.originalImageUrl && (
                <div className="flex h-full w-full items-center justify-center opacity-10">
                  <div className="h-16 w-16 rounded-full border-4 border-emerald-500" />
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />

          {isProcessing && (
            <div className="absolute top-3 right-3 rounded-full bg-yellow-100/90 px-3 py-1 text-xs font-bold text-yellow-700 backdrop-blur-sm">
              Processing...
            </div>
          )}

          {!isProcessing && sectionCount > 0 && (
            <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-900 backdrop-blur-sm">
              {sectionCount} sections
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg font-bold text-emerald-900 line-clamp-1 group-hover:text-emerald-500 transition-colors">
            {sheet.title}
          </h3>

          <div className="mt-4 flex items-center justify-between text-xs text-emerald-600">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {sheet.createdAt
                  ? formatDistanceToNow(new Date(sheet.createdAt), { addSuffix: true })
                  : "Just now"}
              </span>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
