import { Link } from "wouter";
import { Clock, Download, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CheatSheet } from "@shared/schema";
import { motion } from "framer-motion";

interface CheatSheetCardProps {
  sheet: CheatSheet;
}

export function CheatSheetCard({ sheet }: CheatSheetCardProps) {
  const isProcessing = !sheet.structuredContent;

  return (
    <Link href={`/cheatsheet/${sheet.id}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#d4e2cc] bg-white shadow-sm transition-all hover:border-[#9CAF88] hover:shadow-lg hover:shadow-[#9CAF88]/10"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f7faf5]">
          {/* Use original image as thumbnail if available, otherwise generic pattern */}
          <div 
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ 
              backgroundImage: sheet.imageUrl 
                ? `url(${sheet.imageUrl})` 
                : sheet.originalImageUrl 
                  ? `url(${sheet.originalImageUrl})`
                  : 'none' 
            }}
          >
            {(!sheet.imageUrl && !sheet.originalImageUrl) && (
              <div className="flex h-full w-full items-center justify-center opacity-10">
                <div className="h-16 w-16 rounded-full border-4 border-[#9CAF88]" />
              </div>
            )}
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          
          {isProcessing && (
            <div className="absolute top-3 right-3 rounded-full bg-yellow-100/90 px-3 py-1 text-xs font-bold text-yellow-700 backdrop-blur-sm">
              Processing...
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg font-bold text-[#4c593f] line-clamp-1 group-hover:text-[#9CAF88] transition-colors">
            {sheet.title}
          </h3>
          
          <div className="mt-4 flex items-center justify-between text-xs text-[#7d9169]">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{sheet.createdAt ? formatDistanceToNow(new Date(sheet.createdAt), { addSuffix: true }) : 'Just now'}</span>
            </div>
            
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7faf5] text-[#9CAF88] transition-colors group-hover:bg-[#9CAF88] group-hover:text-white">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
