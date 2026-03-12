import { 
  Globe, 
  Binary, 
  Calculator, 
  FlaskConical, 
  Scale,
  LayoutGrid,
  AlignLeft,
  Columns
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Domain, Layout } from "@shared/schema";

interface ControlsRowProps {
  domain: Domain;
  setDomain: (domain: Domain) => void;
  layout: Layout;
  setLayout: (layout: Layout) => void;
  isUploading: boolean;
}

const DOMAINS: { value: Domain; label: string; icon: React.ElementType }[] = [
  { value: "general", label: "General", icon: Globe },
  { value: "cs", label: "CS / Code", icon: Binary },
  { value: "math", label: "Math", icon: Calculator },
  { value: "biology", label: "Biology", icon: FlaskConical },
  { value: "law", label: "Law", icon: Scale },
];

const LAYOUTS: { value: Layout; label: string; icon: React.ElementType }[] = [
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "column", label: "Column", icon: AlignLeft },
  { value: "boxed", label: "Boxed", icon: Columns },
];

export function ControlsRow({
  domain,
  setDomain,
  layout,
  setLayout,
  isUploading
}: ControlsRowProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-8">
      {/* Knowledge Domain */}
      <div className="flex-1 space-y-3">
        <h4 className="section-label">Knowledge Domain</h4>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDomain(d.value)}
              disabled={isUploading}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium border transition-all duration-150",
                domain === d.value
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-[#FFFFFF] dark:bg-[#16161F] text-[#0F172A] dark:text-[#F1F5F9] border-[#E4E4EF] dark:border-[#2A2A38] hover:border-orange-500/50"
              )}
            >
              <d.icon className="h-4 w-4" />
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Preset */}
      <div className="space-y-3 min-w-[200px]">
        <h4 className="section-label">Layout Preset</h4>
        <div className="flex gap-2">
          {LAYOUTS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLayout(l.value)}
              disabled={isUploading}
              className={cn(
                "flex items-center justify-center p-2 rounded-lg border transition-all duration-150 flex-1",
                layout === l.value
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-[#FFFFFF] dark:bg-[#16161F] text-[#0F172A] dark:text-[#F1F5F9] border-[#E4E4EF] dark:border-[#2A2A38] hover:border-orange-500/50"
              )}
              title={l.label}
            >
              <l.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
