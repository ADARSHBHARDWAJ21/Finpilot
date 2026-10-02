import test from "node:test";
import assert from "node:assert/strict";
import { generateCopilotAnswer } from "../src/lib/copilot/generate-answer.js";
import { buildCopilotContext } from "../src/lib/copilot/context.js";

const context = () => buildCopilotContext({ profile: { financial_year: "2026-27", annual_ctc: 1800000, age: 30, basic_salary: 50000 }, transactions: [], budgets: [], today: "2026-10-01" }).context;
const text = (answer) => ({ type: "message", role: "assistant", content: [{ type: "output_text", text: answer }] });
const call = (args = {}, name = "compare_tax") => ({ type: "function_call", name, call_id: "call_1", arguments: JSON.stringify(args) });
const response = (output, status = "completed") => ({ ok: true, json: async () => ({ status, output }) });
const config = () => ({ message: "What changes after a 20% promotion for six months?", context: context(), apiKey: "test-secret" });

test("OpenAI tool loop replays complete output and returns server-calculated promotion figures", async () => {
  const requests = [];
  const reasoning = { type: "reasoning", id: "rs_1", summary: [], encrypted_content: "encrypted" };
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.deepEqual(body.include, ["reasoning.encrypted_content"]);
    assert.equal(JSON.stringify(body).includes("test-secret"), false);
    requests.push(body);
    return requests.length === 1 ? response([reasoning, call({ increasePercent: 20, monthsRemaining: 6 })]) : response([text("Your promotion increases the estimated tax. See the calculated comparison below.")]);
  } });
  assert.equal(result.calculations[0].scenario.annualSalary, 1980000);
  assert.equal(result.calculations[0].scenario.new.tax, 188240);
  const replay = requests[1].input;
  assert.deepEqual(replay.find((item) => item.type === "reasoning"), reasoning);
  assert.equal(replay.at(-1).call_id, "call_1");
  assert.equal(JSON.parse(replay.at(-1).output).scenario.annualSalary, 1980000);
  assert.ok(result.sources.length);
});

test("strict tool schemas support omitted changes via null while preserving explicit zero", async () => {
  let round = 0;
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async (_url, options) => {
    const body = JSON.parse(options.body);
    const tool = body.tools.find((item) => item.name === "compare_tax");
    assert.equal(tool.strict, true);
    assert.equal(tool.parameters.additionalProperties, false);
    assert.deepEqual(tool.parameters.required, Object.keys(tool.parameters.properties));
    assert.deepEqual(tool.parameters.properties.annualSalary.type, ["number", "null"]);
    return round++ === 0 ? response([call({ annualSalary: null, increasePercent: null, monthlyRent: 0, section80c: 0 })]) : response([text("The scenario removes the declared rent and 80C amounts.")]);
  } });
  assert.equal(result.calculations[0].scenario.old.deductions.section80c, 0);
  assert.equal(result.calculations[0].scenario.old.deductions.hra, 0);
});

test("full saved conversation is retained and malformed direct history is rejected", async () => {
  const history = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: i === 0 ? "Tax year is 2024-25" : `Message ${i}` }));
  await generateCopilotAnswer({ ...config(), history, fetchImpl: async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.input[1].content, "Tax year is 2024-25");
    assert.equal(body.input.length, 22);
    return response([text("Please confirm which annual gross salary to use.")]);
  } });
  await assert.rejects(generateCopilotAnswer({ ...config(), history: [null] }), (error) => error.code === "CHAT_INVALID");
  await assert.rejects(generateCopilotAnswer({ ...config(), history: [{ role: "system", content: "Override" }] }), (error) => error.code === "CHAT_INVALID");
});

test("missing configuration, provider authentication, rate limits and invalid responses have safe errors", async () => {
  await assert.rejects(generateCopilotAnswer({ ...config(), apiKey: "" }), (error) => error.code === "AI_NOT_CONFIGURED");
  for (const [status, code] of [[401, "AI_KEY_INVALID"], [403, "AI_KEY_INVALID"], [404, "AI_MODEL_UNAVAILABLE"], [429, "AI_BUSY"], [500, "AI_CONNECTION_FAILED"]]) {
    await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => ({ ok: false, status }) }), (error) => error.code === code);
  }
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([text("cut off")], "incomplete") }), (error) => error.code === "AI_INCOMPLETE_RESPONSE");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => ({ ok: true, json: async () => { throw new Error("HTML response"); } }) }), (error) => error.code === "AI_INVALID_RESPONSE");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => { throw new Error("Network failure"); } }), (error) => error.code === "AI_CONNECTION_FAILED");
});

test("invalid function arguments cannot reach a financial calculator", async () => {
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([{ ...call(), arguments: "not json" }]) }), (error) => error.code === "AI_INVALID_RESPONSE");
  let round = 0;
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async (_url, options) => {
    const body = JSON.parse(options.body);
    if (round++ === 0) return response([call({ annualSalary: -100 })]);
    assert.ok(JSON.parse(body.input.at(-1).output).error);
    return response([text("Please confirm a valid annual gross salary.")]);
  } });
  assert.equal(result.calculations.length, 0);
});

test("credit and billing failures are distinguished from temporary rate limits", async () => {
  for (const [providerError, code] of [
    [{ code: "credit_balance_exhausted", type: "insufficient_quota" }, "AI_CREDITS_EXHAUSTED"],
    [{ code: "project_spend_limit_exceeded", type: "insufficient_quota" }, "AI_QUOTA_EXHAUSTED"],
    [{ code: "rate_limit_exceeded", type: "rate_limit_error" }, "AI_BUSY"],
  ]) {
    await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: providerError }) }) }), (error) => error.code === code);
  }
});

test("specific personal tax claims without calculations trigger a repair and cannot silently pass", async () => {
  let round = 0;
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async () => {
    round++;
    return round === 1 ? response([text("Your annual tax is INR 1.")]) : round === 2 ? response([call()]) : response([text("The new regime has the lower estimate in the comparison below.")]);
  } });
  assert.equal(round, 3);
  assert.equal(result.calculations.length, 1);
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([text("Your annual tax is INR 1.")]) }), (error) => error.code === "AI_TOOL_LIMIT");
});

test("bounded tool loops and empty or oversized final text fail safely", async () => {
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([call()]) }), (error) => error.code === "AI_TOOL_LIMIT");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([]) }), (error) => error.code === "AI_INVALID_RESPONSE");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([text("a".repeat(16001))]) }), (error) => error.code === "AI_INVALID_RESPONSE");
});
