import { createClient } from "@/lib/supabase/server-client";
import { loadCopilotContext } from "@/lib/copilot/context";
import { chatRequestSchema, allowCopilotRequest } from "@/lib/copilot/validation";
import { generateCopilotAnswer, CopilotError } from "@/lib/copilot/generate-answer";
import { listCopilotChats, readCopilotChat, saveCopilotChat } from "@/lib/copilot/chat-store";

export const runtime = "nodejs";
export const maxDuration = 90;
const headers = { "Cache-Control": "private, no-store" };
const json = (data, status = 200) => Response.json(data, { status, headers });
const messages = {
  AI_NOT_CONFIGURED: "Copilot's Gemini connection is not configured yet. Your financial snapshot is still available.",
  AI_BUSY: "The AI service is busy. Please try again shortly.",
  AI_CREDITS_EXHAUSTED: "The connected Gemini project has no API credits remaining. Check the project's Google AI Studio billing settings.",
  AI_QUOTA_EXHAUSTED: "Gemini's request or usage quota has been reached. Try again shortly. If this continues, check the project's limits in Google AI Studio.",
  AI_CONNECTION_FAILED: "Could not connect to the AI service. Please try again.",
  AI_KEY_INVALID: "Gemini rejected the configured API key or project access. Please check Copilot's server settings.",
  AI_MODEL_UNAVAILABLE: "The selected Gemini model is unavailable for this project. Please check Copilot's server settings.",
  AI_CONTENT_BLOCKED: "Gemini could not answer this question. Try rephrasing it without sensitive personal identifiers.",
  AI_INCOMPLETE_RESPONSE: "The AI answer was cut short. Please try a shorter question.",
  CHAT_INVALID: "This saved chat contains invalid data. Start a new chat to continue.",
  CHAT_INVALID_DATA: "This saved chat contains invalid data. Start a new chat to continue.",
  CHAT_STORAGE_UNAVAILABLE: "Saved chat history is unavailable. Please ask the app administrator to finish Copilot setup.",
  CHAT_NOT_FOUND: "This chat could not be found in your account.",
  CHAT_CHANGED: "This chat changed in another window. Reopen it before sending again.",
};
function fail(error) {
  const code = error instanceof CopilotError ? error.code : "COPILOT_UNAVAILABLE";
  // Do not log financial questions, model responses, API keys, or database details.
  console.error("Copilot request failed:", code);
  return json({ error: messages[code] || "Copilot could not finish this answer. Please try again.", code }, error.status || 503);
}

async function authenticate() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}
async function boundedJson(req) {
  if (!req.body) throw new CopilotError("INVALID_REQUEST", 400);
  const reader = req.body.getReader();
  const chunks = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 16000) { await reader.cancel(); throw new CopilotError("REQUEST_TOO_LARGE", 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new CopilotError("INVALID_REQUEST", 400); }
}

export async function GET(req) {
  try {
    const { supabase, user } = await authenticate();
    if (!user) return json({ error: "Please sign in to use Copilot." }, 401);
    const id = new URL(req.url).searchParams.get("conversationId");
    if (id) {
      if (!chatRequestSchema.shape.conversationId.unwrap().unwrap().safeParse(id).success) return json({ error: "Invalid chat." }, 400);
      return json({ chat: await readCopilotChat(supabase, user.id, id) });
    }
    const [snapshot, history] = await Promise.all([loadCopilotContext(supabase, user.id), listCopilotChats(supabase, user.id)]);
    return json({ snapshot: snapshot.view, ...history, aiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()) });
  } catch (error) { return fail(error); }
}

export async function POST(req) {
  try {
    const { supabase, user } = await authenticate();
    if (!user) return json({ error: "Please sign in to use Copilot." }, 401);
    const parsed = chatRequestSchema.safeParse(await boundedJson(req));
    if (!parsed.success) return json({ error: "Enter a question of up to 3,000 characters." }, 400);
    if (!process.env.GEMINI_API_KEY?.trim()) throw new CopilotError("AI_NOT_CONFIGURED");
    if (!allowCopilotRequest(user.id)) return json({ error: "Please wait a minute before sending more questions." }, 429);
    const { message, conversationId } = parsed.data;
    const previous = conversationId ? await readCopilotChat(supabase, user.id, conversationId) : null;
    const storage = await listCopilotChats(supabase, user.id);
    if (!storage.available) throw new CopilotError("CHAT_STORAGE_UNAVAILABLE");
    if ((previous?.messages || []).length >= 40) return json({ error: "This chat has reached its limit. Start a new chat to continue." }, 409);
    const snapshot = await loadCopilotContext(supabase, user.id);
    const result = await generateCopilotAnswer({ message, history: previous?.messages || [], context: snapshot.context });
    const chat = await saveCopilotChat(supabase, user.id, previous, message, result);
    return json({ chat, snapshot: snapshot.view });
  } catch (error) { return fail(error); }
}

export async function DELETE(req) {
  try {
    const { supabase, user } = await authenticate();
    if (!user) return json({ error: "Please sign in to use Copilot." }, 401);
    const id = new URL(req.url).searchParams.get("conversationId");
    if (!id || !chatRequestSchema.shape.conversationId.unwrap().unwrap().safeParse(id).success) return json({ error: "Invalid chat." }, 400);
    const { error } = await supabase.from("copilot_chats").delete().eq("user_id", user.id).eq("id", id);
    if (error) throw new CopilotError("CHAT_STORAGE_UNAVAILABLE");
    return json({ ok: true });
  } catch (error) { return fail(error); }
}
