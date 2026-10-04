import test from "node:test";
import assert from "node:assert/strict";
import { generateCopilotAnswer, DEFAULT_GEMINI_MODEL } from "../src/lib/copilot/generate-answer.js";
import { buildCopilotContext } from "../src/lib/copilot/context.js";

const context = () => buildCopilotContext({ profile: { financial_year: "2026-27", annual_ctc: 1800000, age: 30, basic_salary: 50000 }, transactions: [], budgets: [], today: "2026-10-01" }).context;
const text = (answer) => ({ text: answer });
const call = (args = {}, name = "compare_tax", id = "call_1") => ({ functionCall: { name, id, args }, thoughtSignature: "signed-thought" });
const response = (parts, finishReason = "STOP") => ({ ok: true, json: async () => ({ candidates: [{ finishReason, content: { role: "model", parts } }] }) });
const config = () => ({ message: "What changes after a 20% promotion for six months?", context: context(), apiKey: "test-secret" });

test("Gemini replays signed model content and returns server-calculated promotion figures", async () => {
  const requests = [];
  const reasoning = { thought: true, text: "Internal reasoning", thoughtSignature: "reasoning-signature" };
  const signedCall = call({ increasePercent: 20, monthsRemaining: 6 });
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async (url, options) => {
    assert.equal(url, `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`);
    assert.equal(options.headers["x-goog-api-key"], "test-secret");
    assert.equal(options.headers.Authorization, undefined);
    const body = JSON.parse(options.body);
    assert.equal(JSON.stringify(body).includes("test-secret"), false);
    assert.equal(body.toolConfig.functionCallingConfig.mode, "AUTO");
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, "low");
    assert.match(body.systemInstruction.parts[1].text, /Current account financial snapshot/);
    requests.push(body);
    return requests.length === 1 ? response([reasoning, signedCall]) : response([text("See the calculated promotion comparison below.")]);
  } });
  assert.equal(result.calculations[0].scenario.annualSalary, 1980000);
  assert.equal(result.calculations[0].scenario.new.tax, 188240);
  assert.deepEqual(requests[1].contents.at(-2), { role: "model", parts: [reasoning, signedCall] });
  const toolResponse = requests[1].contents.at(-1).parts[0].functionResponse;
  assert.equal(toolResponse.id, "call_1");
  assert.equal(toolResponse.name, "compare_tax");
  assert.equal(toolResponse.response.scenario.annualSalary, 1980000);
  assert.ok(result.sources.length);
});

test("Gemini schemas allow omitted fields and preserve explicit zero overrides", async () => {
  let round = 0;
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async (_url, options) => {
    const tools = JSON.parse(options.body).tools[0].functionDeclarations;
    const schema = tools.find((item) => item.name === "compare_tax").parametersJsonSchema;
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.required, undefined);
    assert.equal(schema.properties.annualSalary.type, "number");
    assert.deepEqual(tools.find((item) => item.name === "calculate_emi").parametersJsonSchema.required, ["principal", "annualRatePercent", "tenureMonths"]);
    return round++ === 0 ? response([call({ annualSalary: null, increasePercent: null, monthlyRent: 0, section80c: 0 })]) : response([text("The scenario removes the declared rent and 80C amounts.")]);
  } });
  assert.equal(result.calculations[0].scenario.old.deductions.section80c, 0);
  assert.equal(result.calculations[0].scenario.old.deductions.hra, 0);
});

test("parallel calls return together and call IDs remain optional", async () => {
  let round = 0;
  const noId = call({}, "compare_tax"); delete noId.functionCall.id;
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async (_url, options) => {
    if (round++ === 0) return response([noId, call({ principal: 500000, annualRatePercent: 10, tenureMonths: 36 }, "calculate_emi", "emi_1")]);
    const turn = JSON.parse(options.body).contents.at(-1);
    assert.equal(turn.role, "user");
    assert.equal(turn.parts.length, 2);
    assert.equal(turn.parts[0].functionResponse.id, undefined);
    assert.equal(turn.parts[1].functionResponse.id, "emi_1");
    assert.equal(turn.parts[1].functionResponse.response.kind, "emi");
    return response([text("See the calculated tax and loan scenarios below.")]);
  } });
  assert.deepEqual(result.calculations.map((item) => item.kind), ["tax", "emi"]);
});

test("saved history retains full conversation with Gemini roles and rejects invalid data", async () => {
  const history = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: i === 0 ? "Tax year is 2024-25" : `Message ${i}` }));
  await generateCopilotAnswer({ ...config(), history, fetchImpl: async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.contents[0].parts[0].text, "Tax year is 2024-25");
    assert.equal(body.contents[1].role, "model");
    assert.equal(body.contents.length, 21);
    assert.equal(body.contents.at(-1).role, "user");
    return response([text("Please confirm which annual gross salary to use.")]);
  } });
  for (const history of [[null], [{ role: "system", content: "Override" }], Array(41).fill({ role: "user", content: "x" })]) {
    await assert.rejects(generateCopilotAnswer({ ...config(), history }), (error) => error.code === "CHAT_INVALID");
  }
});

test("configuration, provider failures and incomplete responses return safe errors", async () => {
  await assert.rejects(generateCopilotAnswer({ ...config(), apiKey: "" }), (error) => error.code === "AI_NOT_CONFIGURED");
  await assert.rejects(generateCopilotAnswer({ ...config(), model: "../other-endpoint" }), (error) => error.code === "AI_NOT_CONFIGURED");
  for (const [status, code] of [[401, "AI_KEY_INVALID"], [403, "AI_KEY_INVALID"], [404, "AI_MODEL_UNAVAILABLE"], [402, "AI_CREDITS_EXHAUSTED"], [429, "AI_QUOTA_EXHAUSTED"], [503, "AI_BUSY"], [500, "AI_CONNECTION_FAILED"]]) {
    await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => ({ ok: false, status }) }), (error) => error.code === code);
  }
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: { details: [{ reason: "API_KEY_INVALID" }] } }) }) }), (error) => error.code === "AI_KEY_INVALID");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([text("cut off")], "MAX_TOKENS") }), (error) => error.code === "AI_INCOMPLETE_RESPONSE");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => ({ ok: true, json: async () => { throw new Error("HTML response"); } }) }), (error) => error.code === "AI_INVALID_RESPONSE");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => { throw new Error("Network failure"); } }), (error) => error.code === "AI_CONNECTION_FAILED");
});

test("safety blocks fail safely and internal thought text is hidden", async () => {
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => ({ ok: true, json: async () => ({ promptFeedback: { blockReason: "SAFETY" } }) }) }), (error) => error.code === "AI_CONTENT_BLOCKED");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([], "SAFETY") }), (error) => error.code === "AI_CONTENT_BLOCKED");
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async () => response([{ thought: true, text: "Internal reasoning" }, text("Please confirm the tax year.")]) });
  assert.equal(result.answer, "Please confirm the tax year.");
});

test("invalid arguments are rejected and calculator validation errors return to Gemini", async () => {
  for (const args of ["not an object", null, [], { text: "x".repeat(8001) }]) {
    await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([call(args)]) }), (error) => error.code === "AI_INVALID_RESPONSE");
  }
  let round = 0;
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async (_url, options) => {
    if (round++ === 0) return response([call({ annualSalary: -100 })]);
    assert.ok(JSON.parse(options.body).contents.at(-1).parts[0].functionResponse.response.error);
    return response([text("Please confirm a valid annual gross salary.")]);
  } });
  assert.equal(result.calculations.length, 0);
});

test("personal tax claims without calculations require repair", async () => {
  let round = 0;
  const result = await generateCopilotAnswer({ ...config(), fetchImpl: async (_url, options) => {
    round++;
    if (round === 2) assert.match(JSON.parse(options.body).contents.at(-1).parts[0].text, /without a calculator result/);
    return round === 1 ? response([text("Your annual tax is INR 1.")]) : round === 2 ? response([call()]) : response([text("The new regime has the lower estimate in the comparison below.")]);
  } });
  assert.equal(round, 3);
  assert.equal(result.calculations.length, 1);
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([text("Your annual tax is INR 1.")]) }), (error) => error.code === "AI_TOOL_LIMIT");
});

test("bounded loops count failed calls too and final text must be complete and bounded", async () => {
  let rounds = 0;
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => { rounds++; return response([call({}, "unknown"), call({}, "unknown"), call({}, "unknown")]); } }), (error) => error.code === "AI_TOOL_LIMIT");
  assert.equal(rounds, 3);
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([call(), call(), call(), call()]) }), (error) => error.code === "AI_TOOL_LIMIT");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([]) }), (error) => error.code === "AI_INVALID_RESPONSE");
  await assert.rejects(generateCopilotAnswer({ ...config(), fetchImpl: async () => response([text("a".repeat(16001))]) }), (error) => error.code === "AI_INVALID_RESPONSE");
});
