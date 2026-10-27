# Interview Reports

A local-first interview-report editor for field interviewers, researchers, students, NGO/community workers, journalists, and independent consultants.

## Product principles
- No cloud database, cloud report storage, or cloud synchronization.
- Drafts live in browser IndexedDB.
- AI is opt-in and must clearly identify the selected provider before source text is sent externally.
- No automatic paid-provider fallback or hidden charges.
- Reports must not fabricate evidence, quotes, dates, or findings.

## Run locally
Requirements: Node.js 20.9+ and npm.
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Current starter
- Responsive report workspace and editable report content
- Create, edit, save, reopen, and delete local reports
- Paste notes/transcripts
- Import TXT, Markdown, and CSV files (10 MB limit)
- Export Markdown
- Initial provider UX definitions for Platform AI, OpenAI/ChatGPT, Gemini, and Groq

## Provider limitations
A consumer sign-in is not proof of API authorization. Only implement official provider flows that support this app's use case. Never request provider passwords, reuse session cookies, or automate sign-up as the user. Do not claim all free consumer accounts can use third-party inference without API keys. Provider terms and eligibility must be verified before a connector is enabled.

## Privacy
Reports are not uploaded to a MobiWave cloud service. IndexedDB is tied to this browser profile and may be lost if site data is cleared or the device is lost. When AI is enabled, selected source text will leave the device for the provider the user explicitly selects. Make that disclosure clear at the point of use.

## Roadmap
1. DOCX and text-based PDF import with size/content limits.
2. AI generation and section revision with explicit provider selection and no paid fallback.
3. Verify supported authorization paths for each provider.
4. Structured report sections and source-evidence mapping.
5. DOCX/PDF export.
6. Tests for persistence, validation, provider errors, and prompt-injection resistance.
7. Security and privacy review before release.

## License
Not selected yet. Choose a license before distribution.
