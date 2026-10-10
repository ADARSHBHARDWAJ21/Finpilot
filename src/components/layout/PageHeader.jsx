/**
 * Responsive page header: stacks on mobile, row on tablet+ with premium typography and subtle badges.
 */
export function PageHeader({ title, subtitle, badge, children, className = "" }) {
  return (
    <div
      className={`flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between mb-7 sm:mb-9 min-w-0 ${className}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {typeof title === "string" ? (
            <h1 className="text-2xl sm:text-[30px] leading-tight font-medium text-foreground tracking-[-0.045em]">
              {title}
            </h1>
          ) : (
            title
          )}
          {badge && (
            <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
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
