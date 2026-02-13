# V1 System Overview

## Runtime
- Next.js App Router app at `apps/web`.
- Streaming generation endpoint at `POST /api/decks/generate`.
- Vercel Node runtime (`runtime = "nodejs"`).

## Pipeline
1. ingest_input
2. infer_context
3. derive_ruleset
4. build_outline
5. match_templates
6. compose_slides

## Content Contract
- Slide markdown with optional frontmatter.
- Slide boundaries detected from `---` separators or frontmatter-introduced blocks.
- Fenced containers use explicit start/end tags, e.g. `::: column` ... `:::`.
- No nested containers in v1.

## UX
- Chat-first prompt and optional `.md/.txt` attachment.
- Task stream and artifact transparency.
- 3-pane workspace: left nav, center slide, right markdown editor.
- Print CSS on same page, 1920x1080 pages.
