import { motion } from "framer-motion";
import { User, Lock, ArrowRight, ShieldCheck, Mail, Sparkles, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  return (
    <div className="min-h-screen bg-[#F8F8FB] dark:bg-[#0E0E14] text-[#0F172A] dark:text-[#F1F5F9] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-blue-500/5">
      
      <div className="max-w-md w-full space-y-8 relative">
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-500/10 blur-[80px] rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full" />

        <div className="text-center space-y-4 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-2xl shadow-orange-500/30 mb-4"
          >
            <FileText className="h-8 w-8" />
          </motion.div>
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black tracking-tight"
          >
            Welcome back
          </motion.h2>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#94A3B8] dark:text-[#64748B] text-sm font-medium"
          >
            Enter your credentials to access your neural brain.
          </motion.p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-10 bg-white dark:bg-[#16161F]/80 backdrop-blur-xl border-[#E4E4EF] dark:border-[#2A2A38] rounded-[2.5rem] shadow-2xl relative z-10"
        >
          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] dark:text-[#64748B] ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-orange-500 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-[#F8F8FB] dark:bg-[#0E0E14] border border-[#E4E4EF] dark:border-[#2A2A38] rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-orange-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] dark:text-[#64748B]">
                  Password
                </label>
                <button type="button" className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 hover:text-orange-600">
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-orange-500 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-[#F8F8FB] dark:bg-[#0E0E14] border border-[#E4E4EF] dark:border-[#2A2A38] rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-orange-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <button className="w-full group relative overflow-hidden bg-orange-500 text-white rounded-2xl py-4 font-black shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#E4E4EF] dark:border-[#2A2A38] text-center">
             <Link href="/">
                <button className="text-xs font-bold text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] transition-colors flex items-center gap-2 mx-auto">
                    <ShieldCheck className="h-4 w-4" />
                    Secure authentication by OneSheet
                </button>
             </Link>
          </div>
        </motion.div>

        <div className="text-center relative z-10">
          <p className="text-xs text-[#94A3B8] font-medium">
            Don't have an account? {" "}
            <button className="text-orange-500 font-black uppercase tracking-widest hover:underline">Request Access</button>
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 opacity-20 relative z-10 pt-8">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Study Engine</span>
            <Sparkles className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
