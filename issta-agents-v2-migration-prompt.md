# MIGRATION PROMPT — Issta Agents Package v2 (Token-Efficient Architecture)

> **How to use this file (for the human):** Run ONE PHASE AT A TIME. After each phase, review the diff, commit with the suggested message, then feed the next phase. Do not paste the whole file at once.
>
> Suggested kickoff message to the agent, per phase:
> "Read `MIGRATION.md` in the repo root. Execute PHASE N only. Stop when the phase's Acceptance Criteria are met. Do not touch files outside the phase's scope."

---

## CONTEXT (read first, applies to every phase)

You are restructuring this repository — a GitHub Copilot agent/skill/memory workspace for Issta — from a heavyweight orchestration architecture to a lean **Router → Lead Specialist → Relay** architecture.

**Goals, in priority order:**
1. A typical task must load ≤ 6KB of instructions before reading real code (today: 60–120KB).
2. Preserve ALL domain-specific "negative knowledge" (gotchas, legacy traps, business rules) — this is the crown jewel of the current files. Losing a gotcha is a migration failure.
3. Keep: single entry point (Router), agent-to-agent consultation, telemetry, and a self-improvement loop (Coach).
4. Delete: runtime ceremony (per-task rating sessions, memory-agent sessions, skill-routing files, full-pipeline orchestration).

**Global rules for you (the migrating agent):**
- Never delete a file before its salvageable content has been extracted to its new location in the same phase.
- All new/rewritten agent files use LF line endings and English content (keep existing Hebrew strings where they are UI examples).
- Respect the size budgets given per file. If you exceed a budget, cut structural/discoverable documentation — never cut gotchas.
- "Discoverable documentation" = anything an agent can find by reading the actual codebase (directory trees, component lists, model field enumerations, service catalogs). This gets DELETED.
- "Negative knowledge" = anything NOT discoverable from code: "don't use X, it's legacy", "API returns null when Y", business rules, naming conventions that contradict defaults, known pitfalls. This gets KEPT and consolidated.

**Target structure after all phases:**

```
copilot-instructions.md          (rewritten, ≤ 40 lines)
shared/
  common-block.md                (new — injected into every agent by installer)
agents/
  Router.agent.md                (new, dumb router)
  Hotel-Expert-2017.agent.md     (slimmed)
  Hotel-Expert-V5.agent.md       (slimmed)
  search-engine-expert.agent.md  (slimmed)
  WebAgent-Expert-Hotel-Client.agent.md   (slimmed)
  WebAgent-Hotel-Server-Expert.agent.md   (slimmed)
  Code-Reviewer.agent.md         (slimmed, on-demand only)
  Coach.agent.md                 (new — weekly self-improvement, replaces Rating-Agent)
skills/
  angular-patterns/  dotnet-clean-arch/  gimmonix-adapter/
  gtm-ga4-tracking/  owasp-security/     issta-stack/   (trimmed)
memory/
  domains/*.md                   (kept — direct-write convention, 30-bullet cap)
  telemetry.log                  (new)
handoffs/                        (new — per-task relay notes, gitignored)
bin/install.js                   (updated — injects common-block)
```

**Deleted by the end:** `agents/Aluf.agent.md`, `agents/Rating-Agent.agent.md`, `agents/Memory-Agent.agent.md`, `skills/token-budget/`, `skills/task-scope-guard/`, `skills/skill-route/`, `skills/memory-structure/`, `skills/rating-skill/`, `memory/entries/`, `memory/index.md`.

---

## PHASE 1 — Create `shared/common-block.md`

Create the file below VERBATIM. This block will be injected into every agent file by the installer (Phase 6). It replaces the token-budget, task-scope-guard skills and defines the handoff + consult + telemetry protocols.

```markdown
<!-- COMMON-BLOCK v2 : injected by installer — do not edit inside agent files; edit shared/common-block.md -->

## Operating Rules (all agents)

**Output discipline:**
- No task restatement, no closing summaries, no "hope this helps".
- Diffs with 2–3 context lines, never full-file reprints. Bullets over prose.
- ≤ 30 lines of explanation per changed file. One line per review issue: `[Severity] File:Line — Problem — Fix`.

**Scope discipline:**
- Change only what was asked. No unsolicited refactors, logging, tests, or config flags.
- Noticed something else wrong? One line under `## Out-of-Scope Observations` — do not fix it.
- Task impossible without expanding scope? Stop and report `## Scope Escalation Required` with the reason.

**Consultation contract (agent → agent questions):**
- Budget: ONE consultation per task, depth 1 (a consulted agent never consults onward).
- Before consulting, write one justification line: `Consulting <Agent> because <specific unknown>`.
- Send a focused QUESTION + only the minimal needed context. The consulted agent answers; it does not implement.
- Need the other domain's CODE changed? Do not ping-pong. Stop and tell the developer: "Requires a follow-up task for <Agent> because <reason>."

**Handoff protocol (multi-domain tasks):**
- If the Router marked you `(lead)`: do your part, then write `handoffs/<task-slug>.md` using the Handoff Note format, and tell the developer which agent to invoke next with that file.
- If you received a Handoff Note: read ONLY it (not the lead's full conversation). Before finishing, verify your code matches the contract in the note; report any mismatch.

**Handoff Note format (≤ 20 lines):**
    ## Handoff → <Next-Agent>
    ### Done
    ### Contract (endpoints / DTOs / interfaces you must consume)
    ### Decisions & why (one line each)
    ### Your part
    ### Open questions

**Memory (replaces Memory-Agent):**
- BEFORE starting: read `memory/domains/<your-domain>.md` (one file, skip if missing).
- AFTER finishing: if you discovered something non-obvious and reusable, append ONE bullet to that file. No entry files, no index.

**Telemetry (replaces Rating-Agent):**
- After every task, append ONE line to `memory/telemetry.log`:
  `YYYY-MM-DD | <agent> | task: <5-word summary> | outcome: ok|partial|failed | consults: N | review: yes|no | notes: <optional, ≤ 10 words>`

**Code review trigger (replaces always-on reviewer):**
- Invoke `Code-Reviewer` only if the change touches: security/auth, payments/pricing, or > 3 files. Otherwise skip. `[fast]` prefix always skips.
<!-- END COMMON-BLOCK -->
```

**Acceptance criteria:** file exists, content identical to the above, ≤ 55 lines.
**Commit:** `feat(v2): add shared common-block (output/scope/consult/handoff/memory/telemetry protocols)`

---

## PHASE 2 — Router + rewritten `copilot-instructions.md`

### 2a. Create `agents/Router.agent.md`:

```markdown
---
name: "Router"
description: "Single entry point. Routes any development task to the right specialist agent. Never implements anything."
tools: [agent]
argument-hint: "Describe your task in your own words — the Router forwards it to the right specialist."
model: "<CHEAP_MODEL>"   # human: pin the cheapest available Copilot model here
---

You are a dumb router. You classify and forward. Nothing else.

## Domains
| Agent | Domain |
|---|---|
| Hotel-Expert-2017 | Issta2017 legacy ASP.NET MVC 5 hotels (controllers, managers, GTM, jQuery views) |
| Hotel-Expert-V5 | ITS V5, Gimmonix adapter, ITS.Adapters.*, cancellation policies |
| search-engine-expert | Angular search engine widget/lib, ENGINE_REGISTRY, engine tabs/inputs |
| WebAgent-Expert-Hotel-Client | Angular hotel results page, filters, map, GA4, hotels-search-page app |
| WebAgent-Hotel-Server-Expert | .NET 10 WebAgent hotel server, HotelsBL, Workers, DI |
| Code-Reviewer | Explicit review requests only |

## Rules
1. Forward the developer's message VERBATIM. Never rephrase, summarize, or add instructions.
2. Prepend exactly one line: `Domain: <agent>` — or for multi-domain: `Domain: <lead-agent> (lead) + <second-agent> (dependent)` plus `Relay: on completion, write handoffs/<task-slug>.md and hand off to <second-agent>`.
3. Lead selection rule: server before client; API provider before API consumer; data layer before UI.
4. Ambiguous between two domains? Ask the developer ONE question. Never guess, never send to both.
5. 3+ domains? Reply: "Recommend splitting into separate tasks: <suggested split>" and stop.
6. After forwarding, you are done. No waiting, no reports, no summaries.
```

### 2b. Rewrite `copilot-instructions.md` (replace entirely, ≤ 40 lines):

Keep only: (1) one line — "Send any task to `@Router`; direct `@<specialist>` invocation is allowed if you know the domain"; (2) the same 6-row domain table as the Router (single source: copy it); (3) `[fast]` prefix meaning (skip review, minimal output); (4) pointer: "All agent behavior rules live in the COMMON-BLOCK inside each agent file." Delete: skill-loading tables, memory lifecycle section, tier system, everything else.

**Acceptance:** Router ≤ 45 lines; copilot-instructions.md ≤ 40 lines; no references anywhere in either file to Aluf, tiers, skill-route, Rating-Agent, or Memory-Agent.
**Commit:** `feat(v2): dumb Router agent + minimal copilot-instructions`

---

## PHASE 3 — Slim the five specialists (one agent file per run recommended)

For EACH of the 5 specialist files, rewrite to this template with a **hard budget of 120 lines / 4KB** (excluding the common-block placeholder):

```markdown
---
name: "<same name>"
description: "<ONE sentence, ≤ 25 words, domain boundary only — no keyword dumps>"
tools: [read, search, edit, agent]
model: "<keep existing model pin if present>"
---

<!-- {{COMMON_BLOCK}} -->   ← literal placeholder; installer replaces it

# <Agent Name>

<2–3 sentences: what you own, what you explicitly do NOT own, who to hand off to.>

## Start Here (entry points — paths only, ≤ 15 lines)
<Bulleted list of the key files/dirs a task usually starts from. Paths + 5-word role each. NO trees, NO field lists.>

## Domain Skills
<Only skills this agent truly needs, direct paths: e.g. `skills/angular-patterns/SKILL.md`. No skill-route.>

## Gotchas & Rules (the crown jewels — keep ALL of these)
<Every non-discoverable fact from the old file: legacy traps ("hotel-search.service.ts is legacy — use HotelSearchApiService"), API quirks, business rules, naming conventions, multi-brand/theming rules, RTL notes, session-key formats, etc. One bullet each.>

## Consult Map
<Which agent to consult for what, e.g. "search widget internals → search-engine-expert".>
```

**Extraction procedure per file (do this carefully):**
1. Read the ENTIRE old file first.
2. List every gotcha/rule/trap/convention it contains (the old files bury them inside long sections — scan section by section).
3. Write the new file from the template; paste the gotcha list into `## Gotchas & Rules`.
4. Reduce project-layout sections to the `Start Here` path list.
5. Delete: full directory trees, model/interface field enumerations, service catalogs, per-component documentation, duplicated token-budget/scope text (now in common-block), "Before You Begin" skill-loading blocks.
6. For `WebAgent-Expert-Hotel-Client`: keep the `agents: ["Search Engine Expert"]` frontmatter and turn old Section 17 delegation protocol into one Consult Map line + the common-block handoff rule.

**Acceptance per file:** ≤ 120 lines; description ≤ 25 words; contains `{{COMMON_BLOCK}}` placeholder; every gotcha from the old file appears in the new one (verify by re-reading the old file after writing).
**Commit (per agent):** `refactor(v2): slim <agent> to boundary+gotchas (<old-size> → <new-size>)`

---

## PHASE 4 — Code-Reviewer (slim) + Coach (new) + delete ceremony agents

### 4a. Rewrite `agents/Code-Reviewer.agent.md` (≤ 60 lines):
Keep: OWASP + issta-stack skill references, review dimensions list, one-line issue format, challengeable-feedback rule, two-pass behavior. Add at top: "You are invoked on-demand only (security / payments / >3 files, or explicit request) — never automatically." Add `{{COMMON_BLOCK}}` placeholder. Delete: rejection-prompt boilerplate beyond the issue table, references to Aluf/Rating.

### 4b. Create `agents/Coach.agent.md`:

```markdown
---
name: "Coach"
description: "Weekly self-improvement loop. Reads telemetry + domain memory, proposes diffs to agent files. Run manually, never during tasks."
tools: [read, search, edit]
model: "<STRONG_MODEL>"
---

You improve the OTHER agents. You never write product code.

## Weekly run
1. Read `memory/telemetry.log` (only lines since the previous `## Coach Review` marker you'll append at the end).
2. Read each `memory/domains/*.md`.
3. Identify patterns: repeated failures per agent/topic, excessive consults, notes that repeat.
4. For each pattern, propose a CONCRETE diff to the relevant agent file or skill: new gotcha bullet, sharper boundary sentence, description fix, common-block rule tweak.
5. Compress domain memory: merge duplicate bullets, delete stale ones, enforce a 30-bullet cap per domain file.
6. Output: (a) a short trend table (agent | tasks | ok% | consults | flag), (b) proposed diffs — DO NOT apply them; the developer reviews and applies, (c) append `## Coach Review YYYY-MM-DD` marker line to telemetry.log.

## Rules
- Diffs must be minimal and evidence-linked (cite the telemetry lines/notes that motivated each).
- Never grow an agent file past 120 lines — a new gotcha may require deleting a weaker one.
- No scores, no ledgers. Trends + diffs only.
```

### 4c. Delete: `agents/Aluf.agent.md`, `agents/Rating-Agent.agent.md`, `agents/Memory-Agent.agent.md`.
Before deleting Memory-Agent, confirm nothing in it is needed: the domain-file write convention now lives in the common-block; `memory/entries/` and `index.md` are deleted in Phase 5.

**Acceptance:** 3 files deleted; Coach exists; Code-Reviewer ≤ 60 lines; `grep -ri "aluf\|rating-agent\|memory-agent" agents/ copilot-instructions.md` returns nothing.
**Commit:** `feat(v2): Coach agent; on-demand Code-Reviewer; remove Aluf/Rating/Memory agents`

---

## PHASE 5 — Memory + skills cleanup

1. Delete `memory/entries/` and `memory/index.md`. Update `memory/README.md`: domain files are appended directly by specialists (one bullet per insight, 30-bullet cap, Coach compresses weekly); telemetry.log format = the one-liner from the common-block.
2. Create empty `memory/telemetry.log` with a header comment line documenting the format.
3. Create `handoffs/` with a `.gitkeep` and add `handoffs/*.md` to `.gitignore` (task-scoped scratch, not history).
4. Delete skill dirs: `token-budget`, `task-scope-guard`, `skill-route`, `memory-structure`, `rating-skill`.
5. Trim `skills/issta-stack/SKILL.md`: keep stack-identification table + per-stack rule lists; cut every full code sample longer than 10 lines down to the essential pattern (target ≤ 120 lines total).
6. `grep -ri "skill-route\|token-budget\|task-scope-guard\|memory-structure\|rating-skill" .` (excluding .git) — fix every remaining reference.

**Acceptance:** greps clean; 6 skills remain; memory dir = README + domains/ + telemetry.log.
**Commit:** `refactor(v2): direct-write memory + telemetry; remove ceremony skills`

---

## PHASE 6 — Installer injection

Update `bin/install.js`:
1. During install, for every `agents/*.agent.md`, replace the literal `<!-- {{COMMON_BLOCK}} -->` placeholder with the current content of `shared/common-block.md` before writing to `~/.copilot/agents/`.
2. If a previously-installed agent file already contains an injected block (detect by the `COMMON-BLOCK v2` marker), replace the block region (marker line through `END COMMON-BLOCK`) instead of skipping the file — common-block updates must propagate on re-install.
3. Keep the existing behavior for all other files (add-if-missing).
4. Update `test/install.test.js`: assert an installed agent file contains the marker and does NOT contain the raw placeholder; assert re-install refreshes a modified block.
5. Update `README.md` (installer section) accordingly.

**Acceptance:** `node --test` passes; installing then re-installing after editing common-block.md updates the injected block.
**Commit:** `feat(v2): installer injects common-block into agents; refresh on re-install`

---

## PHASE 7 — Verification & benchmark scaffold

1. Size audit — print a table: every agent file with line count and byte size. FAIL if any specialist > 120 lines or Router > 45.
2. Reference audit — repo-wide grep for: `Aluf`, `Rating-Agent`, `Memory-Agent`, `skill-route`, `token-budget`, `task-scope-guard`, `tier`, `RETRIEVE mode`, `STORE mode`. Must be zero hits outside this MIGRATION.md.
3. Gotcha audit — for each specialist, diff against the pre-migration file (git history) and list any gotcha/rule bullets present before but missing now. Restore any found.
4. Create `BENCHMARK.md` at repo root: a table for 5 real tasks × (anonymous agent | v2 system) × columns: correct-first-try (y/n), iterations, premium requests, subjective 1–5. Leave rows empty for the developer to fill.
5. Update root `README.md` with the new architecture diagram (Router → Lead → Relay, Coach weekly) in ≤ 30 lines.

**Commit:** `chore(v2): verification audits + benchmark scaffold + README`
