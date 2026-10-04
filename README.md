# Finpilot

Finpilot is a personal finance and tax planning web app for Indian salaried users. It brings transaction tracking, bank-statement imports, monthly budgets, financial goals, tax workspaces and a Gemini-powered Copilot into one dashboard. The interface uses the **FinCopilot** name.

Built with Next.js, React and Supabase. This is an actively developed application: the dashboard, imports and Copilot are connected to saved data, while the standalone Investments and Net Worth pages are still marked **Coming Soon**.

## Features

### Monthly financial dashboard

- Time-aware greeting and live clock in India Standard Time.
- Click the month badge to select a previous month or year, or return to the current month.
- Income, expenses, savings, transaction counts, category spending, budgets and recent activity follow the selected month.
- The selected month is stored in the URL and survives a page refresh.
- Balance history includes transactions only through the selected month. The recorded balance is cumulative recorded income minus expenses; it does not include opening bank balances or asset valuations.
- The dashboard reads all pages of transaction history rather than stopping at Supabase's default row limit.
- Visible dashboard data refreshes every 30 seconds and when the window regains focus or reconnects. Refresh pauses while the month picker or transaction dialog is open. This is periodic refresh of saved records, not a live bank connection.
- Months without records show empty states instead of sample financial figures.

### Transactions and bank-statement imports

- Add income or expenses manually, filter transactions, and delete entries.
- Import CSV, Excel, digital PDFs, scanned PDFs, and PNG/JPEG/WebP statement images.
- Automatically extract dates, descriptions, amounts, transaction direction, categories and payment methods.
- Review detected rows before saving; every row has an editable category dropdown before **Import**.
- Merchant and description rules suggest categories. Unrecognized transactions remain available for review.
- Detect duplicate imports without discarding legitimate repeated transactions within a statement.
- Local OCR and PDF parsing handle wrapped descriptions, continuation pages, and common bank tables, including tested Canara-style layouts.
- Limits: **10 MB per file, 20 pages per PDF, and 1,000 rows per import**. Password-protected PDFs require their password for extraction.

See [Bank statement import](STATEMENT_IMPORT.md) for supported layouts, completeness checks, duplicate handling and OCR tests. A sample CSV is available at [public/templates/transactions.csv](public/templates/transactions.csv).

### Gemini finance and tax Copilot

- Ask questions about saved finances, spending, salary changes, deductions and loans.
- Compare supported tax scenarios and calculate EMI through validated server-side calculators.
- Continue, reopen and delete private saved conversations; each chat supports up to 20 exchanges.
- Dashboard prompt shortcuts open the full Copilot with the question ready to review and send.
- The API key stays on the server. Copilot currently uses the Gemini `generateContent` API, with `gemini-3.8-flash` as its configurable default.

See [Copilot setup and calculation scope](COPILOT_SETUP.md) for provider configuration, privacy, supported tax years and calculation assumptions.

### Other workspaces

- **Authentication and onboarding:** Supabase email/password sign-in and a saved financial profile.
- **Budget tracker:** Monthly category limits and spending from recorded transactions.
- **Taxation:** Salary information, deductions, regime comparison, liability tracking and scenario views.
- **Goals:** Saved financial goals and related calendar entries.
- **Calendar and reminders:** Financial and tax planning views derived from the saved workspace.
- **Reports:** Financial and tax report views based on the available profile and transactions.
- **Settings:** Update profile and financial declarations.

Some older workspace calculations and UI elements still need production validation. Investments, external portfolio connections and the standalone Net Worth aggregator are not implemented integrations.

## Technology

- **Application:** Next.js 16 App Router and React 19.
- **Styling and UI:** Tailwind CSS 4, Radix UI, Lucide icons and Recharts.
- **Authentication and database:** Supabase Auth and PostgreSQL through `@supabase/ssr`.
- **AI:** Google Gemini REST API, called only from the server.
- **Validation and forms:** Zod and React Hook Form.
- **Imports:** Papa Parse, SheetJS, PDF.js / pdf-parse, Tesseract.js, Sharp and Canvas.
- **Tests:** Node.js built-in test runner with synthetic fixtures and simulated database/provider responses.

## Local setup

### 1. Prerequisites

- Node.js **24** (used for local validation), or a compatible Node.js **22.3+** release.
- npm and Git.
- A Supabase project with the application's existing database schema.
- A Gemini API key if you want Copilot answers. Transaction imports and local OCR do not require an AI key.

### 2. Clone and install

```bash
git clone https://github.com/ADARSHBHARDWAJ21/Finpilot.git
cd Finpilot
npm ci
```

Run commands from the directory containing `package.json`. If using a downloaded ZIP, this may be a nested `Finpilot-main` directory.

### 3. Configure the environment

Copy [.env.example](.env.example) to `.env.local`:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill in your own values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_COPILOT_MODEL=gemini-3.8-flash
```

The two Supabase values configure the browser and server clients. `GEMINI_API_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix. `GEMINI_COPILOT_MODEL` is optional; omitting it uses the default shown above. The legacy `GEMINI_MODEL` setting does not control Copilot.

Leave the Gemini key empty if configuring the rest of the app first. Restart the server after changing environment settings. `.env.local`, dependencies, build output and local caches are excluded from Git; only the placeholder `.env.example` is shared.

### 4. Configure Supabase

This repository was developed against an existing Supabase project. **It does not yet contain a complete database bootstrap for a brand-new project.** Reuse the existing configured project, or provision the missing legacy schema before expecting all screens to work.

The app uses `transactions`, `onboarding_profiles`, `salary_profiles`, `deductions`, `tax_calculations`, `budget_plans`, `ai_insights` and `copilot_chats`. Goals are stored in the onboarding profile's workspace data.

Available migration files include:

- [Monthly budget plans](supabase/migrations/20260526_budget_plans.sql).
- [Onboarding profiles](supabase/migrations/20260527_onboarding_profiles.sql).
- [Private Copilot chat storage](supabase/migrations/20261001_copilot_chats.sql).
- An optional confidence-score alteration for an existing transaction table.

Review and apply only the migrations your project needs. **Do not blindly run every migration:** `20260527_reset_onboarding_profiles_option_a.sql` is a destructive reset that drops onboarding profiles. Keep row-level security configured for each user's records.

Configure Supabase Auth for your local or deployed app URL and email confirmation settings. The Copilot migration needs to be applied once; switching the AI provider or using the dashboard month picker requires no additional database migration.

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an account or sign in, then complete onboarding.

To use a different port:

```bash
npm run dev -- --port 3002
```

## Main routes

- `/dashboard` — current financial overview; `/dashboard?month=2026-09` opens a historical month.
- `/transactions` — manual transactions and statement imports.
- `/budget-tracker` — monthly budget planning.
- `/taxation` — taxation workspace.
- `/taxation/ai-copilot` — Gemini finance and tax conversations.
- `/taxation/compare-regimes`, `/taxation/deductions`, `/taxation/simulation`, `/taxation/liability-tracker` — tax tools.
- `/goals`, `/calendar`, `/reminders`, `/reports` — planning and reporting.
- `/settings` — saved financial profile.
- `/investments`, `/net-worth` — future-feature previews.

Protected routes require a Supabase session.

## Testing and builds

```bash
npm test
npm run test:copilot
npm run test:imports
npm run test:dashboard
npm run lint
npm run build
```

`npm test` runs the automated suites together. Coverage includes transaction parsing and deduplication, category review, Copilot calculator calls and failures, chat ownership, India-time greetings, historical month boundaries and empty months. Fixtures use synthetic data. Mocked tests do not prove live database policies, provider availability or every bank's PDF layout.

Four OCR integration tests are opt-in because they use local image/PDF recognition and can need the language-data download. To include them on PowerShell:

```powershell
$env:RUN_OCR_TESTS = "1"
npm run test:imports
Remove-Item Env:RUN_OCR_TESTS
```

On macOS/Linux:

```bash
RUN_OCR_TESTS=1 npm run test:imports
```

Repository-wide lint currently includes legacy React hook violations; it is not a clean release gate yet. The dashboard and Copilot production builds have been validated separately. Next.js also reports the existing middleware-to-proxy convention deprecation.

## Deployment

```bash
npm ci
npm run build
npm start
```

Deploy to a platform that supports Next.js **Node.js server execution**. A static export cannot run authentication actions, statement processing or Copilot requests.

- Set the environment variables on the deployment platform; local `.env.local` is not uploaded to GitHub.
- Use the matching Supabase schema and configure the deployed authentication URL.
- Allow up to **90 seconds** for Copilot requests and **180 seconds** for statement processing, subject to the host's limits.
- Ensure the host supports the PDF/OCR native dependencies and enough memory for statement processing.
- OCR downloads English language data when needed and caches it under `.cache/ocr`; ephemeral hosts may download it again.
- Builds may need network access for the project's Google fonts.
- Multi-instance production deployments need shared rate limiting and database-backed import locking. Current request limits and import serialization are process-local.

## Data handling and limits

The main statement-upload flow parses statements locally on the app server and saves only reviewed transaction fields to Supabase. That flow does not send the original statement to Gemini. PDF passwords are used for extraction and are not stored. Older extraction endpoints remain in the codebase; this description applies to the current Transactions upload flow.

Copilot sends the question, conversation text and a limited financial summary to Google Gemini. Contact details, account identifiers and merchant descriptions are omitted from its generated snapshot. Provider data handling depends on the Gemini project's service terms; see [COPILOT_SETUP.md](COPILOT_SETUP.md) before processing sensitive financial information.

Copilot tax calculations cover ordinary salary estimates for resident individuals below 60, income up to ₹50 lakh and the supported financial years 2024–25 through 2026–27. They do not establish deposited TDS, an actual tax refund, investment returns or loan approval. CTC can differ from taxable salary. The legacy taxation screens use a separate calculation path and can differ from Copilot.

No bank account is connected automatically, no tax return is filed, and no investment is purchased by this app. Statement extraction may need correction for unfamiliar layouts or poor scans. Review imported transactions and important financial estimates before relying on them.

## Project structure

```text
src/
  app/                 Routes, API handlers and server actions
  components/          Dashboard, imports, tax, planning and shared UI
  lib/
    dashboard/         Monthly aggregations, date handling and greetings
    copilot/           Gemini adapter, context, calculators and chat storage
    import/            Spreadsheet parsing, validation and import persistence
    ingestion/         PDF/image statement processing
    bank-parsers/      Normalization and category rules
    budget/            Budget calculations and persistence helpers
    supabase/          Authenticated browser and server database clients
supabase/migrations/   Available database migrations (not a full bootstrap)
public/templates/      Downloadable transaction CSV template
tests/                 Automated tests and synthetic statement fixtures
```

For implementation details, start with [Copilot setup](COPILOT_SETUP.md) and [Statement import](STATEMENT_IMPORT.md).
