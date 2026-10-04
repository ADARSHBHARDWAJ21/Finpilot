"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, RefreshCw, Plus, Trash2, User, IndianRupee, Wallet, TrendingUp, Info, ArrowUpRight, LoaderCircle } from "lucide-react";

const prompts = ["Which tax regime is better for me?", "What changes if I get a promotion?", "Where is most of my spending going?", "Am I missing any eligible deductions?", "Can I afford a new EMI?"];
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
  if (!hasTaxEstimates(tax)) return <p className="text-sm text-gray-600">{typeof tax?.reason === "string" ? tax.reason : "Add your financial profile to see estimates."}</p>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">{["old", "new"].map((regime) => {
    const recommended = tax.recommended === regime;
    const change = hasTaxEstimates(baseline) ? tax[regime].tax - baseline[regime].tax : null;
    return <div key={regime} className={`rounded-xl p-4 border ${recommended ? "border-emerald-400 bg-emerald-50/30" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-2"><p className="text-xs text-gray-500 capitalize">{regime} regime</p>{recommended && <span className="text-[10px] font-semibold text-emerald-700">Lower estimate</span>}</div>
      <p className={`text-2xl font-bold mt-1 ${recommended ? "text-emerald-700" : "text-gray-900"}`}>{money(tax[regime].tax)}</p><p className="text-xs text-gray-500 mt-1">Estimated annual tax, including cess</p>
      {change !== null && <p className="text-xs text-gray-600 mt-2">{change >= 0 ? "+" : "−"}{money(Math.abs(change))} compared with saved-profile estimate</p>}
    </div>;
  })}</div>;
}

function Calculation({ result }) {
  if (!result || !["tax", "emi"].includes(result.kind)) return null;
  if (result.kind === "emi" && (!Number.isFinite(result.monthlyEmi) || !Number.isFinite(result.totalInterest))) return null;
  return <div className="mt-4 border-t border-gray-100 pt-3">
    <p className="text-xs font-semibold text-gray-800">{result.kind === "tax" ? `Calculated tax scenario${typeof result.scenario?.financialYear === "string" ? ` · Tax year ${result.scenario.financialYear}` : ""}` : "Calculated loan scenario"}</p>
    {result.kind === "tax" ? <RegimeComparison tax={result.scenario} baseline={result.baseline} /> : <div className="grid grid-cols-2 gap-3 mt-2 text-sm"><p><span className="block text-xs text-gray-500">Monthly EMI</span><strong>{money(result.monthlyEmi)}</strong></p><p><span className="block text-xs text-gray-500">Total interest</span><strong>{money(result.totalInterest)}</strong></p>{Number.isFinite(result.remainingAfterEmi) && <p className="col-span-2 text-xs text-gray-600">Remaining from declared monthly cashflow: {money(result.remainingAfterEmi)}</p>}</div>}
    <details className="mt-3 text-xs text-gray-500"><summary className="cursor-pointer">Assumptions and calculation limits</summary><ul className="list-disc pl-4 mt-2 space-y-1">{[...textList(result.assumptions), ...textList(result.scenario?.warnings)].map((note, i) => <li key={i}>{note}</li>)}</ul></details>
  </div>;
}

export default function AITaxCopilotSection({ initialSnapshot, initialChats = [], historyAvailable = true, initialError = "", aiConfigured = false, initialQuestion = "" }) {
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
  const inFlight = useRef(false);
  const bottom = useRef(null);
  const input = useRef(null);
  const exchanges = messages.filter((message) => message.role === "user").length;
  const limitReached = exchanges >= MAX_EXCHANGES;
  const canSend = !busy && providerReady && storageAvailable && !limitReached;
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, pendingMessage]);

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
      const data = await request("/api/copilot");
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
      const data = await request("/api/copilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, conversationId: activeId }) });
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
  const firstName = snapshot?.name?.split(" ")[0] || "there";
  const tax = snapshot?.tax;
  const snapshotRows = [
    { label: "Annual salary / CTC declaration", value: tax?.available ? money(tax.annualSalary) : "Not available", icon: IndianRupee },
    { label: "Monthly take-home declaration", value: snapshot?.cashflow?.declaredMonthlyTakeHome ? money(snapshot.cashflow.declaredMonthlyTakeHome) : "Not recorded", icon: Wallet },
    { label: "Expenses recorded this month", value: snapshot?.spending?.available ? money(snapshot.spending.currentMonth.expenses) : "Not available", icon: TrendingUp },
    { label: "Lower annual tax estimate", value: hasTaxEstimates(tax) ? money(Math.min(tax.old.tax, tax.new.tax)) : "Not available", icon: IndianRupee },
  ];
  const assumptions = [...textList(tax?.warnings), ...textList(snapshot?.dataWarnings)];
  return <div className="flex flex-col min-h-[calc(100dvh-8rem)] lg:min-h-[calc(100vh-3rem)]">
    <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5"><div><div className="flex items-center gap-2"><h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI Finance & Tax Copilot</h1><span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-1 rounded-full">Gemini</span></div><p className="text-sm text-gray-500 mt-1">Answers and what-if scenarios based on your saved financial data.</p><p className="text-xs text-gray-500 mt-1">{snapshot?.financialYear ? `Saved profile tax year ${snapshot.financialYear}` : "Tax year not selected"}{snapshot?.asOf ? ` · Data refreshed ${snapshot.asOf}` : ""}</p></div><div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={refresh} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 disabled:opacity-50"><RefreshCw size={14} />Refresh data</button><button type="button" disabled={busy} onClick={newChat} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs text-white disabled:opacity-50"><Plus size={14} />New chat</button></div></header>
    {!providerReady && <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">AI answers are waiting for setup</p><p className="text-xs text-amber-800 mt-1">Your financial snapshot and saved chats are still available. Ask the app administrator to connect Google Gemini, then select Refresh data.</p></div>}
    {!storageAvailable && <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Saved chats need to be set up before you can ask a question. Ask the app administrator to finish Copilot setup, then select Refresh data.</div>}
    {profileError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</div>}
    <div className="flex flex-1 flex-col lg:flex-row gap-5 min-w-0">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex gap-2 overflow-x-auto pb-4">{prompts.map((prompt) => <button key={prompt} type="button" disabled={!canSend} onClick={() => send(prompt)} className="shrink-0 text-xs text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-full hover:border-indigo-300 disabled:opacity-50">{prompt}</button>)}</div>
        <div className="flex-1 space-y-4 mb-4" role="log" aria-label="Copilot conversation" aria-live="polite" aria-busy={busy}>
          {!messages.length && !pendingMessage && <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-5"><div className="flex items-start gap-3"><Sparkles size={20} className="text-indigo-600 shrink-0 mt-1" /><div><p className="text-sm text-gray-800"><strong>Hi {firstName}.</strong> Ask about your taxes, spending, savings or a financial decision.</p><p className="text-xs text-gray-500 mt-2">For a promotion, tell me the raise amount, when it starts and the tax year. I can compare both regimes and explain the change.</p></div></div><RegimeComparison tax={tax} />{hasTaxEstimates(tax) && <p className="text-xs text-gray-500 mt-3">Salary-only estimate using declared data. CTC may differ from taxable salary. Check assumptions before acting.</p>}</div>}
          {messages.map((message, index) => {
            const sources = validSources(message.sources);
            const calculations = Array.isArray(message.calculations) ? message.calculations : [];
            return message.role === "user" ? <div key={index} className="flex justify-end gap-2 items-end"><div className="max-w-[90%] sm:max-w-[75%]"><p className="bg-violet-100 border border-violet-200 px-4 py-3 rounded-2xl rounded-br-sm text-sm text-gray-900 whitespace-pre-wrap break-words">{message.content}</p><p className="text-[10px] text-gray-400 text-right mt-1">{time(message.createdAt)}</p></div><User size={16} className="text-indigo-500 shrink-0 mb-5" /></div> : <article key={index} className="bg-white rounded-xl border border-gray-200 p-5"><div className="flex gap-3"><Sparkles size={17} className="text-indigo-600 shrink-0 mt-1" /><p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{message.content}</p></div>{calculations.map((result, i) => <Calculation key={i} result={result} />)}{sources.length > 0 && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{sources.map((source, i) => <a key={`${source.url}-${i}`} href={source.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1">{source.title}<ArrowUpRight size={12} /></a>)}</div>}<p className="text-[10px] text-gray-400 mt-3">{time(message.createdAt)}</p></article>;
          })}
          {pendingMessage && <><p className="ml-auto max-w-[90%] sm:max-w-[75%] bg-violet-100 rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap break-words">{pendingMessage}</p><p className="flex items-center gap-2 text-sm text-gray-500"><LoaderCircle size={16} className="animate-spin" />Checking your data and preparing an answer…</p></>}
          <div ref={bottom} />
        </div>
        <div className="flex gap-2 overflow-x-auto py-3">{followUps.map((prompt) => <button key={prompt} type="button" disabled={!canSend} onClick={() => send(prompt)} className="shrink-0 text-xs text-indigo-700 bg-white border border-indigo-200 px-3 py-2 rounded-full hover:bg-indigo-50 disabled:opacity-50">{prompt}</button>)}</div>
        <p className="mb-3 text-xs text-gray-500">{exchanges} of {MAX_EXCHANGES} questions used. Replies use all saved messages in this chat. A new chat starts with your saved financial profile.</p>
        {limitReached && <div role="status" className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">This chat has reached 20 questions. Select New chat to continue.</div>}
        {notice && <div role="status" className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{notice}</div>}
        {error && <div role="alert" className="mb-3 border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
        <form onSubmit={(event) => { event.preventDefault(); send(); }} className="bg-white rounded-xl border border-gray-200 p-4"><label htmlFor="copilot-question" className="sr-only">Your finance or tax question</label><textarea ref={input} id="copilot-question" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} disabled={busy} maxLength={3000} rows={3} placeholder="Ask about your taxes, spending or a what-if scenario…" className="w-full text-sm text-gray-900 resize-none outline-none bg-transparent min-h-[64px] disabled:opacity-50" /><div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100"><p className="text-[11px] text-gray-500">Enter to send · Shift + Enter for a new line</p><button type="submit" disabled={!canSend || !draft.trim()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}Send</button></div></form>
        <p className="text-[11px] text-gray-500 mt-3 flex gap-2"><Info size={14} className="shrink-0 mt-0.5" />Answers use your financial summary and are processed by Google Gemini. Tax figures are estimates; verify eligibility and important decisions. Document contents are not connected yet.</p>
      </div>
      <aside className="w-full lg:w-[280px] shrink-0 space-y-4">
        <section className="bg-white rounded-xl border border-gray-200 p-4"><h2 className="text-sm font-semibold text-gray-900 mb-4">Your data snapshot</h2><ul className="space-y-4">{snapshotRows.map(({ label, value, icon: Icon }) => <li key={label} className="flex items-start gap-2"><Icon size={15} className="text-indigo-500 shrink-0 mt-1" /><div className="flex-1"><p className="text-[11px] text-gray-500">{label}</p><p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p></div></li>)}</ul><Link href="/settings" className="text-xs text-indigo-600 hover:underline inline-block mt-4">Review your financial profile</Link><p className="text-[11px] text-gray-500 mt-2">Ask for another tax year in your question, or update your profile in Settings and refresh this data.</p>{assumptions.length > 0 && <details className="mt-3 text-xs text-gray-500"><summary className="cursor-pointer">Data and estimate assumptions</summary><ul className="list-disc pl-4 space-y-2 mt-2">{assumptions.map((note, i) => <li key={i}>{note}</li>)}</ul></details>}</section>
        <section className="bg-white rounded-xl border border-gray-200 p-4"><h2 className="text-sm font-semibold text-gray-900 mb-3">Insights for you</h2><ul className="space-y-3">{(snapshot?.insights || []).map((item, index) => <li key={index}><button type="button" disabled={!canSend} onClick={() => send(item.prompt)} className="text-xs text-gray-700 text-left leading-relaxed hover:text-indigo-700 disabled:opacity-50">{item.text}<ArrowUpRight size={12} className="inline ml-1 text-indigo-400" /></button></li>)}</ul></section>
        <section className="bg-white rounded-xl border border-gray-200 p-4"><h2 className="text-sm font-semibold text-gray-900 mb-3">Your saved chats</h2>{!storageAvailable ? <p className="text-xs text-gray-500">Saved chats will be available after Copilot setup is complete.</p> : !chats.length ? <p className="text-xs text-gray-500">Your first conversation will appear here.</p> : <ul className="space-y-2">{chats.map((chat) => <li key={chat.id} className={`flex items-start gap-1 rounded-lg ${activeId === chat.id ? "bg-indigo-50" : ""}`}><button type="button" disabled={busy} onClick={() => openChat(chat.id)} className="flex-1 p-2 text-left text-xs text-gray-700 leading-relaxed hover:text-indigo-700 disabled:opacity-50 break-words">{chat.title}</button><button type="button" disabled={busy} onClick={() => deleteChat(chat.id)} aria-label={`Delete chat: ${chat.title}`} className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"><Trash2 size={13} /></button></li>)}</ul>}</section>
      </aside>
    </div>
  </div>;
}
