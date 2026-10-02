# Finpilot AI Finance & Tax Copilot

The `/taxation/ai-copilot` screen supports questions, personalised insights, promotion/rent/deduction scenarios, loan EMI calculations, and private saved chat history. The Copilot uses OpenAI, as requested. Bank-statement import uses local parsing and OCR independently of the Copilot. No new npm packages are needed.

## Enable it on your existing app

The changes are installed in `C:\Users\adars\Downloads\Finpilot-main\Finpilot-main`.

1. Keep your existing `.env.local` and Supabase settings. Add a server-only `OPENAI_API_KEY`. Optionally set `OPENAI_COPILOT_MODEL`; the default is `gpt-5.4-mini`. `.env.example` shows the variable names. Keep keys out of chat and source control; never use a `NEXT_PUBLIC_` prefix for an AI key. Restart the development server after changing environment settings.
2. In your existing Supabase project, run **only** `supabase/migrations/20261001_copilot_chats.sql` to create the chat table and row-level security. Do not replay the unrelated historical reset migration: it drops onboarding profiles.
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

`/api/copilot` authenticates the user on every request. It loads the user's current profile, latest salary record, deduction records, six months of spending, current budget and goals server-side. The request accepts only the question and optional owned chat ID. Contact details, account identifiers and merchant descriptions are omitted from model context. Questions and the financial summary are sent to OpenAI.

OpenAI's Responses API interprets questions and explains results. `compare_tax` and `calculate_emi` execute validated server-side calculations through strict function schemas. Hypothetical changes never update the saved financial profile. Model tool calls are bounded, have timeouts, and cannot modify records or access other accounts. Stored/user text is treated as data, not instructions. Explicit personal tax/EMI amount claims without a matching tool call trigger a repair attempt; this check does not guarantee narrative accuracy. The calculation cards display server results.

Chats are stored in `copilot_chats`, scoped by the authenticated user in queries and protected with RLS. The Copilot never uses a service-role key. A chat supports 20 exchanges; the model receives the full stored conversation text. Users can start a new chat, reopen past chats or delete them. Simultaneous updates are detected using the chat's prior update timestamp. Saved content is validated before use.

OpenAI requests set `store: false` and do not create provider-side conversations. This disables response application-state storage, but it is not a zero-data-retention guarantee. The user's question and financial summary still go to OpenAI; its account data controls and abuse-monitoring policy apply. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data) and [function calling](https://developers.openai.com/api/docs/guides/function-calling).

## Calculation scope and source verification

Rules were checked on **1 October 2026** against Income Tax Department guidance. Tax calculations are salary-only estimates for Indian residents below age 60, at income up to ₹50 lakh, for 2024–25, 2025–26 and 2026–27. A year explicitly requested in a question can override the saved year for that calculation; both baseline and scenario use that year. They include the selected year's new-regime slabs, standard deductions, resident rebates, rebate marginal relief, cess, HRA, capped declared deductions and separate annual employer/personal NPS.

The profile's CTC is a labelled gross-salary proxy, not verified taxable salary. Basic salary is the available HRA/NPS base; DA and qualifying commission are not captured. Insurance eligibility is assumed only for an estimate; parents use the non-senior limit until confirmed. Home/education-loan interest is excluded until qualifying details are confirmed. Conflicting onboarding/workspace deduction amounts require confirmation; repeated synchronization rows are not silently summed. Employer NPS has inconsistent units in the existing forms; ambiguous values need a confirmed annual amount.

Income above ₹50 lakh, senior-citizen rules, business income, investment/special-rate gains, foreign assets, nonresident cases and future tax years are not calculated. General questions can still be explained, with missing facts and verification steps identified. There is no live web/market lookup. Maintain the rule set and official references when tax rules change.

Official references:

- [Salaried individuals AY 2026–27](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1)
- [Salaried individuals AY 2025–26](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-3)
- [Salary, HRA and NPS guidance](https://www.incometaxindia.gov.in/en/income-from-salary)
- [New-regime provisions in the Income-tax Act, 2025](https://www.incometaxindia.gov.in/w/section-202-78)
- [Budget 2025 rebate and marginal-relief FAQs](https://incometaxindia.gov.in/Documents/Budget/budget-2025/faqs-budget-2025.pdf)

The older dashboard/taxation engine is unchanged and can disagree with the corrected Copilot estimates. Bring the rest of the app onto the verified calculator before presenting a single consistent tax recommendation throughout the SaaS.

Monthly TDS is not proof of annual deposited tax. The Copilot does not invent paid-TDS totals or actual refunds. Document flags are not document contents; file upload, document analysis and voice input are not part of this chat integration.

## Validation and deployment limits

`npm run test:copilot` tests promotion timing, slab years, rebate boundaries and rounding, zero overrides, HRA/NPS, privacy filtering, invalid inputs, scoped data access, chat ownership/concurrency, EMI, provider failures and mocked OpenAI function calls. These mocks do not verify a live OpenAI account, model availability, prompt adherence, Supabase RLS execution or database migrations. Verify those against your configured staging environment before production.

The API has an eight-request/minute per-account process-local burst limit. A production deployment with multiple instances needs shared rate limiting, spending quotas and monitoring. The AI connection must be configured to answer questions. Stored chats can contain sensitive financial text; apply your product's retention and privacy policy.

## Local setup status — 1 October 2026

The Copilot migration has been applied successfully to the existing Finpilot Supabase project. An OpenAI key named **Finpilot Copilot App**, limited to the Responses endpoint, is saved in the existing local environment file. No real user financial records were sent in the live provider check.

All 37 Copilot tests, targeted lint checks and the production build passed. Five live database validator checks passed using synthetic messages, including rejection of malformed messages and acceptance of genuine calculator results. Account-to-account RLS behavior still needs an authenticated staging check.

The live check returned `credit_balance_exhausted`. Adding credits has been deferred at your request; setup remains ready. When ready, add API credits to the **adarsh** OpenAI organization, refresh the app and retry. The app reports billing/credit failures separately from temporary rate limits. Local Copilot is available at `http://localhost:3002/taxation/ai-copilot`; sign in with your existing app account.
