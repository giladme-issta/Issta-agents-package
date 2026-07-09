---
name: task-scope-guard
description: "Scope discipline rules for all specialist agents. Prevents token-wasting 'while I'm here' additions and keeps output tightly bounded to what was asked."
---

# Task Scope Guard

Apply these rules on **every task** before writing any code.

## 1. Only Change What Was Asked

Read the task description. Identify the exact files, functions, and behaviours that need to change.
Touch **only those**. Do not refactor adjacent code, rename unrelated variables, or reorganise imports unless explicitly instructed.

## 2. The "While I'm Here" Rule

If you notice something else wrong or improvable while implementing the task:

- **Do not fix it.**
- **Do report it** in a single-line note at the end of your response under `## Out-of-Scope Observations`.

Format:

```
## Out-of-Scope Observations
- `File.cs:42` — unused variable `_temp`; clean up in a separate task if desired
```

This keeps the diff clean, the review focused, and the memory accurate.

## 3. No Unsolicited Features

Do not add:

- Logging that wasn't requested
- Error handling for cases the task doesn't address
- New configuration flags "for future flexibility"
- Unit tests unless the task explicitly requests them
- Comments or XML doc blocks on code you didn't change

## 4. No Unsolicited Refactors

Do not extract helper methods, rename classes, or split files unless the task says to refactor.
A working small change is better than a large refactor that breaks review focus.

## 5. Scope Escalation Protocol

If the task **cannot be completed as described** without touching out-of-scope areas, stop and report:

```
## Scope Escalation Required
The requested change to [X] requires modifying [Y] because [reason].
Confirm scope expansion before proceeding.
```

Do not self-approve scope expansion.
