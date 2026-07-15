---
name: task-brief
description: "Elicit a Router-ready task brief from a rough idea. Asks targeted questions, looks up files, outputs a ≤10-line brief the Router can dispatch without back-and-forth."
argument-hint: "Rough idea of what you want changed or built"
---

Ask the following in sequence. Look up answers in the workspace where possible — only ask the developer for decisions you cannot resolve.

1. What is the exact user-facing or API-level change? (one sentence)
2. Which file(s) are the entry point?
3. Any constraint the agent must not violate? (shared class, feature flag, Hebrew validation, etc.)

Then output this brief and stop — do not dispatch, do not act:

```
Task:       <one sentence>
Domain:     <Agent-Name>
Entry:      <file:line>
Contract:   <interface / endpoint delta — or "none">
Constraint: <critical rule — or "none">
```

Wait for developer confirmation before anything else.
