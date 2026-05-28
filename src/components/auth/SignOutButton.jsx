"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";

export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
      >
        <LogOut size={18} className="text-gray-400" />
        <span>Sign out</span>
      </button>
    </form>
  );
}
