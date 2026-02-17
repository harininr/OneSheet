import { Link, useLocation } from "wouter";
import { FileText, Plus, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#d4e2cc]/50 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9CAF88] text-white transition-transform group-hover:scale-110">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold text-[#4c593f]">OneSheet</span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/">
            <div className={cn(
              "flex items-center gap-2 cursor-pointer text-sm font-medium transition-colors hover:text-[#9CAF88]",
              isActive("/") ? "text-[#9CAF88]" : "text-[#627352]"
            )}>
              <LayoutGrid className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </Link>
          <Link href="/create">
            <div className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#9CAF88] px-4 py-2 text-sm font-medium text-white shadow-md shadow-[#9CAF88]/20 transition-all hover:bg-[#7d9169] hover:shadow-lg hover:shadow-[#9CAF88]/30 hover:-translate-y-0.5">
              <Plus className="h-4 w-4" />
              <span>New Sheet</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
