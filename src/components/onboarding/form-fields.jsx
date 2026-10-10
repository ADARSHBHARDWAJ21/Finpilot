export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#647268]">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </label>
  );
}

export function TextInput({ value, onChange, type = "text", placeholder, disabled, ...rest }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:bg-muted"
      {...rest}
    />
  );
}

export function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-11 px-3.5 py-2.5 text-sm bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10"
    >
      {options.map((opt) => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>
          {opt.label ?? opt}
        </option>
      ))}
    </select>
  );
}

export function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 py-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border accent-[#214d43]"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
