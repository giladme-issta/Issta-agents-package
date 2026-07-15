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

**Inter-Agent Protocol (IAP) — agent → agent communication:**

Gate — pass ALL 3 before consulting another agent:

1. Checked own Gotchas, Skills, and domain memory and still blocked? (answerable alone → do NOT consult)
2. Need a FACT/signature, NOT a code change in the other domain? (code change needed → stop, tell developer: "Requires follow-up task for `<Agent>` because `<reason>`.")
3. First consultation of this task? (already consulted once → stop, no second consult, no cascades)

Request format (≤ 10 lines total — no preamble):

```
CONSULT → <Agent>
Q: <one sentence, ≤ 15 words>
Context: <≤ 5 lines of code or key facts — no full files>
```

Response format for the consulted agent (≤ 8 lines — no preamble, no implementation):

```
ANSWER
A: <direct answer>
Ref: <file:line — omit if not applicable>
```

Depth-1 is absolute: a consulted agent that cannot answer without another consult replies `Unknown — ask developer.` and stops.

**Handoff protocol (multi-domain tasks):**

- If the Router marked you `(lead)`: do your part, then write `handoffs/<task-slug>.md` using the Handoff Note format, and tell the developer which agent to invoke next with that file.
- If you received a Handoff Note: read ONLY it (not the lead's full conversation). Before finishing, verify your code matches the contract in the note; report any mismatch.

**Handoff Note format (≤ 20 lines):** ## Handoff → <Next-Agent> ### Done ### Contract (endpoints / DTOs / interfaces you must consume) ### Decisions & why (one line each) ### Your part ### Open questions

**Memory:**

Slug table (use as exact filename under `memory/agents/`):
`hotel-expert-2017` | `hotel-expert-v5` | `search-engine-expert` | `webagent-hotel-client` | `webagent-hotel-server` | `code-reviewer`

- BEFORE starting: read your ONE file — `memory/agents/<your-slug>.md`. Skip if missing. Do NOT read other agents' files.
- AFTER finishing: discovered something non-obvious and reusable? Append ONE bullet to `memory/agents/<your-slug>.md`. Affects another domain too? Also append to `memory/agents/_shared.md`.

**Telemetry:**

- After every task, append ONE line to `memory/telemetry.log`:
  `YYYY-MM-DD | <agent> | task: <5-word summary> | outcome: ok|partial|failed | consults: N | review: yes|no | notes: <optional, ≤ 10 words>`

**Code review trigger (replaces always-on reviewer):**

- Invoke `Code-Reviewer` only if the change touches: security/auth, payments/pricing, or > 3 files. Otherwise skip. `[fast]` prefix always skips.
<!-- END COMMON-BLOCK -->
