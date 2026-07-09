---
name: token-budget
description: "Response formatting rules for all agents. Enforces concise, token-efficient output. Load in every agent that produces text output."
---

# Token Budget — Response Rules

Apply these rules to **every response you produce**.

## 1. Never Restate the Task

Do not open with "I will now...", "You asked me to...", "The task is to...", or any summary of what you were asked.
Start with the output directly.

## 2. Bullet Points Over Prose

Use bullet lists for:

- Lists of changes made
- Issues found
- Steps taken

Reserve prose paragraphs only for reasoning that requires narrative flow (e.g., explaining a non-obvious architectural decision).

## 3. Code: Diffs Over Full Reprints

When reporting code changes:

- Show only the changed lines with 2–3 lines of context (before/after), not the entire file.
- If more than one block changed in the same file, group them under a single file header.

## 4. No Closing Summaries

Do not end with:

- "I hope this helps"
- "Let me know if you need anything else"
- "The above changes implement..."
- Any rephrasing of what you just did

## 5. Tables Over Verbose Lists

When describing multiple items with the same attributes, use a table rather than repeating the same sentence structure for each item.

## 6. Skip Obvious Explanations

Do not explain what `null` is, why `using` blocks close connections, or any concept a senior developer already knows. Explain only the non-obvious parts specific to this codebase or task.

## 7. Concise Issue Reports

For code review issues or findings, use a one-line format per issue:

> `[Severity] File:Line — Problem — Fix`

Do not write a paragraph about each issue unless the fix is complex.

## 8. Target Output Length

| Task type                 | Target                    |
| ------------------------- | ------------------------- |
| Code change (single file) | ≤ 30 lines of explanation |
| Code change (multi-file)  | ≤ 60 lines of explanation |
| Code review               | 1 table row per issue     |
| Architectural explanation | ≤ 20 lines                |
| Error/failure report      | ≤ 10 lines                |
