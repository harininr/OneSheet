import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your OneSheet study assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 w-[min(400px,calc(100vw-48px))] h-[min(600px,calc(100vh-120px))] flex flex-col bg-white dark:bg-[#16161F] rounded-2xl shadow-2xl border border-[#E4E4EF] dark:border-[#2A2A38] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 bg-orange-500 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">OneSheet AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4 space-y-4">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-start gap-3",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    m.role === "user" ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                    m.role === "user" 
                      ? "bg-orange-500 text-white rounded-tr-none" 
                      : "bg-[#F8F8FB] dark:bg-[#1C1C26] text-[#0F172A] dark:text-[#F1F5F9] rounded-tl-none border border-[#E4E4EF] dark:border-[#2A2A38]"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-[#F8F8FB] dark:bg-[#1C1C26] p-3 rounded-2xl rounded-tl-none border border-[#E4E4EF] dark:border-[#2A2A38]">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Input */}
          <form 
            onSubmit={handleSubmit}
            className="p-4 border-t border-[#E4E4EF] dark:border-[#2A2A38] bg-white dark:bg-[#16161F]"
          >
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your study notes..."
                className="flex-1 bg-[#F8F8FB] dark:bg-[#1C1C26] border border-[#E4E4EF] dark:border-[#2A2A38] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/50 transition-colors pr-12"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 opacity-40">
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Powered by Groq Llama 3</span>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
