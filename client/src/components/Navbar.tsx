import { Link, useLocation } from "wouter";
import { FileText } from "lucide-react";
import { LayoutGrid as DashboardIcon, Plus as PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="h-16 flex items-center justify-between px-8 border-b border-[#E4E4EF] dark:border-[#2A2A38] bg-[#F8F8FB] dark:bg-[#0E0E14] sticky top-0 z-50">
      <Link href="/">
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/10 group-hover:bg-orange-600 transition-colors">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">OneSheet</span>
        </div>
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/">
          <div className={cn(
            "flex items-center gap-2 cursor-pointer text-sm font-medium transition-colors hover:text-[#0F172A] dark:hover:text-[#F1F5F9]",
            isActive("/") ? "text-[#0F172A] dark:text-[#F1F5F9]" : "text-[#94A3B8] dark:text-[#64748B]"
          )}>
            <DashboardIcon className="h-4 w-4" />
            <span>Dashboard</span>
          </div>
        </Link>
        
        <Link href="/create">
          <button className="btn-primary flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium">
            <PlusIcon className="h-3.5 w-3.5" />
            <span>New Sheet</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}
