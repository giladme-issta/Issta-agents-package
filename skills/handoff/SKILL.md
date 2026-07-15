---
name: handoff
description: "Compact the current conversation into a Handoff Note (≤20 lines) and save to handoffs/<slug>.md. Use when switching sessions or handing off to a dependent agent."
argument-hint: "Which agent continues next, and what is their focus?"
---

Write a Handoff Note to `handoffs/<task-slug>.md` using this exact format:

```
## Handoff → <Next-Agent>
### Done
### Contract (endpoints / DTOs / interfaces the next agent must consume)
### Decisions & why (one line each)
### Your part
### Open questions
```

Rules:

- ≤ 20 lines total
- Do not duplicate content already in files — reference by path instead
- Redact any secrets or credentials
- Infer the next agent from the domain map (Router.agent.md) if not specified by the developer
- Slug = lowercase-hyphenated task description (e.g. `add-hotel-bnpl-flag`)

After saving: tell the developer exactly which agent to invoke next and that they should pass the handoff file path.
