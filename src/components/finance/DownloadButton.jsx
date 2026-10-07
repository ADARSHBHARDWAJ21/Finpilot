"use client";
import { useState } from "react";
import { Download } from "lucide-react";
export default function DownloadButton({
  url,
  filename,
  children,
  className = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium",
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function download() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Download failed. Please try again.");
      }
      const blob = await response.blob();
      const link = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = link;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(link), 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={download}
        className={`${className} disabled:opacity-50`}
      >
        <Download size={15} className="mr-2 inline" />
        {busy ? "Preparing…" : children}
      </button>
      {error && (
        <span role="alert" className="max-w-sm text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
