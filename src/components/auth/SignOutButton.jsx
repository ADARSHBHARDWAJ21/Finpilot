"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

export default function SignOutButton({ className = "" }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        suppressHydrationWarning
        className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors", className)}
      >
        <LogOut size={18} className="text-gray-400" />
        <span>Sign out</span>
      </button>
    </form>
  );
}
