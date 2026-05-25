/**
 * Responsive page header: stacks on mobile, row on tablet+.
 */
export function PageHeader({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 min-w-0 ${className}`}
    >
      <div className="min-w-0 shrink-0">
        {typeof title === "string" ? (
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        ) : (
          title
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1 max-w-xl">{subtitle}</p>
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
