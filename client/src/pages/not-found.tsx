import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fcfdfb]">
      <div className="flex w-full max-w-md flex-col items-center p-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f7faf5] text-[#9CAF88]">
          <AlertTriangle className="h-10 w-10" />
        </div>
        
        <h1 className="mb-2 font-display text-4xl font-bold text-[#30382a]">404</h1>
        <p className="mb-8 text-[#627352]">The page you're looking for doesn't exist.</p>

        <Link href="/">
          <button className="btn-primary">
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
