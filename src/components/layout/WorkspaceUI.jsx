import { Check, ChevronRight } from "lucide-react";

export function WorkspaceHeader({ eyebrow, title, description, meta, children }) {
  return <header className="fp-workspace-header"><div className="min-w-0"><p className="fp-eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="fp-header-description">{description}</p>}{meta && <p className="fp-header-meta">{meta}</p>}</div>{children && <div className="fp-header-actions">{children}</div>}</header>;
}

export function JourneySteps({ steps, label = "Progress", current }) {
  return <ol aria-label={label} className="fp-journey" style={{"--fp-journey-columns":steps.length}}>{steps.map((step, index) => <li key={step.label} data-complete={step.complete || undefined} aria-current={index === current ? "step" : undefined}><span className="fp-step-number">{step.complete ? <Check size={15} aria-hidden="true" /> : index + 1}</span><div><strong>{step.label}</strong>{step.detail && <small>{step.detail}</small>}</div>{index < steps.length - 1 && <ChevronRight className="fp-step-arrow" size={15} aria-hidden="true" />}</li>)}</ol>;
}

export function ProgressLine({ value, label }) {
  const progress = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return <div className="space-y-2"><div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><strong className="tabular-nums">{Math.round(progress)}%</strong></div><div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="fp-progress-track"><span style={{width:`${progress}%`}} /></div></div>;
}
