# Interview Reports

A local-first interview-report editor for field interviewers, researchers, students, NGO/community workers, journalists, and independent consultants.

## Product principles
- No cloud database, cloud report storage, or cloud synchronization.
- Drafts live in browser IndexedDB.
- AI is opt-in and clearly identifies the selected provider before source text is sent externally.
- No automatic paid-provider fallback or hidden charges.
- Reports must not fabricate evidence, quotes, dates, or findings.

## Run locally
Requirements: Node.js 20.9+ and npm.
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000.

## Current implementation
- Responsive report workspace
- Create, edit, save, reopen, and delete local reports with IndexedDB
- Paste notes/transcripts
- Import TXT, Markdown, CSV, DOCX, and text-based PDF files (10 MB limit; scanned PDFs are not supported)
- Export Markdown, DOCX, and PDF
- AI report-generation endpoint for Gemini, OpenAI API, and Groq API, using server-configured credentials
- Provider selector and visible notice that source material is sent to the selected AI provider

## AI provider configuration
The app does **not** connect personal ChatGPT, Gemini, or Groq consumer accounts automatically. Standard inference APIs generally require provider credentials. The deployment operator configures API credentials server-side; end users do not enter passwords or API keys in this UI.

Set `AI_ENABLED=true` only after configuring the provider and appropriate protections. Select a provider using `AI_DEFAULT_PROVIDER=gemini|openai|groq` and provide the matching server-side key. The app will not silently fall back to another provider. Free tiers, eligibility, model availability, quotas, and provider terms can change; no unlimited free inference is promised.

**Security warning:** The current endpoint is an MVP integration, not ready for unrestricted public deployment with centrally funded provider credentials. Before enabling AI on a public deployment, add robust abuse protection, durable per-user/IP quotas, request logging that excludes source content and secrets, and operational cost/usage alerts. The AI endpoint is disabled by default.

## Privacy
Reports are not uploaded to a MobiWave cloud service. IndexedDB is tied to this browser profile and may be lost if site data is cleared or the device is lost. When AI is enabled, the submitted source text leaves the device and passes through the app server to the explicitly selected provider. Do not submit confidential or personally identifying content unless permitted by your policies and the provider's terms.

## Quality and release status
This repository is an active MVP, not a production release. Run:
```bash
npm run typecheck
npm run lint
npm run build
```
Automated CI is configured to run checks on pushes and pull requests. Fix any reported failures before deployment.

## Roadmap
1. Add tests for file extraction, local persistence, prompt-injection resistance, and provider error handling.
2. Add durable abuse protection and quotas before public AI enablement.
3. Verify supported provider authorization paths if consumer-account connections are pursued.
4. Improve source-evidence mapping and report section revision.
5. Accessibility, mobile UX, privacy, and security review before release.

## License
Not selected yet. Choose a license before distribution.
