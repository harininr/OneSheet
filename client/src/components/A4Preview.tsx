import { useRef, useState } from "react";
import type { CheatSheet, StructuredContent, PointType, Domain } from "@shared/schema";
import { Download, ImageDown, Loader2, Star, ArrowRight, TrendingDown, Layers, Hash } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";

interface A4PreviewProps {
  data: NonNullable<CheatSheet["structuredContent"]>;
}

// ── Color Psychology: each point TYPE gets a distinct semantic color ──────────
const TYPE_COLORS: Record<PointType, { dot: string; label: string; labelBg: string; labelText: string }> = {
  definition: { dot: "#3b82f6", label: "DEF", labelBg: "#eff6ff", labelText: "#1d4ed8" },   // Blue
  formula: { dot: "#8b5cf6", label: "∑", labelBg: "#f5f3ff", labelText: "#6d28d9" },   // Violet
  algorithm: { dot: "#0891b2", label: "ALG", labelBg: "#ecfeff", labelText: "#0e7490" },   // Cyan
  case: { dot: "#d97706", label: "CASE", labelBg: "#fffbeb", labelText: "#92400e" },   // Amber
  advantage: { dot: "#10b981", label: "✓", labelBg: "#ecfdf5", labelText: "#065f46" },   // Emerald
  warning: { dot: "#ef4444", label: "!", labelBg: "#fef2f2", labelText: "#991b1b" },   // Red
  fact: { dot: "#6b7280", label: "•", labelBg: "#f9fafb", labelText: "#374151" },   // Gray
  default: { dot: "#6b7280", label: "•", labelBg: "#f9fafb", labelText: "#374151" },
};

// ── Domain badge colors ───────────────────────────────────────────────────────
const DOMAIN_STYLES: Record<Domain, { bg: string; text: string; label: string }> = {
  general: { bg: "#10b981", text: "#fff", label: "GENERAL" },
  cs: { bg: "#3b82f6", text: "#fff", label: "CS / CODE" },
  math: { bg: "#8b5cf6", text: "#fff", label: "MATH" },
  biology: { bg: "#0891b2", text: "#fff", label: "BIOLOGY" },
  law: { bg: "#d97706", text: "#fff", label: "LAW" },
};

// ── Section background accents (cycles) ──────────────────────────────────────
const SECTION_ACCENTS = [
  { bg: "#f0fdf4", border: "#a7f3d0", heading: "#065f46" },
  { bg: "#eff6ff", border: "#bfdbfe", heading: "#1e3a8a" },
  { bg: "#f5f3ff", border: "#ddd6fe", heading: "#4c1d95" },
  { bg: "#fffbeb", border: "#fde68a", heading: "#78350f" },
  { bg: "#ecfeff", border: "#a5f3fc", heading: "#164e63" },
  { bg: "#fef2f2", border: "#fecaca", heading: "#7f1d1d" },
];

function normalise(data: StructuredContent): StructuredContent {
  return {
    ...data,
    domain: data.domain || "general",
    layout: data.layout || "grid",
    metrics: data.metrics || { originalWordCount: 0, compressedWordCount: 0, reductionPercent: 0, sectionCount: data.sections.length, conceptCount: 0, starredCount: 0 },
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

export function A4Preview({ data: rawData }: A4PreviewProps) {
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

  // ── Grid columns based on layout ──
  const getGridCols = () => {
    if (data.layout === "column") return "1fr";
    if (data.layout === "boxed") return data.sections.length <= 3 ? "1fr" : "1fr 1fr";
    return data.sections.length <= 2 ? "1fr" : "1fr 1fr";
  };

  return (
    <div className="flex flex-col items-center gap-6">

      {/* ── Metrics Bar ── */}
      {data.metrics && (
        <div className="w-full grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: TrendingDown, label: "Compressed", value: `${data.metrics.reductionPercent}%`, sub: "word reduction" },
            { icon: Layers, label: "Sections", value: data.metrics.sectionCount, sub: "sections" },
            { icon: Hash, label: "Concepts", value: data.metrics.conceptCount, sub: "key points" },
            { icon: Star, label: "Priority", value: data.metrics.starredCount, sub: "starred ⭐" },
          ].map((m, i) => (
            <div key={i} className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{m.label}</span>
              </div>
              <p className="text-2xl font-black text-emerald-700">{m.value}</p>
              <p className="text-[10px] text-emerald-400">{m.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Color Legend ── */}
      <div className="w-full flex flex-wrap gap-2 px-1">
        {(Object.entries(TYPE_COLORS) as [PointType, typeof TYPE_COLORS[PointType]][])
          .filter(([k]) => k !== "default")
          .map(([type, cfg]) => (
            <span key={type} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: cfg.labelBg, color: cfg.labelText }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
              {cfg.label} {type}
            </span>
          ))}
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-yellow-50 text-yellow-700">
          ⭐ exam priority
        </span>
      </div>

      {/* ── Download Buttons ── */}
      <div className="w-full flex items-center justify-end gap-3">
        <Button onClick={handleDownloadPDF} disabled={isExporting} variant="outline"
          className="border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:text-emerald-900 hover:bg-emerald-50">
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          PDF
        </Button>
        <Button onClick={handleDownloadPNG} disabled={isExporting}
          className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageDown className="mr-2 h-4 w-4" />}
          Download PNG
        </Button>
      </div>

      {/* ── A4 Preview ── */}
      <div className="overflow-auto w-full flex justify-center bg-emerald-50 p-8 rounded-2xl border border-emerald-200 shadow-inner">
        <div ref={contentRef} style={{
          width: "794px",
          minHeight: "1123px",
          background: "#ffffff",
          padding: "48px 52px",
          position: "relative",
          fontFamily: "'DM Sans', sans-serif",
          boxSizing: "border-box",
        }}>

          {/* Decorative top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "6px",
            background: `linear-gradient(90deg, ${domainStyle.bg} 0%, #3b82f6 35%, #8b5cf6 65%, #10b981 100%)`
          }} />

          {/* Header */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              borderBottom: `2.5px solid ${domainStyle.bg}`, paddingBottom: "14px", marginBottom: "8px"
            }}>
              <div>
                <h1 style={{
                  fontSize: "26px", fontWeight: 800, color: "#064e3b", margin: 0,
                  letterSpacing: "-0.02em", fontFamily: "'Outfit', sans-serif", lineHeight: 1.2
                }}>
                  {data.title}
                </h1>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0, marginLeft: "16px" }}>
                <div style={{
                  background: domainStyle.bg, color: domainStyle.text, borderRadius: "20px",
                  padding: "3px 12px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em",
                  textTransform: "uppercase"
                }}>
                  {domainStyle.label}
                </div>
                <div style={{
                  background: "#ecfdf5", color: "#065f46", borderRadius: "20px",
                  padding: "3px 12px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em"
                }}>
                  OneSheet
                </div>
              </div>
            </div>
            <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 500, letterSpacing: "0.03em" }}>
              Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              {" · "}{data.sections.length} sections
              {data.metrics ? ` · ${data.metrics.reductionPercent}% compressed · ${data.metrics.starredCount} exam-priority` : ""}
            </div>
          </div>

          {/* Sections */}
          <div style={{
            display: "grid",
            gridTemplateColumns: getGridCols(),
            gap: "14px",
            alignContent: "start",
          }}>
            {data.sections.map((section, idx) => {
              const accent = SECTION_ACCENTS[idx % SECTION_ACCENTS.length];
              return (
                <div key={idx} style={{
                  background: data.layout === "boxed" ? "#ffffff" : accent.bg,
                  border: data.layout === "boxed"
                    ? `2px solid ${accent.border}`
                    : `1.5px solid ${accent.border}`,
                  borderRadius: "12px",
                  padding: "14px 16px",
                  breakInside: "avoid",
                  boxShadow: data.layout === "boxed" ? `0 2px 8px ${accent.border}40` : "none",
                }}>

                  {/* Section heading */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px",
                    paddingBottom: "7px", borderBottom: `1px solid ${accent.border}`
                  }}>
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: accent.heading, flexShrink: 0
                    }} />
                    <h2 style={{
                      fontSize: "12px", fontWeight: 700, color: accent.heading, margin: 0,
                      fontFamily: "'Outfit', sans-serif", letterSpacing: "0.03em", textTransform: "uppercase"
                    }}>
                      {section.heading}
                    </h2>
                  </div>

                  {/* Concept relationship */}
                  {section.relationship && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px",
                      padding: "4px 8px", background: "rgba(255,255,255,0.7)", borderRadius: "6px",
                      fontSize: "10px", color: "#4b5563", fontWeight: 500, flexWrap: "wrap"
                    }}>
                      {section.relationship.split(/→|->/).map((part, i, arr) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontWeight: 600, color: accent.heading }}>{part.trim()}</span>
                          {i < arr.length - 1 && (
                            <span style={{ color: "#9ca3af", fontWeight: 700 }}>→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Points */}
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {section.points.map((point, pIdx) => {
                      const tc = TYPE_COLORS[point.type] || TYPE_COLORS.default;
                      return (
                        <li key={pIdx} style={{
                          display: "flex", alignItems: "flex-start", gap: "7px",
                          marginBottom: pIdx < section.points.length - 1 ? "6px" : 0,
                          fontSize: "11.5px", lineHeight: "1.5", color: "#111827",
                          fontWeight: point.starred ? 600 : 400,
                        }}>
                          {/* Type badge */}
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "3px",
                            marginTop: "2px", flexShrink: 0
                          }}>
                            <span style={{
                              width: "5px", height: "5px", borderRadius: "50%",
                              background: tc.dot, display: "inline-block", flexShrink: 0
                            }} />
                            <span style={{
                              fontSize: "8px", fontWeight: 700, padding: "0px 4px",
                              borderRadius: "3px", background: tc.labelBg, color: tc.labelText,
                              letterSpacing: "0.03em", textTransform: "uppercase"
                            }}>
                              {tc.label}
                            </span>
                          </span>
                          {/* Starred badge */}
                          {point.starred && (
                            <span style={{
                              fontSize: "9px", background: "#fef9c3", color: "#854d0e",
                              padding: "0px 4px", borderRadius: "3px", fontWeight: 700,
                              marginTop: "2px", flexShrink: 0
                            }}>
                              ⭐
                            </span>
                          )}
                          <span style={{
                            fontFamily: point.type === "formula" || point.type === "algorithm"
                              ? "'JetBrains Mono', monospace" : "inherit"
                          }}>
                            {point.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #d1fae5",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontSize: "9px", color: "#10b981", fontWeight: 700, letterSpacing: "0.05em" }}>
              ✦ ONESHEET · {domainStyle.label}
            </span>
            <span style={{ fontSize: "9px", color: "#a7f3d0" }}>
              Powered by Gemini AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
