# Saved finance workspaces

Apply `supabase/migrations/20261005_finance_workspaces.sql` once to the existing Supabase project. It adds three tables and a private bucket without resetting existing data. Existing table/bucket policies must not grant broader access. Local validation used the configured project and authenticated user session.

## Tax sections

Every tax section and the tax tools have an April–March year selector. Salary Documents stores annual gross salary, basic salary, qualifying DA, HRA, employer NPS, age and residency for that year. Tax Saving Proofs stores confirmed eligible annual 80C, health-insurance, personal NPS and loan-interest deductions. These yearly declarations replace legacy profile estimates in the overview, regime comparison, deduction view, payment reconciliation, Reports and Gemini Copilot. Current-year profile values are never borrowed for an unsaved historical year.

Save details before switching years. Review checklist items explicitly; uploads are evidence storage, not automatic verification. Saving checks and details uses a version check to avoid overwriting changes made in another tab. Conflicts provide a reload control. Preparation progress comes from saved checklists, rather than a preset percentage.

The shared calculator supports FY 2024–25, 2025–26 and 2026–27, ordinary salary up to ₹10 crore, resident age bands, nonresident salary slabs, regime-specific standard deductions, rebate, marginal relief, surcharge and cess. Age, residency and deduction eligibility must reflect the selected year. The what-if calculator is temporary: it does not overwrite declarations and exports its scenario as CSV. Banking interest, capital gains/losses and other non-salary income can be recorded and documented but are excluded from the salary estimator; it does not prepare a complete return.

HRA estimates assume one unchanged set of monthly amounts over the selected rental period. The calculation uses the minimum of actual HRA, rent minus 10% of eligible salary, and the city percentage of eligible salary, floored at zero. The UI labels this as an old-regime estimate. For varying periods, calculate each separately. The eight-city 50% limit starts in 2026–27; earlier years use Delhi, Mumbai, Kolkata and Chennai only. Reference: [notified Income-tax Rules 2026, rule 279](https://www.incometax.gov.in/iec/foportal/sites/default/files/2026-03/En-Notified-IT-Rules-2026-20-03-2026.pdf).

Filing tracks the user's selected regime, explicit filing status, date, acknowledgement and declared annual tax credits. Gross salary is edited in Salary Documents. Blank tax-credit fields remain unknown; explicit zero is a valid declaration. Reconciliation requires a selected regime and both payment fields; excess payments are not an approved refund. Finpilot does not submit a return, e-verify it or verify tax credits. Enter the deadline applicable to the user's circumstances and add it to Calendar if wanted; repeating the button updates the existing owned filing reminder. Deadlines are not guessed from onboarding.

## Documents and exports

Allowed proof types: PDF, PNG, JPG, WebP, CSV and XLSX, up to 10 MB. Uploads validate category, year, size, extension and basic file signatures. Downloads require authentication and check account ownership, including the storage-path prefix. Responses are private/no-store attachments. This is file storage, not a malware-scanning or document-authenticity service.

Reports include only the selected year's recorded transactions. All transaction pages are loaded. Transfers and refunds require appropriate categorization by the user. Salary-only estimates keep their eligibility limits and show missing information/assumptions. Capital gains and non-salary income are excluded from this estimator. Historical profile data is not invented.

PDF reports contain a summary, monthly figures, filing declarations and assumptions. CSV output escapes formula-like text. ZIP packages add saved year details and all original documents for that year; downloads fail clearly if any original cannot be retrieved, instead of silently omitting it. Packages over 50 MB require individual document downloads.

## Reminders and Calendar

The same `finance_events` records power both views. Users can create, edit, complete, reopen, postpone or delete reminders. Counts distinguish overdue, next seven days and completed records. Filters can return a genuinely empty list. Calendar navigation uses complete dates, including month/year and leap days. Views refresh on focus and once a minute. Goal milestones remain read-only here and link to Goals.

ICS export includes visible-category/search pending reminders as all-day events, with escaped text and UTF-8 line folding. Email and push notifications are not configured; use in-app reminders or import the calendar into a calendar application.

## Verification

`node --test tests/finance-workspaces.test.mjs` covers year boundaries, HRA limits and rental periods, historical data isolation, unknown TDS, date validation, reminder counts, pagination/ownership, file checks, CSV injection escaping, ICS folding, report totals and valid PDF generation. The Copilot suite also covers bounded retries on transient Gemini failures; quota, billing and invalid-key errors are not retried.

`node --test tests/tax-workspace.test.mjs tests/tax-storage.test.mjs` additionally checks age/residency rules, surcharge and marginal relief, annual NPS units, independent insurance limits, matching historical-year results across Reports/Copilot, duplicate deduction resolution, payment reconciliation, invalid salary components and account/year/version isolation on saves. Database doubles exercise conflicting saves without altering a user's financial declarations.
