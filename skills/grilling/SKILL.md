---
name: grilling
description: "Stress-test a task idea before dispatching to @Router. Asks one question at a time to sharpen scope, domain ownership, affected files, and cross-domain dependencies. Prevents wasted agent invocations."
argument-hint: "Describe your task idea in rough terms"
---

Interview the developer one question at a time. For each, recommend an answer if it can be looked up in the workspace — explore files rather than guessing. Provide your recommended answer with each question; the developer corrects or confirms.

Question order:

1. Which agent owns this? (use the domain table in Router.agent.md)
2. Single-file or multi-file? If multi: does it cross domain boundaries?
3. What is the exact contract change (interface / endpoint / event / flag)?
4. Which specific files are most likely the entry points? (look them up)
5. Any known gotcha in the relevant agent's Gotchas & Rules that applies?
6. Does another agent's domain need a code change too? (yes → handoff will be needed)

When all 6 are resolved, stop questioning and output a one-paragraph Router-ready task brief. Do not act on it until the developer confirms.
