# Deploy Finpilot on Render

The frontend, API routes, and server actions run together as **one Node web service**. Keep the existing Supabase project for the database, authentication, and private proof storage. Gemini remains the AI provider. A separate frontend service or Render Postgres database is not needed.

The repository includes a free-service Blueprint in [render.yaml](render.yaml), a pinned Node version in [.node-version](.node-version), and a public liveness endpoint at `/api/health`.

## First deployment

1. Sign in to Render and connect the GitHub repository `ADARSHBHARDWAJ21/Finpilot`. Grant access to this repository rather than unrelated repositories.
2. Choose **New → Blueprint**, select the repository and `main`, and use `render.yaml` at the repository root.
3. Review the service: `finpilot-preview`, **Free**, Node runtime, Singapore region. The Blueprint does not create a database or paid disk. Choose a unique name if your workspace already has a service with that name.
4. Enter the following values from your existing local configuration in Render's secret environment-variable fields:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. `GEMINI_COPILOT_MODEL` defaults to the application's existing model. If your local app uses a different model, use that same model in Render.
6. Deploy and inspect the build logs. The build checks native PDF/image libraries before building Next.js. Never add `.env.local` or real key values to GitHub.
7. Open the actual HTTPS `onrender.com` URL shown by Render. `/api/health` should return `{"status":"ok","service":"finpilot"}` without requiring sign-in. This checks the app process, not database/provider availability.
8. In the existing Supabase project, open **Authentication → URL Configuration**. Set **Site URL** to the new HTTPS app URL and add its exact `/auth/callback` URL to the redirect allowlist. For the current preview, use `https://finpilot-preview.onrender.com` and `https://finpilot-preview.onrender.com/auth/callback`. Local development also needs its own exact allowed callback, such as `http://localhost:3002/auth/callback`, if you test signup locally. Do not add unrelated domains or production wildcards.
9. Check email confirmation, dashboard data, a small synthetic CSV import, a small PDF import, proof download, and Copilot. Confirmation opens onboarding for a new user and the dashboard for a returning user. Open the email link in the same browser used for signup so the PKCE session cookie is available; if opened elsewhere, sign in with the confirmed email and password. Test extraction before asking users to upload large statements. Use a disposable test account for test records.

If you use **New → Web Service** instead of Blueprint, choose the connected GitHub repo and these equivalent settings:

- Branch: `main`
- Runtime: Node
- Root directory: **leave blank** — `package.json` is at the GitHub repository root. The nested folder in your downloaded ZIP is not a GitHub subdirectory.
- Plan: Free
- Region: Singapore (or choose a suitable region before creation)
- Build command: `npm ci --include=dev --include=optional && node scripts/check-render-runtime.mjs && npm run build`
- Start command: `npm start -- --hostname 0.0.0.0 --port "$PORT"`
- Health check path: `/api/health`
- Auto-deploy: On Commit
- Set the same environment variables before the first build. The two `NEXT_PUBLIC_` Supabase values are needed at build time as well as runtime.

Use the existing Supabase schema. This repository is not a full bootstrap for a new database. Deployment does not automatically run SQL migrations, and the historical onboarding reset migration must not be replayed as a deploy step.

## Make changes and redeploy

You can edit frontend and backend code after deployment as often as needed:

1. Make and test changes locally.
2. Commit and push them to the connected `main` branch on GitHub.
3. With **Auto-deploy → On Commit**, Render builds and deploys the new commit automatically. Watch the deployment status before considering the update live.
4. You can also choose **Manual Deploy → Deploy latest commit**. Use **Save, rebuild, and deploy** when changing `NEXT_PUBLIC_` variables, because Next.js embeds them in the browser build.

For automatic deploys, connect GitHub through Render's Git integration. A service created only from a public repository URL requires manual deployments.

Redeploying application code does not erase Supabase records or proof files. Database schema changes still require their own reviewed migrations; deploying or rolling back code does not undo database changes. Keep changes compatible with the previous running version while a new deployment starts.

## Free preview limits

Render's Free web service currently has 512 MB RAM and sleeps after 15 minutes without incoming traffic. The next visit may take about a minute to start it. Free usage and build limits apply. This configuration is intended for preview and light testing.

Image/scanned-PDF OCR and ZIP exports need significantly more resources than ordinary pages. The existing upload limits are not a promise that a free instance can process every allowed file. Large or simultaneous uploads can exceed the instance's memory or processing budget. Prefer CSV/Excel and small digital PDFs during preview; consider a larger paid instance after measuring real usage.

The local filesystem is temporary. The English OCR language cache under `.cache/ocr` may be downloaded again after a restart; saved transactions and proofs remain in Supabase. No persistent disk is required for existing application data.

Keep one service instance for the initial preview. Current import locks and request limits are process-local. Multiple instances need shared coordination; free hosting does not make this a production scaling setup.

## Domain and troubleshooting

- **Custom domain:** set server-only `APP_ORIGIN=https://your-domain.example` to the exact trusted public origin, and update the Supabase Auth URL settings. Without `APP_ORIGIN`, the upload endpoint uses Render's provided `RENDER_EXTERNAL_URL`. It does not trust client-supplied forwarded-host headers.
- **Supabase fetch/sign-in failure:** check the two Supabase environment values, rebuild after changing them, and confirm the existing project is available.
- **Confirmation opens localhost or fails:** check Site URL and the exact `/auth/callback` allowlist entry. The app explicitly sends email confirmations to `APP_ORIGIN` or Render's `RENDER_EXTERNAL_URL`. New emails use the corrected settings; already issued links may still point to the old address. If the email was already confirmed before the redirect failed, sign in at the live app. Expired links need a fresh confirmation email. Production hosting outside Render requires a server-only HTTPS `APP_ORIGIN`.
- **Gemini failure:** check the server-only key, model access, quota, and provider availability. Do not prefix the key with `NEXT_PUBLIC_`.
- **Native dependency build failure:** keep optional dependencies and install scripts enabled. Inspect whether Canvas/Sharp/PDF dependencies downloaded their Linux binaries. If a source build needs system libraries unavailable on the native runtime, use a Docker image with the required libraries; do not disable the failing check to hide the error.
- **Health check passes but a feature fails:** the health endpoint deliberately does not call Supabase, Gemini, or OCR. Inspect that feature's request and Render logs separately.

## Official references

- [Render: deploy Next.js](https://render.com/docs/deploy-nextjs-app)
- [Render: automatic and manual deploys](https://render.com/docs/deploys)
- [Render: free-service limits](https://render.com/docs/free)
- [Render: environment variables and secrets](https://render.com/docs/configure-environment-variables)
- [Render: Blueprint specification](https://render.com/docs/blueprint-spec)
- [Supabase: redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
