export default function BrandMark({ className = "size-9", dark = false }) {
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-xl ${dark ? "bg-[#dce8c7] text-[#203c30]" : "bg-primary text-white"} ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
        <path d="M5 19V6.5A1.5 1.5 0 0 1 6.5 5H19M5 12h10M13 19l6-6m0 0h-5m5 0v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
