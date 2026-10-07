"use client";
export default function TaxError({ reset }) {
  return <div className="mx-auto max-w-xl space-y-4 p-8"><h1 className="text-2xl font-bold">Your tax records could not be loaded</h1><p className="text-slate-600">Check your connection and try again. Your saved records have not been changed.</p><button onClick={reset} className="rounded-xl bg-violet-600 px-5 py-3 text-white">Try again</button></div>;
}
