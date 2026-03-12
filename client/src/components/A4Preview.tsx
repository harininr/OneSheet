import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import type { CheatSheet, StructuredContent, PointType, Domain } from "@shared/schema";
import { Download, ImageDown, Loader2, Star, ArrowRight, TrendingDown, Layers, Hash, Sparkles } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface A4PreviewProps {
  data: NonNullable<CheatSheet["structuredContent"]>;
}

export interface A4PreviewRef {
  downloadPDF: () => Promise<void>;
  downloadPNG: () => Promise<void>;
}

const TYPE_COLORS: Record<PointType, { dot: string; label: string; labelBg: string; labelText: string }> = {
  definition: { dot: "#3b82f6", label: "DEF", labelBg: "rgba(59, 130, 246, 0.1)", labelText: "#93c5fd" },
  formula: { dot: "#8b5cf6", label: "∑", labelBg: "rgba(139, 92, 246, 0.1)", labelText: "#c4b5fd" },
  algorithm: { dot: "#0891b2", label: "ALG", labelBg: "rgba(8, 145, 178, 0.1)", labelText: "#67e8f9" },
  case: { dot: "#f59e0b", label: "CASE", labelBg: "rgba(245, 158, 11, 0.1)", labelText: "#fcd34d" },
  advantage: { dot: "#10b981", label: "✓", labelBg: "rgba(16, 185, 129, 0.1)", labelText: "#6ee7b7" },
  warning: { dot: "#ef4444", label: "!", labelBg: "rgba(239, 68, 68, 0.1)", labelText: "#fca5a5" },
  fact: { dot: "#94a3b8", label: "•", labelBg: "rgba(148, 163, 184, 0.1)", labelText: "#cbd5e1" },
  default: { dot: "#94a3b8", label: "•", labelBg: "rgba(148, 163, 184, 0.1)", labelText: "#cbd5e1" },
};

const DOMAIN_STYLES: Record<Domain, { bg: string; text: string; label: string }> = {
  general: { bg: "#f97316", text: "#fff", label: "GENERAL" },
  cs: { bg: "#3b82f6", text: "#fff", label: "CS / CODE" },
  math: { bg: "#8b5cf6", text: "#fff", label: "MATH" },
  biology: { bg: "#0891b2", text: "#fff", label: "BIOLOGY" },
  law: { bg: "#f59e0b", text: "#fff", label: "LAW" },
};

const SECTION_ACCENTS = [
  { bg: "#f8fafc", border: "#e2e8f0", heading: "#0f172a" },
  { bg: "#f0f9ff", border: "#bae6fd", heading: "#0369a1" },
  { bg: "#f5f3ff", border: "#ddd6fe", heading: "#5b21b6" },
  { bg: "#fff7ed", border: "#fed7aa", heading: "#9a3412" },
  { bg: "#ecfdf5", border: "#a7f3d0", heading: "#065f46" },
];

function normalise(data: StructuredContent): StructuredContent {
  return {
    ...data,
    domain: data.domain || "general",
    layout: data.layout || "grid",
    sections: (data.sections || []).map(s => ({
      ...s,
      points: (s.points || []).map((p: any) =>
        typeof p === "string"
          ? { text: p, type: "fact" as PointType, starred: false }
          : { text: p.text || p, type: (p.type as PointType) || "fact", starred: !!p.starred }
      ),
    })),
  };
}

export const A4Preview = forwardRef<A4PreviewRef, A4PreviewProps>(({ data: rawData }, ref) => {
  const data = normalise(rawData);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const domainStyle = DOMAIN_STYLES[data.domain] || DOMAIN_STYLES.general;

  const captureCanvas = async () => {
    if (!contentRef.current) return null;
    return await html2canvas(contentRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
  };

  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `${data.title || "cheat-sheet"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally { setIsExporting(false); }
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`${data.title || "cheat-sheet"}.pdf`);
    } finally { setIsExporting(false); }
  };

  useImperativeHandle(ref, () => ({
    downloadPDF: handleDownloadPDF,
    downloadPNG: handleDownloadPNG,
  }));

  const getGridCols = () => {
    if (data.layout === "column") return "1fr";
    if (data.layout === "boxed") return data.sections.length <= 3 ? "1fr" : "1fr 1fr";
    return data.sections.length <= 2 ? "1fr" : "1fr 1fr";
  };

  return (
    <div className="flex flex-col gap-10">
      
      {/* Immersive Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingDown, label: "Compression", value: `${data.metrics?.reductionPercent || 0}%`, color: "text-orange-400" },
          { icon: Layers, label: "Sections", value: data.metrics?.sectionCount || 0, color: "text-blue-400" },
          { icon: Sparkles, label: "Efficiency", value: "Premium", color: "text-violet-400" },
          { icon: Star, label: "Focus Areas", value: data.metrics?.starredCount || 0, color: "text-amber-400" },
        ].map((m, i) => (
          <div key={i} className="glass-card p-5 border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors">{m.label}</span>
              <m.icon className={cn("h-4 w-4", m.color)} />
            </div>
            <div className="text-3xl font-black text-white tracking-tighter">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 glass-card p-4 border-white/5 bg-white/[0.01]">
        <div className="flex flex-wrap gap-2">
          {(Object.entries(TYPE_COLORS) as [PointType, typeof TYPE_COLORS[PointType]][])
            .filter(([k]) => k !== "default" && k !== "fact")
            .map(([type, cfg]) => (
              <div key={type} className="glass-pill px-3 py-1.5 flex items-center gap-2 border-white/5">
                <div className="h-2 w-2 rounded-full" style={{ background: cfg.dot }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{type}</span>
              </div>
            ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isExporting}
            className="group glass-pill px-5 py-2.5 flex items-center gap-2 border-white/10 hover:border-white/20 transition-all hover:bg-white/5 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />}
            <span className="text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">PDF Export</span>
          </button>
          
          <button 
            onClick={handleDownloadPNG} 
            disabled={isExporting}
            className="group glass-pill px-5 py-2.5 flex items-center gap-2 border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20 transition-all hover:border-orange-500/40 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <ImageDown className="h-4 w-4 text-orange-400 group-hover:scale-110 transition-transform" />}
            <span className="text-xs font-black uppercase tracking-widest text-orange-500">Download PNG</span>
          </button>
        </div>
      </div>

      {/* A4 Canvas Experience */}
      <div className="relative group/canvas flex justify-center p-8 sm:p-20 rounded-[2rem] border border-white/5 bg-black/40 shadow-inner overflow-hidden">
        {/* Internal Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 transition-transform duration-700 group-hover/canvas:scale-[1.01]">
          <div ref={contentRef} className="shadow-2xl shadow-black/80 ring-1 ring-white/10" style={{
            width: "794px",
            minHeight: "1123px",
            background: "#ffffff",
            padding: "52px 56px",
            position: "relative",
            fontFamily: "'Inter', sans-serif",
            boxSizing: "border-box",
          }}>

            {/* Premium Header Bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "8px",
              background: `linear-gradient(90deg, ${domainStyle.bg} 0%, #3b82f6 35%, #8b5cf6 65%, #f97316 100%)`
            }} />

            <div style={{ marginBottom: "32px" }}>
              <div style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                borderBottom: `3px solid ${domainStyle.bg}`, paddingBottom: "18px", marginBottom: "10px"
              }}>
                <div style={{ maxWidth: "70%" }}>
                  <h1 style={{
                    fontSize: "32px", fontWeight: 900, color: "#0f172a", margin: 0,
                    letterSpacing: "-0.04em", fontFamily: "'Inter', sans-serif", lineHeight: 1.1,
                    textTransform: "uppercase"
                  }}>
                    {data.title}
                  </h1>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  <div style={{
                    background: domainStyle.bg, color: domainStyle.text, borderRadius: "6px",
                    padding: "4px 12px", fontSize: "11px", fontWeight: 900, letterSpacing: "0.1em"
                  }}>
                    {domainStyle.label}
                  </div>
                  <div style={{
                    background: "#0f172a", color: "#fff", borderRadius: "6px",
                    padding: "4px 12px", fontSize: "11px", fontWeight: 900, letterSpacing: "0.05em"
                  }}>
                    ONESHEET.PRO
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                Curated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                {" · "}{data.sections.length} core modular sections
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: getGridCols(),
              gap: "18px",
              alignContent: "start",
            }}>
              {data.sections.map((section, idx) => {
                const accent = SECTION_ACCENTS[idx % SECTION_ACCENTS.length];
                return (
                  <div key={idx} style={{
                    background: accent.bg,
                    border: `1px solid ${accent.border}`,
                    borderRadius: "16px",
                    padding: "20px",
                    breakInside: "avoid",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}>

                    <div style={{
                      display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px",
                      paddingBottom: "10px", borderBottom: `2px solid ${accent.border}`
                    }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: accent.heading }} />
                      <h2 style={{
                        fontSize: "14px", fontWeight: 900, color: accent.heading, margin: 0,
                        letterSpacing: "0.02em", textTransform: "uppercase"
                      }}>
                        {section.heading}
                      </h2>
                    </div>

                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {section.points.map((point, pIdx) => {
                        const tc = TYPE_COLORS[point.type] || TYPE_COLORS.default;
                        return (
                          <li key={pIdx} style={{
                            display: "flex", alignItems: "flex-start", gap: "10px",
                            marginBottom: pIdx < section.points.length - 1 ? "10px" : 0,
                            fontSize: "12.5px", lineHeight: "1.6", color: "#1e293b",
                            fontWeight: point.starred ? 700 : 500,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", flexShrink: 0 }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: tc.dot }} />
                              {point.starred && <Star style={{ width: "10px", height: "10px", fill: "#f59e0b", color: "#f59e0b" }} />}
                            </div>
                            <span style={{ flex: 1 }}>{point.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div style={{
              position: "absolute", bottom: "48px", left: "56px", right: "56px",
              paddingTop: "20px", borderTop: "2px solid #f1f5f9",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <span style={{ fontSize: "11px", color: "#0f172a", fontWeight: 900, letterSpacing: "0.1em" }}>
                ✦ ONESHEET GEN-AI SYSTEM
              </span>
              <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>
                High-density knowledge synthesis via Gemini 2.5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
A4Preview.displayName = "A4Preview";
