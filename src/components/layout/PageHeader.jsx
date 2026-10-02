/**
 * Responsive page header: stacks on mobile, row on tablet+ with premium typography and subtle badges.
 */
export function PageHeader({ title, subtitle, badge, children, className = "" }) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5 sm:mb-6 min-w-0 ${className}`}
    >
      <div className="min-w-0 shrink-0">
        <div className="flex items-center gap-2.5">
          {typeof title === "string" ? (
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
          ) : (
            title
          )}
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0 sm:justify-end min-w-0">
          {children}
        </div>
      )}
    </div>
  );
}

export const pageShellClass = "w-full max-w-[1500px] min-w-0 mx-auto";
