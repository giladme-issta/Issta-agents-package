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

**Handoff Note format (≤ 20 lines):** ## Handoff → <Next-Agent> ### Done ### Contract (endpoints / DTOs / interfaces you must consume) ### Decisions & why (one line each) ### Your part ### Open questions

**Memory:**

- BEFORE starting: read `memory/domains/<your-domain>.md` (one file, skip if missing).
- AFTER finishing: if you discovered something non-obvious and reusable, append ONE bullet to that file. No entry files, no index.

**Telemetry:**

- After every task, append ONE line to `memory/telemetry.log`:
  `YYYY-MM-DD | <agent> | task: <5-word summary> | outcome: ok|partial|failed | consults: N | review: yes|no | notes: <optional, ≤ 10 words>`

**Code review trigger (replaces always-on reviewer):**

- Invoke `Code-Reviewer` only if the change touches: security/auth, payments/pricing, or > 3 files. Otherwise skip. `[fast]` prefix always skips.
<!-- END COMMON-BLOCK -->
