# Finpilot AI Finance & Tax Copilot

The `/taxation/ai-copilot` screen supports questions, personalised insights, promotion/rent/deduction scenarios, loan EMI calculations, and private saved chat history. The Copilot uses Google Gemini. Dashboard Copilot prompts open this same live chat instead of showing canned answers. Bank-statement import uses local parsing and OCR independently of the Copilot. No new npm packages are needed.

## Enable it on your existing app

Run the commands below from the project root containing `package.json`. See [README.md](README.md) for the full application setup.

1. Keep your existing `.env.local` and Supabase settings. Add a server-only `GEMINI_API_KEY` from Google AI Studio. Optionally set `GEMINI_COPILOT_MODEL`; the default is `gemini-3.8-flash`. The separate legacy `GEMINI_MODEL` setting does not control Copilot. `.env.example` shows the variable names. Keep keys out of chat and source control; never use a `NEXT_PUBLIC_` prefix for an AI key. Restart the development server after changing environment settings.
2. If your database already has the Copilot chat migration, no database changes are required for the Gemini switch. Otherwise, on your existing application schema, run **only** `supabase/migrations/20261001_copilot_chats.sql` to create the chat table and row-level security. Do not replay the unrelated historical reset migration: it drops onboarding profiles.
3. Run `npm run test:copilot`, then `npm run dev`. Sign in and complete/update your profile. Open `/taxation/ai-copilot`. Dependencies are already present locally; a fresh checkout needs `npm ci` first.
4. For hosting, set the same environment variables on your server and redeploy. The API route needs a Node runtime and a request duration of up to 90 seconds.

This is an update to an existing app/database. The original repository does not include complete bootstrap SQL for all its financial tables; this addition does not reconstruct those missing schemas.

## Try these conversations

- “Which tax regime is better for me?”
- “If I get promoted, what happens to my tax?” → it should ask for the raise and timing.
- “My gross salary increases from ₹18 lakh to ₹21.6 lakh, starting October, for tax year 2026–27.” → it can calculate the relevant partial-year scenario. Confirm the saved baseline gross salary because the profile currently records CTC.
- “Where is most of my spending going this month?”
- “Can I afford a ₹5 lakh loan at 10% for 36 months?”
- “What if my eligible annual 80C contributions total ₹1.5 lakh?”
- “Explain my Form 16.” → it should explain that no document has been read and ask for relevant figures.

## How it works

`/api/copilot` authenticates the user on every request. It loads the user's current profile, latest salary record, deduction records, six months of spending, current budget and goals server-side. The request accepts only the question and optional owned chat ID. Contact details, account identifiers and merchant descriptions are omitted from model context. Questions and the financial summary are sent to Google Gemini.

Gemini's `generateContent` API interprets questions and explains results. `compare_tax` and `calculate_emi` execute validated server-side calculations through JSON function schemas and strict server-side input validation. Hypothetical changes never update the saved financial profile. Model tool calls are bounded, have timeouts, and cannot modify records or access other accounts. Stored/user text is treated as data, not instructions. Explicit personal tax/EMI amount claims without a matching tool call trigger a repair attempt; this check does not guarantee narrative accuracy. The calculation cards display server results.

Chats are stored in `copilot_chats`, scoped by the authenticated user in queries and protected with RLS. The Copilot never uses a service-role key. A chat supports 20 exchanges; the model receives the full stored conversation text. Users can start a new chat, reopen past chats or delete them. Simultaneous updates are detected using the chat's prior update timestamp. Saved content is validated before use.

Gemini requests use a server-only API key in the `x-goog-api-key` header. The app makes stateless REST calls; it replays full model turns, including thought signatures, during calculator calls. Chats stay in Supabase. This does not guarantee zero provider retention: the question and financial summary are processed by Google, and data handling depends on the project's paid or unpaid service terms. Unpaid services can use submitted content to improve Google products; use appropriate paid-service data controls before handling sensitive financial information. See [Gemini service terms](https://ai.google.dev/gemini-api/terms), [function calling](https://ai.google.dev/gemini-api/docs/function-calling) and [model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash).

Transient connection failures and provider HTTP 500/502/503/504 responses receive at most two automatic retries, sharing a 65-second deadline across calculator turns. Billing, quota and invalid-key failures are not retried. If Gemini remains overloaded, the app shows that cause and preserves the question for retry. A successful earlier live check does not guarantee provider availability; a later greeting check on 5 October 2026 returned HTTP 503 even with an empty financial snapshot. See [Gemini troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting).

## Calculation scope and source verification

Rules were checked on **7 October 2026** against Income Tax Department guidance. The shared tax calculator covers ordinary salary estimates up to ₹10 crore for 2024–25, 2025–26 and 2026–27, with resident age bands, nonresident salary slabs without resident rebates, surcharge and marginal relief. A year explicitly requested in a question can override the saved year for that calculation; both baseline and scenario use that year. They include the selected year's new-regime slabs, standard deductions, resident rebates, rebate marginal relief, cess, HRA, capped declared deductions and separate annual employer/personal NPS.

Year-specific Salary Documents and Tax Saving Proofs are the primary declarations. Legacy profile CTC is a labelled gross-salary proxy when no saved yearly gross salary exists. Salary Documents captures annual qualifying DA for NPS; Rent & HRA captures qualifying monthly DA/commission and rental periods for HRA. Insurance eligibility is assumed only for an estimate; parents use the non-senior limit until confirmed. Home/education-loan interest is excluded until qualifying details are confirmed. Conflicting onboarding/workspace deduction amounts require confirmation; repeated synchronization rows are not silently summed. Legacy employer NPS may have ambiguous monthly/annual units; saving the annual amount in Salary Documents resolves that ambiguity.

Income above ₹10 crore, business income, investment/special-rate gains, foreign assets and unsupported tax years are not calculated. Nonresident treatment covers ordinary Indian salary only; treaty relief and foreign-tax credits are excluded. General questions can still be explained, with missing facts and verification steps identified. There is no live web/market lookup. Maintain the rule set and official references when tax rules change.

Official references:

- [Salaried individuals AY 2026–27](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1)
- [Salaried individuals AY 2025–26](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-3)
- [Salary, HRA and NPS guidance](https://www.incometaxindia.gov.in/en/income-from-salary)
- [New-regime provisions in the Income-tax Act, 2025](https://www.incometaxindia.gov.in/w/section-202-78)
- [Budget 2025 rebate and marginal-relief FAQs](https://incometaxindia.gov.in/Documents/Budget/budget-2025/faqs-budget-2025.pdf)

The routed tax screens, Reports and Copilot use the same yearly declarations and calculator. Historical years use their own saved records. The monthly dashboard shows transaction-derived cashflow, which is distinct from an annual tax estimate.

Monthly TDS is not proof of annual deposited tax. The Copilot does not invent paid-TDS totals or actual refunds. Document flags are not document contents; file upload, document analysis and voice input are not part of this chat integration.

## Validation and deployment limits

`npm run test:copilot` tests promotion timing, slab years, rebate boundaries and rounding, zero overrides, HRA/NPS, privacy filtering, invalid inputs, scoped data access, chat ownership/concurrency, EMI, provider failures and mocked Gemini function calls. These mocks do not verify a live Gemini project, model availability, prompt adherence, Supabase RLS execution or database migrations. Verify those against your configured staging environment before production.

The API has an eight-request/minute per-account process-local burst limit. A production deployment with multiple instances needs shared rate limiting, spending quotas and monitoring. The AI connection must be configured to answer questions. Stored chats can contain sensitive financial text; apply your product's retention and privacy policy.

## Migration verification — 4 October 2026

The Copilot provider has been migrated to Gemini. Existing Supabase chat storage, ownership rules, saved conversations and tax/EMI calculators are preserved. OpenAI settings are no longer used by Copilot; an old local key does not need to be deleted to use Gemini.

In the development environment, a server-only Gemini key was configured and the app was rebuilt. API keys are not included in this repository; each deployment needs its own environment settings. A live greeting and a fictional EMI calculator conversation both succeeded; the fictional ₹5 lakh / 10% / 36-month case returned ₹16,134 monthly EMI. No personal profile or account records were sent in these checks. All 38 Copilot tests, targeted lint and the production build passed. The dashboard shortcut opens the Gemini chat with the selected question ready to review and send. Open `/taxation/ai-copilot` on your running app and sign in with your account.
