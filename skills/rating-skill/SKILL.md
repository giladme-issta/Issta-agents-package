---
name: rating-skill
description: "Agent performance rating system. Rating-Agent-only. Use after every completed task to score each invoked agent, record the rating in the Agent Performance Ledger, and generate the task's final performance report."
argument-hint: "List the agents involved, their actions, and the task outcome"
---

# Rating Skill — Agent Performance Evaluation

**This skill is exclusively for Rating-Agent.** No other agent should load or apply it.

---

## 1. When to Rate

Rate agents at **Step 1** of every Rating-Agent session — after all corrections are applied and the code review is passed (or dismissed with reasoning). One score per agent per task.

---

## 2. Scoring Scale

| Score | Label      | Definition                                                                                                                                      |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **5** | Flawless   | Task completed correctly on first attempt. Code review returned no issues (or only trivial style notes). No arbitration needed.                 |
| **4** | Good       | Task completed correctly. Code review found 1–2 real issues; all were fixed without conflict on first feedback round.                           |
| **3** | Acceptable | Task completed but required significant review corrections, OR one arbitration round was needed, OR outcome was partial.                        |
| **2** | Poor       | Multiple review failures across rounds, OR repeated the same mistake after correction, OR required heavy Aluf⭐ intervention to reach a result. |
| **1** | Failed     | Produced incorrect or harmful output, refused to apply corrections, caused a regression, or did not complete the assigned task.                 |

---

## 3. What to Rate

Rate every agent that was **actively invoked** in the task. Do not rate agents that were not called.

| Agent                          | What to Evaluate                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `Hotel-Expert-2017`            | Correctness of legacy MVC code, session handling, convention compliance                                |
| `Hotel-Expert-V5`              | Correctness of Gimmonix adapter code, mapping accuracy, CUG handling                                   |
| `Search Engine Expert`         | Correctness of Angular engine config, component patterns, registry usage                               |
| `WebAgent-Expert-Hotel-Client` | Angular component quality, signal usage, RxJS correctness, RTL compliance                              |
| `WebAgent-Hotel-Server-Expert` | Clean Architecture compliance, MediatR handler quality, Result pattern usage                           |
| `Code-Reviewer`                | Quality of review: did it catch real issues? Were the issues actionable? Did it raise false positives? |
| `Memory-Agent`                 | Did it store the entry correctly? Did retrieval surface relevant prior insights?                       |

---

## 4. Rating Report Format

Generate a rating report at the end of every task. Include it in the Final Report (Step 6):

```markdown
## Agent Performance — <Task Name>

| Agent       | Score    | Outcome                | Notes        |
| ----------- | -------- | ---------------------- | ------------ |
| <AgentName> | <1–5> ⭐ | success/partial/failed | <notes or —> |
| <AgentName> | <1–5> ⭐ | success/partial/failed | <notes or —> |

**Task Average**: <calculated average, 1 decimal>

### Highlights

- <AgentName>: <positive note if score 5, or concern if score ≤ 2>
```

---

## 5. Notes Column — What to Write

**For score 5:** `—` (nothing notable needed)
**For score 4:** Note what was found in review: e.g., `"Missing null check on hotel list — fixed cleanly"`
**For score 3:** Note the review issues or arbitration: e.g., `"Reviewer upheld: OWASP A03 SQL concat risk"` or `"Partial outcome: rooms mapping incomplete"`
**For score 2:** Note the pattern of failure: e.g., `"Repeated same naming mistake after correction"` or `"Required 3 review rounds"`
**For score 1:** Note the failure cause: e.g., `"Returned wrong layer code (controller logic in domain)"` or `"Did not apply MediatR pattern as instructed"`

**For Code-Reviewer specifically:**

- Deduct 1 point if the reviewer raised issues that were dismissed as false positives (over-flagging).
- Deduct 1 point if the reviewer missed a clear security issue that Aluf⭐ caught independently.
- Add a note: `"False positive on X"` or `"Missed OWASP A03 in Y"`.

---

## 6. Writing to the Agent Performance Ledger

After generating the rating report, instruct `Memory-Agent` to append the rows to:
`c:\Users\giladme\.copilot\memory\agent-performance.md`

One row per agent:

```
| YYYY-MM-DD | <3-5 word task name> | <AgentName> | <score> | <outcome> | <notes> |
```

If the file does not exist, `Memory-Agent` must create it with this header:

```markdown
# Agent Performance Ledger

Maintained by Aluf⭐ + Memory-Agent. Append only — never truncate or overwrite.

| Date | Task (short) | Agent | Score (1–5) | Outcome | Notes |
| ---- | ------------ | ----- | ----------- | ------- | ----- |
```

---

## 7. Long-Term Tracking Rules

- **Never modify past rows** — corrections go in a new row with `[CORRECTION]` in Notes.
- **Review trends periodically**: if any agent has 3 or more scores of ≤ 2 in recent tasks, flag it in the Final Report for the developer's attention.
- **Reward consistency**: if an agent has scored 5 in 5 consecutive tasks, note `"Consistent high performer"` in the next STORE call.

---

## 8. Example Complete Rating Report

```markdown
## Agent Performance — Hotel BNPL Eligibility Fix

| Agent                        | Score | Outcome | Notes                                                     |
| ---------------------------- | ----- | ------- | --------------------------------------------------------- |
| WebAgent-Hotel-Server-Expert | 4 ⭐  | success | Missing null check on empty room list — fixed immediately |
| Code-Reviewer                | 5 ⭐  | success | —                                                         |
| Memory-Agent                 | 5 ⭐  | success | —                                                         |

**Task Average**: 4.7

### Highlights

- WebAgent-Hotel-Server-Expert: Good response to review feedback; quick fix.
```
