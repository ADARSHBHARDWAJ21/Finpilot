"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Download,
  Pencil,
  Trash2,
  X,
  Search,
  Bell,
  CheckCheck,
  Clock3,
  AlertCircle,
} from "lucide-react";
import {
  saveFinanceEvent,
  completeFinanceEvent,
  deleteFinanceEvent,
} from "@/app/finance/actions";
import {
  EVENT_CATEGORIES,
  plannerSummary,
  indiaToday,
  displayDate,
  calendarExport,
  shiftDay,
} from "@/lib/finance/model";

const inputClass =
  "w-full fp-input";
const buttonClass =
  "fp-button";
export default function PlannerSection({
  initialEvents,
  today: initialToday,
  mode = "reminders",
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [previousEvents, setPreviousEvents] = useState(initialEvents);
  const [today, setToday] = useState(initialToday);
  const [month, setMonth] = useState(initialToday.slice(0, 7));
  const [day, setDay] = useState(initialToday);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  // Reconcile a refreshed server snapshot without resetting open forms or filters.
  if (previousEvents !== initialEvents) {
    setPreviousEvents(initialEvents);
    setEvents(initialEvents);
  }
  useEffect(() => {
    const refresh = () => {
      setToday(indiaToday());
      router.refresh();
    };
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);
  const summary = plannerSummary(events, today);
  const visible = useMemo(
    () =>
      events
        .filter(
          (e) =>
            (category === "all" || e.category === category) &&
            `${e.title} ${e.description}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort(
          (a, b) =>
            a.due_date.localeCompare(b.due_date) ||
            a.title.localeCompare(b.title),
        ),
    [events, category, search],
  );
  const filtered = visible.filter(
    (e) =>
      filter === "all" ||
      (filter === "completed"
        ? e.completed
        : filter === "overdue"
          ? !e.completed && e.due_date < today
          : !e.completed),
  );
  const start = new Date(`${month}-01T12:00:00Z`);
  const count = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
  ).getUTCDate();
  function changeMonth(delta) {
    const next = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + delta, 1),
    );
    const value = next.toISOString().slice(0, 7);
    if (value < "2000-01" || value > "2099-12") return;
    setMonth(value);
    setDay(`${value}-01`);
  }
  function add(date = today) {
    setMessage("");
    setForm({
      title: "",
      description: "",
      due_date: date,
      category: "other",
      priority: "medium",
    });
  }
  async function perform(action, success) {
    setBusy(true);
    setMessage("");
    try {
      const result = await action();
      if (result.error) throw new Error(result.error);
      success?.(result);
      router.refresh();
    } catch (e) {
      setMessage(e.message || "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function exportCalendar() {
    const url = URL.createObjectURL(
      new Blob([calendarExport(visible.filter((e) => !e.completed))], {
        type: "text/calendar;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "finpilot-reminders.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function rows(items) {
    return items.length ? (
      items.map((e) => (
        <article
          key={e.id}
          className="flex flex-wrap items-center gap-3 border-b border-border py-4 last:border-0"
        >
          <input
            type="checkbox"
            aria-label={`Complete ${e.title}`}
            checked={e.completed}
            disabled={busy || e.source === "goals"}
            onChange={() =>
              perform(
                () => completeFinanceEvent(e.id, !e.completed),
                (result) =>
                  setEvents(
                    events.map((item) =>
                      item.id === e.id ? result.event : item,
                    ),
                  ),
              )
            }
            className="h-5 w-5 accent-primary"
          />
          <div className="min-w-0 flex-1">
            <h3
              className={`font-semibold ${e.completed ? "line-through text-muted-foreground/70" : "text-foreground"}`}
            >
              {e.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {displayDate(e.due_date)} · {e.category} · {e.priority} priority
              {!e.completed && e.due_date < today && (
                <span className="font-semibold text-[#a45f4b]"> · Overdue</span>
              )}
            </p>
            {e.description && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {e.description}
              </p>
            )}
          </div>
          {e.source === "goals" ? (
            <Link href="/goals" className="text-sm text-primary">
              Open goal
            </Link>
          ) : (
            <div className="ml-auto flex flex-wrap gap-1">
              <button
                type="button"
                className={buttonClass}
                aria-label={`Edit ${e.title}`}
                disabled={busy}
                onClick={() =>
                  setForm({
                    id: e.id,
                    title: e.title,
                    description: e.description,
                    due_date: e.due_date,
                    category: e.category,
                    priority: e.priority,
                  })
                }
              >
                <Pencil size={16} />
              </button>
              {!e.completed && (
                <button
                  className={buttonClass}
                  disabled={busy}
                  onClick={() =>
                    perform(
                      () =>
                        saveFinanceEvent({
                          id: e.id,
                          title: e.title,
                          description: e.description,
                          category: e.category,
                          priority: e.priority,
                          due_date: shiftDay(
                            e.due_date < today ? today : e.due_date,
                            1,
                          ),
                        }),
                      (result) =>
                        setEvents(
                          events.map((item) =>
                            item.id === e.id ? result.event : item,
                          ),
                        ),
                    )
                  }
                >
                  +1 day
                </button>
              )}
              <button
                className={buttonClass}
                aria-label={`Delete ${e.title}`}
                disabled={busy}
                onClick={() => setDeleting(e)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </article>
      ))
    ) : (
      <div className="flex flex-col items-center px-4 py-12 text-center text-sm text-muted-foreground">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary"><Bell size={21} strokeWidth={1.7} /></span>
        <p className="font-medium text-foreground">A little breathing room</p>
        <p className="mt-2">No reminders here. Add one or change your filters.</p>
      </div>
    );
  }
  return (
    <section className="mx-auto w-full max-w-7xl space-y-7 py-2">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="fp-eyebrow">
            Make room for what matters
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            {mode === "calendar" ? "Calendar" : "Reminders"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep important dates, payments and milestones in view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className={buttonClass}
            href={mode === "calendar" ? "/reminders" : "/calendar"}
          >
            {mode === "calendar" ? "View reminders" : "View calendar"}
          </Link>
          <button className={buttonClass} onClick={exportCalendar}>
            <Download className="mr-2 inline" size={16} />
            Export calendar
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            onClick={() => add(mode === "calendar" ? day : today)}
          >
            <Plus className="mr-1 inline" size={18} />
            Add reminder
          </button>
        </div>
      </header>
      {message && (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          {message}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Pending", summary.pending, Clock3],
          ["Overdue", summary.overdue, AlertCircle],
          ["Next 7 days", summary.week, CalendarDays],
          ["Completed", summary.completed, CheckCheck],
        ].map(([label, value, Icon]) => (
          <div
            key={label}
            className="fp-card p-5"
          >
            <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{label}</p><Icon size={16} strokeWidth={1.7} className={label === "Overdue" && value > 0 ? "text-[#a76d51]" : "text-muted-foreground/60"} /></div>
            <p className="mt-4 text-3xl font-medium tracking-tight tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative w-full sm:max-w-xs"><Search size={16} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /><input
          aria-label="Search reminders"
          placeholder="Search reminders…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} pl-10`}
        /></label>
        <select
          aria-label="Reminder category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${inputClass} max-w-48`}
        >
          <option value="all">All categories</option>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {mode !== "calendar" && (
          <select
            aria-label="Reminder status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`${inputClass} max-w-48`}
          >
            {["pending", "overdue", "completed", "all"].map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All reminders" : c}
              </option>
            ))}
          </select>
        )}
      </div>
      {mode === "calendar" ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="fp-card p-3 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <button
                aria-label="Previous month"
                className={buttonClass}
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <label className="font-semibold">
                <span className="sr-only">Calendar month</span>
                <input
                  type="month"
                  min="2000-01"
                  max="2099-12"
                  value={month}
                  onChange={(e) => {
                    if (/^20\d{2}-\d{2}$/.test(e.target.value)) {
                      setMonth(e.target.value);
                      setDay(`${e.target.value}-01`);
                    }
                  }}
                />
              </label>
              <button
                aria-label="Next month"
                className={buttonClass}
                onClick={() => changeMonth(1)}
              >
                <ChevronRight size={18} />
              </button>
              <button
                className={buttonClass}
                onClick={() => {
                  setMonth(today.slice(0, 7));
                  setDay(today);
                }}
              >
                Today
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <span key={d} className="pb-3">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: start.getUTCDay() }, (_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: count }, (_, i) => {
                const date = `${month}-${String(i + 1).padStart(2, "0")}`;
                const items = visible.filter((e) => e.due_date === date);
                return (
                  <button
                    key={date}
                    aria-label={`${displayDate(date)}, ${items.length} reminders`}
                    aria-pressed={day === date}
                    onClick={() => setDay(date)}
                    className={`min-w-0 min-h-16 rounded-xl border p-1.5 text-left transition-colors sm:min-h-24 sm:p-3 ${date === day ? "border-primary/30 bg-primary/10" : "border-border/70 hover:bg-muted"}`}
                  >
                    <span
                      className={`text-sm ${date === today ? "font-semibold text-primary" : ""}`}
                    >
                      {i + 1}
                    </span>
                    {items.length > 0 && (
                      <span className="mt-2 flex items-center gap-1 text-[10px] font-medium text-primary"><span className="h-1 w-1 shrink-0 rounded-full bg-primary" />{items.length}<span className="hidden sm:inline">{items.length === 1 ? "item" : "items"}</span></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="fp-card p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarDays size={20} />
              {displayDate(day)}
            </h2>
            {rows(visible.filter((e) => e.due_date === day))}
            <button className={buttonClass} onClick={() => add(day)}>
              Add for this date
            </button>
          </div>
        </div>
      ) : (
        <div className="fp-card p-5">
          {rows(filtered)}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Reminders are shown inside Finpilot. Export your calendar to use alerts
        in your calendar app. Goal milestones can be edited in Goals.
      </p>
      {form && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reminder-title"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              perform(
                () => saveFinanceEvent(form),
                (result) => {
                  setEvents([
                    ...events.filter((item) => item.id !== result.event.id),
                    result.event,
                  ]);
                  setForm(null);
                  setMessage("Reminder saved.");
                },
              );
            }}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6"
          >
            <div className="flex justify-between">
              <h2 id="reminder-title" className="text-xl font-semibold">
                {form.id ? "Edit" : "Add"} reminder
              </h2>
              <button
                type="button"
                aria-label="Close reminder form"
                disabled={busy}
                onClick={() => setForm(null)}
              >
                <X />
              </button>
            </div>
            <label className="block text-sm">
              Title
              <input
                autoFocus
                required
                maxLength={160}
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Due date
              <input
                required
                type="date"
                min="2000-01-01"
                max="2099-12-31"
                className={inputClass}
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Category
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Priority
                <select
                  className={inputClass}
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                >
                  {["low", "medium", "high"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm">
              Notes
              <textarea
                maxLength={2000}
                className={inputClass}
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            {message && (
              <p role="alert" className="text-sm text-red-700">
                {message}
              </p>
            )}
            <button
              disabled={busy}
              className="w-full rounded-xl bg-primary p-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save reminder"}
            </button>
          </form>
        </div>
      )}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-reminder-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h2 id="delete-reminder-title" className="text-xl font-semibold">
              Delete reminder?
            </h2>
            <p className="my-4 text-sm">
              “{deleting.title}” will be removed from Reminders and Calendar.
            </p>
            <div className="flex gap-3">
              <button
                className={buttonClass}
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="rounded-xl bg-red-600 px-4 py-2 text-white"
                onClick={() =>
                  perform(
                    () => deleteFinanceEvent(deleting.id),
                    () => {
                      setEvents(events.filter((e) => e.id !== deleting.id));
                      setDeleting(null);
                    },
                  )
                }
              >
                Delete reminder
              </button>
            </div>
            {message && <p role="alert">{message}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
