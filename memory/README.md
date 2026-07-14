# Memory System — README

## Purpose

Persistent knowledge base for agents. Enables specialists to learn from past tasks
and the Coach to spot trends and improve agent files weekly.

## Folder Structure

```
memory/
  README.md        — this file
  telemetry.log    — one-line append per completed task
  domains/         — living-document insights per project domain
```

## How to Use

### During a task (specialist agents)

- **Before starting**: read `memory/domains/<your-domain>.md` (skip if missing).
- **After finishing**: if you discovered something non-obvious and reusable, append
  ONE bullet to that file. No entry files, no index. 30-bullet cap per domain file.

### After a task (telemetry)

Append ONE line to `memory/telemetry.log`:

```
YYYY-MM-DD | <agent> | task: <5-word summary> | outcome: ok|partial|failed | consults: N | review: yes|no | notes: <optional, ≤10 words>
```

### Weekly (Coach agent)

`@Coach` reads telemetry + domain files, proposes diffs to agent/skill files,
compresses domain memory to the 30-bullet cap, and appends a `## Coach Review YYYY-MM-DD` marker.
