import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function OnboardingShell({ children }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f8f9fc] flex flex-col">
      <header className="p-4 sm:p-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">FinCopilot</span>
          <span className="text-xs text-gray-400 font-medium ml-2 hidden sm:inline">
            Financial onboarding
          </span>
        </Link>
      </header>
      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className="max-w-2xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
