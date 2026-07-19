# Guardrail

Guardrail is a local-first web application for reviewing AI-generated code changes before a developer accepts them. Paste a unified diff or upload a `.diff` or `.patch` file, inspect the risky hunks, ask focused questions, and acknowledge every flagged change before recording an approval.

## Live App

https://guardrail-ebon.vercel.app

## Suggested Hackathon Category

Developer Tools / Apps for Your Life

## Team

- Laxmi Vijay Nivass
- Pasumarthi Harish Babu
- Shanmukh
- Satwik

## What It Does

- Parses unified diffs and scores each hunk as `LOW`, `MEDIUM`, or `HIGH` risk.
- Highlights authentication, payments, database queries, package dependencies, configuration, validation, and test changes.
- Lets the reviewer record the expected behavior, then flags possible diff scope that does not directly map to that intent.
- Uses the OpenAI Responses API for focused findings and hunk questions when an API key is configured.
- Provides a localized welcome after a lightweight browser-local sign-in.
- Requires every flagged hunk to be acknowledged before approval.
- Stores approved reviews and their complete source diffs in the current browser using IndexedDB, so re-audit works without a writable server filesystem.

Guardrail deliberately does not connect to Git hosting providers, perform remote merges, or require an external account. The reviewer remains responsible for the final decision.

## Judge Test Path

Guardrail is designed to be testable without an API key or a paid account.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Optionally create `.env.local` from `.env.example`. Leave `OPENAI_API_KEY` empty to test the deterministic fallback, or provide a credited OpenAI API key to enable model-generated findings, greetings, and hunk answers.

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Next.js, create a browser-local profile, then paste a real unified diff or upload a `.diff` or `.patch` file.

5. Run the review, acknowledge each flagged hunk, approve it, and open **History** to re-audit the saved diff.

The browser-local profile and history are isolated to that browser. No server-side history is written, which keeps the app compatible with serverless deployments. The interface is intended for modern desktop browsers; local development was verified on Windows with Node.js.

## OpenAI Configuration

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

Without a usable API key, Guardrail stays functional with deterministic risk findings, hunk explanations, and localized greetings. The UI labels that state clearly.

### GPT-5.6 and Codex

Build Week eligibility does not require a paid API plan. Guardrail was built collaboratively in Codex, and GPT-5.6 use in Codex can be cited in the submission and `/feedback` session even when the web app is tested with its no-key fallback. The project uses that collaboration for the review workflow, intent-to-diff checkpoint, local-first history, and verification passes.

The optional runtime OpenAI integration is separate from Codex. Set `OPENAI_MODEL=gpt-5.6` on an API account with the necessary model access to use the GPT-5.6-compatible review path. That request includes a stable `prompt_cache_key`, keeps static instructions at the start, and enables an explicit prompt-cache breakpoint for GPT-5.6 and newer supported model names. Without an API key, the application remains testable with clearly labeled deterministic fallbacks.

## Workspace Rules

Copy `.guardrail.example.json` to `.guardrail.json` to customize high-risk keywords or exclude directories. This optional configuration is read by the server-side review route.

## Working With Codex

Codex was the primary implementation collaborator for Guardrail. It accelerated the build by shaping the diff-review workflow, implementing the risk-scoring and review surfaces, integrating the OpenAI Responses API, adding browser-local history, and verifying the signed-in review-to-history flow in a real browser.

The product decisions remained deliberate and human-directed: Guardrail is a single-purpose review utility rather than a fake demo or a remote merge tool; approvals are gated by explicit hunk acknowledgement and an intent-to-diff scope check; history is private to the visitor's browser; and the experience remains usable without paid API credits. Codex also helped refine the visual review dashboard, syntax-aware diff presentation, localization flow, and deployment-friendly storage model.

GPT-5.6 support is represented by the optional, cache-aware OpenAI review path described above. It is configurable for a credited account, while the default development setup uses `gpt-5-mini` and the app degrades gracefully when no key is available.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## License

This project is released under the [MIT License](LICENSE).

