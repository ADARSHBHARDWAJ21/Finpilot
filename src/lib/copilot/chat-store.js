import { CopilotError } from "./generate-answer.js";
import { TAX_SOURCES } from "./tax-engine.js";
import { emiSchema, taxChangeSchema } from "./validation.js";

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const invalid = () => { throw new CopilotError("CHAT_INVALID_DATA", 409); };
function text(value, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max) invalid();
  return value;
}
function amount(value, signed = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value > 10000000000 || value < (signed ? -10000000000 : 0)) invalid();
  return value;
}
function notes(value = []) {
  if (!Array.isArray(value) || value.length > 20) invalid();
  return value.map((note) => text(note, 2000));
}
function taxEstimate(value) {
  if (!object(value) || typeof value.available !== "boolean") invalid();
  if (!value.available) return { available: false, reason: text(value.reason, 2000) };
  if (!["2024-25", "2025-26", "2026-27"].includes(value.financialYear) || !["old", "new", "equal"].includes(value.recommended)) invalid();
  const result = { available: true, financialYear: value.financialYear, annualSalary: amount(value.annualSalary), recommended: value.recommended, difference: amount(value.difference), warnings: notes(value.warnings) };
  for (const regime of ["old", "new"]) {
    if (!object(value[regime])) invalid();
    result[regime] = { tax: amount(value[regime].tax), taxableIncome: amount(value[regime].taxableIncome) };
    for (const key of ["baseTax", "rebate", "marginalRelief"]) if (value[regime][key] !== undefined) result[regime][key] = amount(value[regime][key]);
    if (value[regime].deductions !== undefined) {
      if (!object(value[regime].deductions)) invalid();
      result[regime].deductions = {};
      const keys = ["standard", "section80c", "healthInsurance", "personalNps", "personalNpsWithin80c", "employerNps", "hra", "homeLoanInterest", "educationLoanInterest"];
      for (const [key, number] of Object.entries(value[regime].deductions)) {
        if (!keys.includes(key)) invalid();
        result[regime].deductions[key] = amount(number);
      }
    }
  }
  if (value.rulesCheckedOn !== undefined) result.rulesCheckedOn = text(value.rulesCheckedOn, 32);
  return result;
}
function calculation(value) {
  if (!object(value)) invalid();
  if (value.kind === "tax") {
    const changes = taxChangeSchema.safeParse(value.changes || {});
    if (!changes.success) invalid();
    let delta = null;
    if (value.delta != null) {
      if (!object(value.delta)) invalid();
      delta = Object.fromEntries(["oldTax", "newTax", "grossIncome"].map((key) => [key, amount(value.delta[key], true)]));
    }
    return { kind: "tax", baseline: taxEstimate(value.baseline), scenario: taxEstimate(value.scenario), changes: changes.data, delta, assumptions: notes(value.assumptions) };
  }
  if (value.kind === "emi") {
    const inputs = emiSchema.safeParse(value.inputs);
    if (!inputs.success) invalid();
    return { kind: "emi", inputs: inputs.data, monthlyEmi: amount(value.monthlyEmi), totalInterest: amount(value.totalInterest), declaredMonthlyIncome: amount(value.declaredMonthlyIncome), declaredMonthlyCommitted: amount(value.declaredMonthlyCommitted), remainingAfterEmi: value.remainingAfterEmi === null ? null : amount(value.remainingAfterEmi, true), assumptions: notes(value.assumptions) };
  }
  invalid();
}

// RLS establishes ownership; it does not validate content inserted directly through Supabase.
// Rebuild only known fields before any stored data reaches the UI or model history.
export function validateCopilotMessages(messages) {
  if (!Array.isArray(messages) || messages.length > 40 || messages.length % 2 !== 0 || Buffer.byteLength(JSON.stringify(messages), "utf8") > 2000000) invalid();
  return messages.map((message, index) => {
    const role = index % 2 === 0 ? "user" : "assistant";
    if (!object(message) || message.role !== role) invalid();
    const allowed = role === "user" ? ["role", "content", "createdAt"] : ["role", "content", "createdAt", "calculations", "sources"];
    if (Object.keys(message).some((key) => !allowed.includes(key))) invalid();
    const clean = { role, content: text(message.content, role === "user" ? 3000 : 16000) };
    if (message.createdAt !== undefined) {
      if (typeof message.createdAt !== "string" || message.createdAt.length > 40 || !/^\d{4}-\d{2}-\d{2}T/.test(message.createdAt) || !Number.isFinite(Date.parse(message.createdAt))) invalid();
      clean.createdAt = message.createdAt;
    }
    if (role === "assistant") {
      const calculations = message.calculations ?? [];
      const sources = message.sources ?? [];
      if (!Array.isArray(calculations) || calculations.length > 8 || Buffer.byteLength(JSON.stringify(calculations), "utf8") > 64000 || !Array.isArray(sources) || sources.length > 10) invalid();
      clean.calculations = calculations.map(calculation);
      clean.sources = sources.map((source) => {
        if (!object(source) || Object.keys(source).some((key) => !["title", "url"].includes(key))) invalid();
        text(source.title, 240);
        const official = TAX_SOURCES.find((item) => item.url === source.url);
        if (!official) invalid();
        return { ...official };
      });
    }
    return clean;
  });
}

export async function listCopilotChats(supabase, userId) {
  const { data, error } = await supabase.from("copilot_chats").select("id,title,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(30);
  return { chats: data || [], available: !error };
}

export async function readCopilotChat(supabase, userId, id) {
  const { data, error } = await supabase.from("copilot_chats").select("id,title,messages,updated_at").eq("user_id", userId).eq("id", id).maybeSingle();
  if (error) throw new CopilotError("CHAT_STORAGE_UNAVAILABLE");
  if (!data) throw new CopilotError("CHAT_NOT_FOUND", 404);
  return { ...data, messages: validateCopilotMessages(data.messages) };
}

export async function saveCopilotChat(supabase, userId, previous, message, result, now = new Date().toISOString()) {
  const messages = validateCopilotMessages([...(previous?.messages || []), { role: "user", content: message, createdAt: now }, { role: "assistant", content: result.answer, calculations: result.calculations, sources: result.sources, createdAt: now }]);
  const payload = { messages, updated_at: now };
  const query = previous
    ? supabase.from("copilot_chats").update(payload).eq("user_id", userId).eq("id", previous.id).eq("updated_at", previous.updated_at)
    : supabase.from("copilot_chats").insert({ ...payload, user_id: userId, title: message.slice(0, 100) });
  const { data, error } = await query.select("id,title,messages,updated_at").maybeSingle();
  if (error) throw new CopilotError("CHAT_STORAGE_UNAVAILABLE");
  if (!data) throw new CopilotError("CHAT_CHANGED", 409);
  return { ...data, messages };
}
