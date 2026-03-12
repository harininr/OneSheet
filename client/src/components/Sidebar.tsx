import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  FileText,
  User,
  MessageSquare,
  Sun, 
  Moon,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_NAV_ITEMS = [
  { id: "my-sheets", label: "My Sheets", icon: FileText, path: "/" },
  { id: "login", label: "Login", icon: User, path: "/login" },
  { id: "ask-ai", label: "Ask AI", icon: MessageSquare },
];

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  action?: string;
  disabled?: boolean;
}

export interface SidebarProps {
  onAction?: (actionId: string) => void;
  items?: SidebarItem[];
}

export function Sidebar({ onAction, items = DEFAULT_NAV_ITEMS }: SidebarProps) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-[#E4E4EF] dark:border-[#2A2A38] bg-[#F8F8FB] dark:bg-[#0E0E14] hidden lg:flex flex-col z-40">
      <div className="p-8">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">OneSheet</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {items.map((item) => {
          const isActive = item.path ? location === item.path : false;
          
          const content = (
            <button
              onClick={() => {
                if (item.disabled) return;
                if (item.action) {
                  onAction?.(item.action);
                } else if (item.id === "ask-ai") {
                  onAction?.("ask-ai");
                }
              }}
              disabled={item.disabled}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group text-left",
                isActive
                  ? "bg-orange-500/10 text-orange-500 border-l-2 border-orange-500"
                  : item.disabled
                  ? "opacity-30 cursor-not-allowed text-[#94A3B8]"
                  : "text-[#94A3B8] dark:text-[#64748B] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-orange-500" : item.disabled ? "text-[#94A3B8]" : "group-hover:text-orange-400"
              )} />
              {item.label}
            </button>
          );

          if (item.path) {
            return (
              <Link key={item.id} href={item.path}>
                {content}
              </Link>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </nav>

      <div className="p-4 border-t border-[#E4E4EF] dark:border-[#2A2A38] space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] dark:text-[#64748B]">Mode</span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300"
            title={theme === "light" ? "Switch to Dark" : "Switch to Light"}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-[#0F172A]" />
            ) : (
              <Sun className="h-4 w-4 text-[#F1F5F9]" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
