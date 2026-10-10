import Link from "next/link";
import { Leaf } from "lucide-react";

export default function OnboardingShell({ children }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <header className="px-6 py-5 sm:px-10 border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-foreground">Finpilot</span>
          <span className="text-xs text-muted-foreground font-medium ml-2 hidden sm:inline">
            Your fresh start
          </span>
        </Link>
      </header>
      <main className="flex-1 px-4 py-10 sm:py-14">
        <div className="max-w-2xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
