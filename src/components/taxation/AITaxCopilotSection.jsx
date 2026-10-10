"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import FinancialYearSelect from "@/components/finance/FinancialYearSelect";
import { Sparkles, Send, RefreshCw, Plus, Trash2, User, IndianRupee, Wallet, TrendingUp, Info, ArrowUpRight, LoaderCircle, PanelRight, History, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { WorkspaceHeader } from "@/components/layout/WorkspaceUI";

const promptGroups = [{label:"Money",items:["Where is most of my spending going?","Can I afford a new EMI?","How can I improve my monthly savings?"]},{label:"Taxation",items:["Which tax regime is better for me?","Am I missing any eligible deductions?","Explain my HRA exemption and its assumptions."]}];
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
  const snapshotRows = [
    { label: "Annual salary / CTC declaration", value: tax?.available ? money(tax.annualSalary) : "Not available", icon: IndianRupee },
    { label: "Monthly take-home declaration", value: snapshot?.cashflow?.declaredMonthlyTakeHome ? money(snapshot.cashflow.declaredMonthlyTakeHome) : "Not recorded", icon: Wallet },
    { label: "Expenses recorded this month", value: snapshot?.spending?.available ? money(snapshot.spending.currentMonth.expenses) : "Not available", icon: TrendingUp },
    { label: "Lower annual tax estimate", value: hasTaxEstimates(tax) ? money(Math.min(tax.old.tax, tax.new.tax)) : "Not available", icon: IndianRupee },
  ];
  const assumptions = [...textList(tax?.warnings), ...textList(snapshot?.dataWarnings)];
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 py-2">
    <WorkspaceHeader eyebrow="A thoughtful second perspective" title="Financial Copilot" description="Make sense of your money and your tax year, with your saved context in view." meta={`${snapshot?.financialYear ? `FY ${snapshot.financialYear}` : "Tax year not selected"}${snapshot?.asOf ? ` · Snapshot as of ${snapshot.asOf}` : ""}`}>
      <div className="flex flex-wrap items-center gap-2">{snapshot?.financialYear && <FinancialYearSelect year={snapshot.financialYear} />}<button type="button" disabled={busy} onClick={refresh} className="fp-button" aria-label="Refresh Copilot data"><RefreshCw size={15} className={busy ? "animate-spin" : ""} /><span className="sm:sr-only">Refresh data</span></button><button type="button" disabled={busy} onClick={newChat} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"><Plus size={16} />New chat</button></div>
    </WorkspaceHeader>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Money decisions and tax questions, together.</p><div className="flex gap-2"><button type="button" className="fp-button" aria-expanded={historyOpen} onClick={()=>{historyOpener.current=document.activeElement;setHistoryOpen(true);}}><History size={16}/>History</button><button type="button" className="fp-button" aria-expanded={contextOpen} aria-controls="copilot-financial-context" onClick={()=>setContextOpen(open=>!open)}><PanelRight size={16}/>{contextOpen ? "Hide context" : "Show context"}</button></div></div>
    {!providerReady && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">AI answers are waiting for setup</p><p className="mt-1 text-xs text-amber-800">Your financial snapshot and saved chats are still available. Ask the app administrator to connect Google Gemini, then select Refresh data.</p></div>}
    {!storageAvailable && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Saved chats need to be set up before you can ask a question. Ask the app administrator to finish Copilot setup, then select Refresh data.</div>}
    {profileError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</div>}
    <div className={`grid min-w-0 items-start gap-5 ${contextOpen ? "xl:grid-cols-[minmax(0,1fr)_300px]" : ""}`}>
      <div className="min-w-0">
        <div className="space-y-5" role="log" aria-label="Copilot conversation" aria-live="polite" aria-busy={busy}>
          {!messages.length && !pendingMessage && <div className="rounded-[20px] border border-primary/10 bg-[#edf2eb] p-5 sm:p-7">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/10 bg-white/75 text-primary"><Sparkles size={23} strokeWidth={1.7} /></span>
            <h2 className="text-2xl font-medium tracking-tight text-primary">Let’s make sense of your money.</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary/75">Choose a starting question or write your own. Review it below, then send it when you’re ready.</p>
            <div className="mb-6 mt-6 grid gap-5 sm:grid-cols-2">{promptGroups.map(group=><section key={group.label} aria-label={`${group.label} starter questions`}><h3 className="mb-3 text-sm font-medium text-primary">{group.label}</h3><div className="space-y-2">{group.items.map(prompt=><button key={prompt} type="button" disabled={busy} onClick={()=>{setDraft(prompt);input.current?.focus();}} className="flex w-full items-center justify-between gap-3 rounded-xl border border-primary/10 bg-white/75 px-4 py-3 text-left text-sm leading-relaxed text-primary transition-colors hover:border-primary/30 hover:bg-white disabled:opacity-50">{prompt}<ArrowUpRight size={14} className="shrink-0 text-primary/60"/></button>)}</div></section>)}</div>
            <div className="border-t border-primary/10 pt-5"><p className="mb-3 text-xs font-medium text-primary">Your current salary tax picture</p><RegimeComparison tax={tax} />{hasTaxEstimates(tax) && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Salary-only estimate using declared data. CTC may differ from taxable salary. Check assumptions before acting.</p>}</div>
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
          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="fp-card p-4 transition-colors focus-within:border-primary/35 sm:p-5">
            <label htmlFor="copilot-question" className="sr-only">Your finance or tax question</label><textarea ref={input} id="copilot-question" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} disabled={busy} maxLength={3000} rows={3} placeholder="What would you like to understand about your money?" className="min-h-[88px] w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50" />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3"><p className="text-[11px] text-muted-foreground"><span className="hidden sm:inline">Enter to send · </span>{exchanges}/{MAX_EXCHANGES} questions</p><button type="submit" disabled={!canSend || !draft.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}Send</button></div>
          </form>
          <p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-muted-foreground"><Info size={14} className="mt-0.5 shrink-0" />Answers use your financial summary and are processed by Google Gemini. Tax figures are estimates; verify eligibility and important decisions. Document contents are not connected yet.</p>
        </div>
      </div>
      {contextOpen && <aside id="copilot-financial-context" className="fp-sticky-result space-y-4">
        <section className="fp-card p-5"><div className="mb-5 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /><h2 className="text-sm font-medium">Your financial context</h2></div><ul className="divide-y divide-border">{snapshotRows.map(({ label, value, icon: Icon }) => <li key={label} className="flex items-start gap-3 py-3 first:pt-0"><Icon size={16} strokeWidth={1.7} className="mt-1 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-[11px] leading-relaxed text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium tabular-nums text-foreground">{value}</p></div></li>)}</ul><Link href="/settings" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Review financial profile<ArrowUpRight size={13} /></Link><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">A new chat starts with this saved financial profile. Ask for another tax year in your question, or update your profile and refresh.</p>{assumptions.length > 0 && <details className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Data and estimate assumptions</summary><ul className="mt-3 list-disc space-y-2 pl-4 leading-relaxed">{assumptions.map((note, i) => <li key={i}>{note}</li>)}</ul></details>}</section>
        <section className="fp-card p-5"><h2 className="mb-4 text-sm font-medium text-foreground">Worth exploring</h2><ul className="space-y-3">{(snapshot?.insights || []).map((item, index) => <li key={index}><button type="button" disabled={!canSend} onClick={() => send(item.prompt)} className="text-left text-xs leading-relaxed text-muted-foreground hover:text-primary disabled:opacity-50">{item.text}<ArrowUpRight size={12} className="ml-1 inline text-primary" /></button></li>)}</ul>{!snapshot?.insights?.length && <p className="text-xs leading-relaxed text-muted-foreground">Insights appear as your saved financial picture takes shape.</p>}</section>

      </aside>}
    </div>
    <Dialog.Root open={historyOpen} onOpenChange={setHistoryOpen}><Dialog.Portal><Dialog.Overlay className="fp-drawer-overlay"/><Dialog.Content className="fp-drawer" aria-describedby="copilot-history-description" onCloseAutoFocus={event=>{event.preventDefault();historyOpener.current?.focus();}}><div className="flex items-center justify-between gap-3"><Dialog.Title className="text-2xl font-medium">Recent conversations</Dialog.Title><Dialog.Close asChild><button type="button" className="fp-button !px-3" aria-label="Close conversation history"><X size={18}/></button></Dialog.Close></div><Dialog.Description id="copilot-history-description" className="mt-3 text-sm text-muted-foreground">Your saved conversations. Open one to continue where you left off.</Dialog.Description>{chats.length ? <ul className="mt-6 space-y-3">{chats.map(chat=><li key={chat.id} className="flex items-center rounded-xl border border-border bg-white"><button type="button" disabled={busy} onClick={async()=>{await openChat(chat.id);setHistoryOpen(false);}} className="min-h-14 min-w-0 flex-1 break-words p-4 text-left text-sm hover:text-primary disabled:opacity-50">{chat.title}</button><button type="button" aria-label={`Delete chat: ${chat.title}`} disabled={busy} className="min-h-11 min-w-11 text-muted-foreground hover:text-destructive" onClick={()=>{if(window.confirm("Delete this saved conversation? This cannot be undone."))deleteChat(chat.id);}}><Trash2 size={16}/></button></li>)}</ul> : <p className="mt-8 text-sm text-muted-foreground">{storageAvailable ? "Your first conversation will appear here." : "Saved chats will be available after Copilot setup."}</p>}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
