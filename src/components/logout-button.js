"use client";

import { signOut } from "@/app/auth/actions";

export default function LogoutButton() {
  async function handleLogout() {
    await signOut();

    window.location.href = "/auth/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded"
    >
      Logout
    </button>
  );
}