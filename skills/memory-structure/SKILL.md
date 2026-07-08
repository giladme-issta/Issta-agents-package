---
name: memory-structure
description: "Memory system layout, entry/domain/index file formats, and the agent rating ledger format. Mandatory for Memory-Agent. Load before any STORE or RETRIEVE operation."
argument-hint: "Describe the operation you are performing (STORE or RETRIEVE) and the domain"
---

# Memory Structure — System Layout & Formats

## 1. File System Layout

```
c:\Users\giladme\.copilot\memory\
  index.md                        ← Master index (one row per stored entry)
  README.md                       ← Human-readable system guide
  domains\
    general.md                    ← Cross-domain insights
    hotels.md                     ← Hotel domain insights (Issta2017 + WebAgent + V5)
    search-engine.md              ← Search engine widget insights
    <domain>.md                   ← Create new file for new domains
  entries\
    YYYY-MM-DD_<slug>.md          ← Individual task records
    README.md                     ← Entry folder guide

agent-performance.md              ← Agent rating ledger (maintained by Aluf⭐ + Memory-Agent)
```

---

## 2. index.md — Row Format

File: `c:\Users\giladme\.copilot\memory\index.md`

```markdown
| Date       | Entry ID           | Domain   | Agents           | Task Summary            |
| ---------- | ------------------ | -------- | ---------------- | ----------------------- |
| YYYY-MM-DD | YYYY-MM-DD\_<slug> | <domain> | [AgentA, AgentB] | <one-line task summary> |
```

**Rules:**

- One row per stored task. Append only — never delete or rewrite rows.
- Slug is lowercase, hyphen-separated, max 5 words from the task summary.

---

## 3. Entry File Format

File: `c:\Users\giladme\.copilot\memory\entries\YYYY-MM-DD_<slug>.md`

```markdown
---
id: YYYY-MM-DD_<slug>
date: YYYY-MM-DD
agents: [AgentName1, AgentName2]
domain: <domain>
outcome: success | partial | failed
---

## Task Summary

<1–3 sentence description of what was done>

## Agents Involved

- <AgentName>: <their role in this task>

## Key Insights & Tricks

- <insight 1>
- <insight 2>

## Outcome

<outcome details — what worked, what didn't, and why>

## Related Files

- `path/to/file1`
- `path/to/file2`
```

---

## 4. Domain File Format

File: `c:\Users\giladme\.copilot\memory\domains\<domain>.md`

```markdown
# Domain Insights — <Domain Name>

Aggregated insights that apply across all tasks in this domain.
Maintained by Memory-Agent. Do not edit manually.

## Reusable Patterns & Tricks

- <insight bullet 1>
- <insight bullet 2>
```

**Rules:**

- Only append new bullets — never rewrite or truncate existing content.
- Extract only reusable insights — do not paste full entry content.
- If a domain file does not exist for a new domain, create it following this format.

---

## 5. Agent Performance Ledger — Rating Format

File: `c:\Users\giladme\.copilot\memory\agent-performance.md`

This file is the authoritative long-term record for agent quality tracking. It is written by **Aluf⭐** after every task and stored by **Memory-Agent**.

### File Header (create once if it does not exist)

```markdown
# Agent Performance Ledger

Maintained by Aluf⭐ + Memory-Agent. Append only — never truncate or overwrite.

| Date | Task (short) | Agent | Score (1–5) | Outcome | Notes |
| ---- | ------------ | ----- | ----------- | ------- | ----- |
```

### Row Format

```
| YYYY-MM-DD | <3-5 word task name> | <AgentName> | <1–5> | success/partial/failed | <optional notes> |
```

### Score Definitions

| Score | Meaning                                                                     |
| ----- | --------------------------------------------------------------------------- |
| **5** | Flawless: completed task correctly, no review issues, no arbitration needed |
| **4** | Good: minor review issues found and fixed without conflict                  |
| **3** | Acceptable: significant review issues or one arbitration round needed       |
| **2** | Poor: multiple review failures, repeated issues, or partial outcome         |
| **1** | Failed: incorrect output, refused to fix issues, or caused regression       |

### Notes Column Guidelines

- Record any conflict ruling: `"Reviewer upheld: missing null check"` or `"Dismissed: project-specific pattern"`
- Record exceptional behavior: `"Proactively caught unrelated bug"`, `"Exceeded scope unnecessarily"`
- Leave empty (`—`) if the task was straightforward with no notable events.

### Example Rows

```markdown
| 2026-07-08 | hotel search BNPL fix | Hotel-Expert-V5 | 5 | success | — |
| 2026-07-08 | hotel search BNPL fix | Code-Reviewer | 4 | success | Found 1 null-ref issue, fixed on first pass |
| 2026-07-08 | hotel search BNPL fix | Memory-Agent | 5 | success | — |
```

**Rules:**

- One row per agent per task — not one row per task.
- Append immediately after every completed task — do not batch.
- Never delete or modify existing rows — correction policy: add a new row with `[CORRECTION]` in the Notes column.
