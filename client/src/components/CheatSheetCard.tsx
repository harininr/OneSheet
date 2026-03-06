import { Link } from "wouter";
import { Clock, ArrowRight, FileText, Network, Brain, BookOpen, Layers, Image as ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CheatSheet } from "@shared/schema";
import { motion } from "framer-motion";

interface CheatSheetCardProps {
  sheet: CheatSheet;
  index?: number;
}

const DOMAIN_BADGES: Record<string, { bg: string; label: string }> = {
  general: { bg: "bg-emerald-500", label: "GEN" },
  cs: { bg: "bg-blue-500", label: "CS" },
  math: { bg: "bg-violet-500", label: "MATH" },
  biology: { bg: "bg-teal-500", label: "BIO" },
  law: { bg: "bg-amber-500", label: "LAW" },
};

export function CheatSheetCard({ sheet, index = 0 }: CheatSheetCardProps) {
  const isProcessing = !sheet.structuredContent;
  const isTextInput = sheet.originalImageUrl === "text-input";
  const sc = sheet.structuredContent;
  const sectionCount = sc?.sections?.length ?? 0;
  const domain = sc?.domain || "general";
  const badge = DOMAIN_BADGES[domain] || DOMAIN_BADGES.general;
  const hasConceptMap = (sc?.conceptMap?.nodes?.length ?? 0) > 0;
  const hasKeyTerms = (sc?.keyTerms?.length ?? 0) > 0;
  const hasQuiz = (sc?.quiz?.questions?.length ?? 0) > 0;
  const totalPoints = sc?.sections?.reduce((a: number, s: any) => a + (s.points?.length || 0), 0) ?? 0;

  return (
    <Link href={`/cheatsheet/${sheet.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -5 }}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10"
      >
        {/* Image / Preview area */}
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
                backgroundImage: sheet.originalImageUrl ? `url(${sheet.originalImageUrl})` : "none",
              }}
            >
              {!sheet.originalImageUrl && (
                <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                  <ImageIcon className="h-12 w-12 text-emerald-200" />
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />

          {/* Domain badge */}
          {!isProcessing && (
            <div className={`absolute top-3 left-3 rounded-full ${badge.bg} px-2.5 py-0.5 text-[10px] font-bold text-white tracking-wider uppercase`}>
              {badge.label}
            </div>
          )}

          {isProcessing && (
            <div className="absolute top-3 right-3 rounded-full bg-yellow-100/90 px-3 py-1 text-xs font-bold text-yellow-700 backdrop-blur-sm animate-pulse">
              Processing...
            </div>
          )}

          {/* Stats overlay */}
          {!isProcessing && sectionCount > 0 && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-emerald-900 backdrop-blur-sm">
                {sectionCount} sections · {totalPoints} pts
              </span>
              {sc?.metrics?.starredCount ? (
                <span className="rounded-full bg-yellow-100/90 px-2 py-1 text-[10px] font-bold text-yellow-800 backdrop-blur-sm">
                  ⭐ {sc.metrics.starredCount}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-base font-bold text-emerald-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {sheet.title}
          </h3>

          {/* Feature availability badges */}
          {!isProcessing && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                <Layers className="h-2.5 w-2.5" /> Sheet
              </span>
              {hasConceptMap && (
                <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">
                  <Network className="h-2.5 w-2.5" /> Map
                </span>
              )}
              {hasKeyTerms && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  <BookOpen className="h-2.5 w-2.5" /> Terms
                </span>
              )}
              {hasQuiz && (
                <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                  <Brain className="h-2.5 w-2.5" /> Quiz
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 flex items-center justify-between text-xs text-emerald-600">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {sheet.createdAt
                  ? formatDistanceToNow(new Date(sheet.createdAt), { addSuffix: true })
                  : "Just now"}
              </span>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
