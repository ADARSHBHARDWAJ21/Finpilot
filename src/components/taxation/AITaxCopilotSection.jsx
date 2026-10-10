"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import FinancialYearSelect from "@/components/finance/FinancialYearSelect";
import { Sparkles, Send, RefreshCw, Plus, Trash2, User, Wallet, Info, ArrowUpRight, ArrowRight, ChevronRight, LoaderCircle, PanelRight, History, X, CalendarDays, Percent, FileText, Paperclip, Upload, Pencil, PiggyBank, Sprout, ChartNoAxesColumnIncreasing, CircleDollarSign } from "lucide-react";
import { Dialog } from "radix-ui";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { displayDate } from "@/lib/finance/model";

const promptGroups = [{label:"Money",items:["Where is most of my spending going?","Can I afford a new EMI?","How can I improve my monthly savings?"]},{label:"Taxation",items:["Which tax regime is better for me?","Am I missing any eligible deductions?","Explain my HRA exemption and its assumptions."]}];
const promptIcons = [CircleDollarSign, CalendarDays, PiggyBank, Percent, FileText, Sparkles];
const moreQuestions = ["How should I plan my budget for next month?", "What should I consider before increasing my SIP?", "Which assumptions should I check before filing my return?", "What records do I need to support my deductions?"];
const explorations = [
  { title: "Explore your tax savings", detail: "Review deductions and compare your estimates.", icon: ChartNoAxesColumnIncreasing, tone: "green", prompt: "Help me understand my eligible deductions and compare both tax regimes before suggesting any tax-saving investments." },
  { title: "Plan your next month", detail: "Set a budget and make room for your goals.", icon: FileText, tone: "purple", prompt: "Help me plan a budget for next month using my recorded spending. Ask me for any missing income or commitments." },
  { title: "Build your financial future", detail: "Explore savings, goals and your next steps.", icon: PiggyBank, tone: "orange", prompt: "Help me build a savings plan for my goals. Ask me about my priorities, emergency savings and monthly commitments." },
];
const followUps = ["What if my salary increases by 20%?", "Explain the assumptions", "How can I save more each month?"];
const MAX_EXCHANGES = 20;
const money = (value) => `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
const textList = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
const hasTaxEstimates = (tax) => Boolean(tax?.available && Number.isFinite(tax.old?.tax) && Number.isFinite(tax.new?.tax));
const time = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
};
function validSources(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((source) => {
    if (typeof source?.url !== "string" || typeof source?.title !== "string") return false;
    try { return ["https:", "http:"].includes(new URL(source.url).protocol); }
    catch { return false; }
  });
}
function readChat(payload) {
  if (typeof payload?.chat?.id !== "string" || !Array.isArray(payload.chat.messages)) {
    throw new Error("Copilot returned an incomplete chat. Refresh your saved chats and try again.");
  }
  return { ...payload.chat, messages: payload.chat.messages.filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string") };
}

function RegimeComparison({ tax, baseline }) {
  if (!hasTaxEstimates(tax)) return <p className="text-sm text-muted-foreground">{typeof tax?.reason === "string" ? tax.reason : "Add your financial profile to see estimates."}</p>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">{["old", "new"].map((regime) => {
    const recommended = tax.recommended === regime;
    const change = hasTaxEstimates(baseline) ? tax[regime].tax - baseline[regime].tax : null;
    return <div key={regime} className={`rounded-xl p-4 border ${recommended ? "border-primary/20 bg-primary/5" : "border-border bg-white"}`}>
      <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground capitalize">{regime} regime</p>{recommended && <span className="text-[10px] font-semibold text-primary">Lower estimate</span>}</div>
      <p className={`text-2xl font-medium tracking-tight mt-2 ${recommended ? "text-primary" : "text-foreground"}`}>{money(tax[regime].tax)}</p><p className="text-xs text-muted-foreground mt-1">Estimated annual tax, including cess</p>
      {change !== null && <p className="text-xs text-muted-foreground mt-2">{change >= 0 ? "+" : "−"}{money(Math.abs(change))} compared with saved-profile estimate</p>}
    </div>;
  })}</div>;
}

function Calculation({ result }) {
  if (!result || !["tax", "emi"].includes(result.kind)) return null;
  if (result.kind === "emi" && (!Number.isFinite(result.monthlyEmi) || !Number.isFinite(result.totalInterest))) return null;
  return <div className="mt-4 border-t border-border pt-3">
    <p className="text-xs font-semibold text-foreground">{result.kind === "tax" ? `Calculated tax scenario${typeof result.scenario?.financialYear === "string" ? ` · Tax year ${result.scenario.financialYear}` : ""}` : "Calculated loan scenario"}</p>
    {result.kind === "tax" ? <RegimeComparison tax={result.scenario} baseline={result.baseline} /> : <div className="grid grid-cols-2 gap-3 mt-2 text-sm"><p><span className="block text-xs text-muted-foreground">Monthly EMI</span><strong>{money(result.monthlyEmi)}</strong></p><p><span className="block text-xs text-muted-foreground">Total interest</span><strong>{money(result.totalInterest)}</strong></p>{Number.isFinite(result.remainingAfterEmi) && <p className="col-span-2 text-xs text-muted-foreground">Remaining from declared monthly cashflow: {money(result.remainingAfterEmi)}</p>}</div>}
    <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Assumptions and calculation limits</summary><ul className="list-disc pl-4 mt-2 space-y-1">{[...textList(result.assumptions), ...textList(result.scenario?.warnings)].map((note, i) => <li key={i}>{note}</li>)}</ul></details>
  </div>;
}

export default function AITaxCopilotSection({ financialYear, initialSnapshot, initialChats = [], historyAvailable = true, initialError = "", aiConfigured = false, initialQuestion = "" }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState(initialQuestion);
  const [busy, setBusy] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileError, setProfileError] = useState(initialError);
  const [providerReady, setProviderReady] = useState(aiConfigured);
  const [storageAvailable, setStorageAvailable] = useState(historyAvailable);
  const [contextOpen, setContextOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [questionsExpanded, setQuestionsExpanded] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const inFlight = useRef(false);
  const bottom = useRef(null);
  const input = useRef(null);
  const historyOpener = useRef(null);
  const exchanges = messages.filter((message) => message.role === "user").length;
  const limitReached = exchanges >= MAX_EXCHANGES;
  const canSend = !busy && providerReady && storageAvailable && !limitReached;
  useEffect(() => {
    if (!messages.length && !pendingMessage) return;
    bottom.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }, [messages, pendingMessage]);

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.method === "POST" ? 95000 : 20000);
    try {
      const response = await fetch(url, { cache: "no-store", ...options, signal: controller.signal });
      let payload;
      try { payload = await response.json(); }
      catch { throw new Error(response.status === 401 ? "Please sign in again to use Copilot." : "Copilot could not complete this request. Refresh your saved chats and try again."); }
      if (!response.ok) {
        const failure = new Error(typeof payload?.error === "string" ? payload.error : "Could not complete this request.");
        failure.code = payload?.code;
        failure.status = response.status;
        throw failure;
      }
      if (!payload || typeof payload !== "object") throw new Error("Copilot returned an incomplete response. Please try again.");
      return payload;
    } catch (failure) {
      if (controller.signal.aborted) throw new Error("This request took too long. Refresh your saved chats before trying again; your question may already have been saved.");
      if (failure instanceof TypeError) throw new Error("Could not reach Copilot. Check your connection and try again.");
      throw failure;
    } finally { clearTimeout(timeout); }
  }
  function recoverMissingChat(id) {
    setChats((items) => items.filter((item) => item.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
    setNotice("That chat is no longer available. You can start a new conversation below.");
  }
  async function refresh() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const data = await request(`/api/copilot?year=${encodeURIComponent(snapshot?.financialYear || financialYear || "")}`);
      setSnapshot(data.snapshot); setChats(Array.isArray(data.chats) ? data.chats : []); setStorageAvailable(Boolean(data.available));
      if (typeof data.aiConfigured === "boolean") setProviderReady(data.aiConfigured);
      setProfileError(data.snapshot ? "" : "Your financial profile could not be loaded. Select Refresh data to try again.");
      if (activeId) {
        try {
          const chat = readChat(await request(`/api/copilot?conversationId=${encodeURIComponent(activeId)}`));
          setMessages(chat.messages);
        } catch (failure) {
          if (failure.code === "CHAT_NOT_FOUND" || failure.status === 404) recoverMissingChat(activeId);
          else throw failure;
        }
      }
    }
    catch (failure) { setError(failure.message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function send(question = draft) {
    const message = typeof question === "string" ? question.trim() : "";
    if (!message || inFlight.current) return;
    if (!providerReady) { setError("AI answers will be available once the app administrator connects Google Gemini."); return; }
    if (!storageAvailable) { setError("Saved chats need to be set up before you can ask a question. Ask the app administrator to finish Copilot setup."); return; }
    if (limitReached) { setNotice("This chat has reached 20 questions. Start a new chat to continue."); return; }
    if (message.length > 3000) { setError("Please keep your question under 3,000 characters."); return; }
    inFlight.current = true; setBusy(true); setError(""); setNotice(""); setPendingMessage(message);
    try {
      const data = await request("/api/copilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, conversationId: activeId, financialYear: snapshot?.financialYear || financialYear || undefined }) });
      const chat = readChat(data);
      setActiveId(chat.id); setMessages(chat.messages); setSnapshot(data.snapshot); setStorageAvailable(true);
      setProfileError(data.snapshot ? "" : "Your financial profile could not be loaded. Select Refresh data to try again.");
      setDraft((current) => current.trim() === message ? "" : current);
      setChats((items) => [{ id: chat.id, title: chat.title, updated_at: chat.updated_at }, ...items.filter((item) => item.id !== chat.id)].slice(0, 30));
    } catch (failure) {
      setDraft(message); setError(failure.message);
      if (failure.code === "AI_NOT_CONFIGURED") setProviderReady(false);
      if (failure.code === "CHAT_NOT_FOUND" || failure.status === 404) recoverMissingChat(activeId);
    }
    finally { inFlight.current = false; setBusy(false); setPendingMessage(""); }
  }
  async function openChat(id) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try { const chat = readChat(await request(`/api/copilot?conversationId=${encodeURIComponent(id)}`)); setActiveId(chat.id); setMessages(chat.messages); setDraft(""); }
    catch (failure) {
      if (failure.code === "CHAT_NOT_FOUND" || failure.status === 404) recoverMissingChat(id);
      else setError(failure.message);
    }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function deleteChat(id) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try { await request(`/api/copilot?conversationId=${encodeURIComponent(id)}`, { method: "DELETE" }); setChats((items) => items.filter((item) => item.id !== id)); if (activeId === id) { setActiveId(null); setMessages([]); } }
    catch (failure) { setError(failure.message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function newChat() {
    if (inFlight.current) return;
    setActiveId(null); setMessages([]); setDraft(""); setError(""); setNotice(""); input.current?.focus();
  }
  const tax = snapshot?.tax;
  const selectedYear = snapshot?.financialYear || financialYear;
  const taxSuffix = selectedYear ? `?year=${encodeURIComponent(selectedYear)}` : "";
  const preparation = snapshot?.preparation;
  const preparationPercent = preparation?.total ? Math.round(preparation.completed / preparation.total * 100) : 0;
  const initials = snapshot?.name && snapshot.name !== "there" ? snapshot.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "FP";
  const selectQuestion = (question) => { setDraft(question); input.current?.focus(); };
  const snapshotRows = [
    { label: "Annual salary / CTC declaration", value: tax?.available ? money(tax.annualSalary) : "Not available", icon: Wallet },
    { label: "Monthly take-home declaration", value: snapshot?.cashflow?.declaredMonthlyTakeHome ? money(snapshot.cashflow.declaredMonthlyTakeHome) : "Not recorded", icon: CalendarDays },
    { label: "Expenses recorded this month", value: snapshot?.spending?.available ? money(snapshot.spending.currentMonth.expenses) : "Not available", icon: FileText },
    { label: "Lower annual tax estimate", value: hasTaxEstimates(tax) ? money(Math.min(tax.old.tax, tax.new.tax)) : "Not available", icon: Percent },
  ];
  const assumptions = [...textList(tax?.warnings), ...textList(snapshot?.dataWarnings)];
  const toolbar = <div className="fp-copilot-toolbar">
    {selectedYear && <FinancialYearSelect year={selectedYear} />}
    <button type="button" disabled={busy} onClick={refresh} className="fp-copilot-icon-button" aria-label="Refresh Copilot data" title="Refresh Copilot data"><RefreshCw size={18} className={busy ? "animate-spin" : ""} /></button>
    <button type="button" className="fp-copilot-history-button" aria-expanded={historyOpen} onClick={() => { historyOpener.current = document.activeElement; setHistoryOpen(true); }}><History size={17} />History</button>
    <button type="button" disabled={busy} onClick={newChat} className="fp-copilot-new-chat"><Plus size={18} />New chat</button>
  </div>;
  return <DashboardLayout showRightSidebar={false} compactNavigation headerActions={toolbar} accountInitials={initials}><div className="fp-copilot-workspace">
    <h1 className="sr-only">Financial Copilot</h1>
    <div className="fp-copilot-mobile-controls">{toolbar}</div>
    {!providerReady && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">AI answers are waiting for setup</p><p className="mt-1 text-xs text-amber-800">Your financial snapshot and saved chats are still available. Ask the app administrator to connect Google Gemini, then select Refresh data.</p></div>}
    {!storageAvailable && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Saved chats need to be set up before you can ask a question. Ask the app administrator to finish Copilot setup, then select Refresh data.</div>}
    {profileError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</div>}
    <div className={`fp-copilot-grid ${contextOpen ? "" : "fp-copilot-context-hidden"}`}>
      <div className="fp-copilot-main-column">
        {!messages.length && !pendingMessage && <section className="fp-copilot-welcome" aria-labelledby="copilot-welcome-heading">
          <div className="fp-copilot-welcome-copy"><span className="fp-copilot-welcome-label">Your financial Copilot</span><h2 id="copilot-welcome-heading">Let’s make sense<br />of <span>your money.</span></h2><p>Ask anything about your spending, saving or taxes.<br className="hidden sm:block" /> Clear answers, with your financial context in view.</p></div>
          <div className="fp-copilot-hero-art"><div className="fp-copilot-chart-tile" aria-hidden="true"><span /><span /><span /><span /></div><Link href="/budget-tracker" className="fp-copilot-plan-tile"><span>Plan<br />smarter</span><ArrowUpRight size={25} aria-hidden="true" /></Link><Sparkles className="fp-copilot-art-sparkle fp-copilot-sparkle-one" size={26} aria-hidden="true" /><Sparkles className="fp-copilot-art-sparkle fp-copilot-sparkle-two" size={17} aria-hidden="true" /></div>
        </section>}
        <section className="fp-copilot-chat-card" aria-label={messages.length ? "Your conversation" : "Quick questions and message"}>
        <div className="space-y-5" role="log" aria-label="Copilot conversation" aria-live="polite" aria-busy={busy}>
          {!messages.length && !pendingMessage && <div className="fp-copilot-quick-questions">
            <div className="fp-copilot-section-heading"><h2>Quick questions</h2><button type="button" onClick={() => setQuestionsExpanded((open) => !open)} aria-expanded={questionsExpanded} aria-controls="copilot-more-questions" className="fp-copilot-text-button">{questionsExpanded ? "Show less" : "See all"}<ArrowRight size={16} aria-hidden="true" /></button></div>
            <div className="fp-copilot-question-groups">{promptGroups.map((group, groupIndex) => <section key={group.label} aria-label={`${group.label} starter questions`}><h3 className="sr-only">{group.label}</h3>{group.items.map((prompt, index) => { const Icon = promptIcons[groupIndex * 3 + index]; return <button key={prompt} type="button" disabled={busy} onClick={() => selectQuestion(prompt)} className="fp-copilot-question"><span className="fp-copilot-question-icon"><Icon size={21} aria-hidden="true" /></span><span>{prompt}</span><ChevronRight size={17} aria-hidden="true" /></button>; })}</section>)}</div>
            <div id="copilot-more-questions" hidden={!questionsExpanded} className="fp-copilot-more-questions">{moreQuestions.map((prompt) => <button key={prompt} type="button" disabled={busy} onClick={() => selectQuestion(prompt)} className="fp-copilot-question"><span>{prompt}</span><ChevronRight size={17} aria-hidden="true" /></button>)}</div>
          </div>}
          {messages.map((message, index) => {
            const sources = validSources(message.sources);
            const calculations = Array.isArray(message.calculations) ? message.calculations : [];
            return message.role === "user" ? <div key={index} className="flex items-end justify-end gap-3"><div className="max-w-[90%] sm:max-w-[80%]"><p className="whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-primary/10 px-5 py-4 text-sm leading-relaxed text-foreground">{message.content}</p><p className="mt-2 text-right text-[10px] text-muted-foreground">{time(message.createdAt)}</p></div><span className="mb-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-primary"><User size={14} /></span></div> : <article key={index} className="fp-card p-5 sm:p-6"><div className="mb-4 flex items-center gap-2 text-xs font-medium text-primary"><Sparkles size={16} />Finpilot Copilot<span className="ml-auto text-[10px] font-normal text-muted-foreground">{time(message.createdAt)}</span></div><p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">{message.content}</p>{calculations.map((result, i) => <Calculation key={i} result={result} />)}{sources.length > 0 && <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4">{sources.map((source, i) => <a key={`${source.url}-${i}`} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">{source.title}<ArrowUpRight size={12} /></a>)}</div>}</article>;
          })}
          {pendingMessage && <><p className="ml-auto max-w-[90%] whitespace-pre-wrap break-words rounded-2xl bg-primary/10 px-5 py-4 text-sm leading-relaxed sm:max-w-[80%]">{pendingMessage}</p><p className="flex items-center gap-2 px-1 text-sm text-muted-foreground"><LoaderCircle size={16} className="animate-spin" />Checking your data and preparing an answer…</p></>}
          <div ref={bottom} />
        </div>
        {messages.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{followUps.map((prompt) => <button key={prompt} type="button" disabled={!canSend} onClick={() => send(prompt)} className="rounded-xl border border-border bg-white px-3 py-2 text-xs text-primary transition-colors hover:bg-muted disabled:opacity-50">{prompt}</button>)}</div>}
        <div className={`${messages.length ? "fp-copilot-composer" : ""} mt-5`}>
          {limitReached && <div role="status" className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">This chat has reached 20 questions. Select New chat to continue.</div>}
          {notice && <div role="status" className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{notice}</div>}
          {error && <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="fp-copilot-input-box">
            <label htmlFor="copilot-question" className="sr-only">Your finance or tax question</label><textarea ref={input} id="copilot-question" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} disabled={busy} maxLength={3000} rows={3} placeholder="Ask me anything about your money, taxes or savings…" />
            <div className="fp-copilot-input-actions"><div className="fp-copilot-file-links"><Link href={`/taxation/salary-documents${taxSuffix}`} title="Manage your private tax proofs. Document contents are not sent to Copilot."><Paperclip size={17} aria-hidden="true" />Tax documents</Link><Link href="/transactions"><Upload size={17} aria-hidden="true" />Upload statement</Link></div><button type="submit" disabled={!canSend || !draft.trim()} className="fp-copilot-send">{busy ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}Send</button></div>
          </form>
          <div className="fp-copilot-composer-meta"><span>Enter to send · Shift + Enter for a new line</span><span>{exchanges}/{MAX_EXCHANGES} questions</span></div>
        </div>
        </section>
        <div className="fp-copilot-footnote"><Info size={14} aria-hidden="true" /><p>Answers use your financial summary and are processed by Google Gemini. Tax figures are estimates; verify eligibility and important decisions. Uploaded document contents are not sent to Copilot.</p><button type="button" className="fp-copilot-context-toggle" aria-expanded={contextOpen} aria-controls="copilot-financial-context" onClick={() => setContextOpen((open) => !open)}><PanelRight size={16} />{contextOpen ? "Hide context" : "Show context"}</button></div>
      </div>
      {contextOpen && <aside id="copilot-financial-context" className="fp-copilot-context">
        <section className="fp-copilot-context-card"><div className="fp-copilot-section-heading"><h2>Your financial context</h2><Link href="/settings" className="fp-copilot-edit"><Pencil size={15} aria-hidden="true" />Edit</Link></div><ul className="fp-copilot-context-rows">{snapshotRows.map(({ label, value, icon: Icon }) => <li key={label}><span className="fp-copilot-context-icon"><Icon size={19} aria-hidden="true" /></span><span>{label}</span><strong>{value}</strong></li>)}</ul>
          <Link href="/settings" className="fp-copilot-profile-link"><span className="fp-copilot-context-icon"><Sparkles size={19} aria-hidden="true" /></span><span><strong>{tax?.available && snapshot?.cashflow?.declaredMonthlyTakeHome ? "Keep your profile up to date" : "Complete your financial profile"}</strong><small>Give your answers more useful context.</small></span><ChevronRight size={18} aria-hidden="true" /></Link>
          {snapshot?.asOf && <p className="fp-copilot-snapshot-date">Snapshot as of {displayDate(snapshot.asOf)} · selected FY {selectedYear}</p>}
          {(hasTaxEstimates(tax) || assumptions.length > 0) && <details className="fp-copilot-assumptions"><summary>Tax estimates and assumptions</summary>{hasTaxEstimates(tax) && <RegimeComparison tax={tax} />}<ul>{assumptions.map((note, i) => <li key={i}>{note}</li>)}</ul><p>Salary-only estimates use declared data. CTC may differ from taxable salary.</p></details>}
        </section>
        <section className="fp-copilot-explore-card"><div className="fp-copilot-section-heading"><h2>Worth exploring</h2><button type="button" className="fp-copilot-text-button" aria-expanded={insightsExpanded} aria-controls="copilot-saved-insights" onClick={() => setInsightsExpanded((open) => !open)}>{insightsExpanded ? "Show less" : "View all"}<ArrowRight size={16} aria-hidden="true" /></button></div><ul className="fp-copilot-explorations">{explorations.map(({ title, detail, icon: Icon, tone, prompt }) => <li key={title}><button type="button" disabled={busy} onClick={() => selectQuestion(prompt)}><span className={`fp-copilot-explore-icon fp-copilot-tone-${tone}`}><Icon size={27} aria-hidden="true" /></span><span><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={18} aria-hidden="true" /></button></li>)}</ul>
          <div id="copilot-saved-insights" hidden={!insightsExpanded} className="fp-copilot-saved-insights"><h3>From your saved context</h3>{snapshot?.insights?.length ? <ul>{snapshot.insights.map((item, index) => <li key={index}><button type="button" disabled={busy} onClick={() => selectQuestion(item.prompt)}>{item.text}<ArrowUpRight size={14} aria-hidden="true" /></button></li>)}</ul> : <p>Insights appear as your saved financial picture takes shape.</p>}</div>
        </section>
      </aside>}
    </div>
    <Link href={`/taxation${taxSuffix}`} className="fp-copilot-preparation" aria-label="Review your tax preparation progress"><span className="fp-copilot-preparation-icon"><Sprout size={25} aria-hidden="true" /></span><strong>Your tax preparation progress</strong><span className="fp-copilot-preparation-track" role={preparation ? "progressbar" : undefined} aria-label="Tax checklist items reviewed" aria-valuemin={preparation ? 0 : undefined} aria-valuemax={preparation?.total} aria-valuenow={preparation?.completed}><span style={{ width: `${preparationPercent}%` }} /></span><span className="fp-copilot-preparation-count">{preparation ? `${preparation.completed} of ${preparation.total} items reviewed` : "Progress unavailable"}</span><span className="fp-copilot-year-end"><CalendarDays size={21} aria-hidden="true" />{preparation?.yearEnd ? `Tax year ${snapshot.asOf > preparation.yearEnd ? "ended" : "ends"} ${displayDate(preparation.yearEnd)}` : "Review your tax workspace"}</span></Link>
    <Dialog.Root open={historyOpen} onOpenChange={setHistoryOpen}><Dialog.Portal><Dialog.Overlay className="fp-drawer-overlay"/><Dialog.Content className="fp-drawer" aria-describedby="copilot-history-description" onCloseAutoFocus={event=>{event.preventDefault();historyOpener.current?.focus();}}><div className="flex items-center justify-between gap-3"><Dialog.Title className="text-2xl font-medium">Recent conversations</Dialog.Title><Dialog.Close asChild><button type="button" className="fp-button !px-3" aria-label="Close conversation history"><X size={18}/></button></Dialog.Close></div><Dialog.Description id="copilot-history-description" className="mt-3 text-sm text-muted-foreground">Your saved conversations. Open one to continue where you left off.</Dialog.Description>{chats.length ? <ul className="mt-6 space-y-3">{chats.map(chat=><li key={chat.id} className="flex items-center rounded-xl border border-border bg-white"><button type="button" disabled={busy} onClick={async()=>{await openChat(chat.id);setHistoryOpen(false);}} className="min-h-14 min-w-0 flex-1 break-words p-4 text-left text-sm hover:text-primary disabled:opacity-50">{chat.title}</button><button type="button" aria-label={`Delete chat: ${chat.title}`} disabled={busy} className="min-h-11 min-w-11 text-muted-foreground hover:text-destructive" onClick={()=>{if(window.confirm("Delete this saved conversation? This cannot be undone."))deleteChat(chat.id);}}><Trash2 size={16}/></button></li>)}</ul> : <p className="mt-8 text-sm text-muted-foreground">{storageAvailable ? "Your first conversation will appear here." : "Saved chats will be available after Copilot setup."}</p>}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </div></DashboardLayout>;
}
