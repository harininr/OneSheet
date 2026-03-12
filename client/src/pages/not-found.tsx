import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F8FB] dark:bg-[#0E0E14] text-[#0F172A] dark:text-[#F1F5F9] p-8">
      <div className="flex w-full max-w-md flex-col items-center text-center space-y-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
          <AlertCircle className="h-10 w-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight uppercase">404</h1>
          <p className="text-sm text-[#94A3B8] dark:text-[#64748B] font-medium uppercase tracking-widest">
            Neural link severed: Page not found
          </p>
        </div>

        <p className="text-sm text-[#94A3B8] dark:text-[#64748B] max-w-[280px]">
          The knowledge domain you are looking for has either been relocated or never existed.
        </p>

        <Link href="/">
          <button className="btn-primary w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
