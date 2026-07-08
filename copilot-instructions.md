# Copilot Instructions — Issta Agent & Skill Workspace

This workspace (`c:\Users\giladme\.copilot`) is the **central agent, skill, and memory system** for all Issta development work. Every conversation that involves writing, reviewing, or debugging code must follow the rules below.

---

## 1. Always Start With Aluf⭐

**Aluf⭐ is the mandatory entry point for all development tasks.**

- Do not implement code directly when an agent is available.
- Do not invoke specialist agents without first going through Aluf⭐, unless you have been explicitly told to invoke a specialist directly.
- Aluf⭐ handles: task analysis → memory retrieval → specialist delegation → code review → memory store → agent rating.
- Agent file: `c:\Users\giladme\.copilot\agents\Aluf.agent.md`

---

## 2. Agent Registry

| Agent                          | Trigger domain                                                          |
| ------------------------------ | ----------------------------------------------------------------------- |
| `Hotel-Expert-2017`            | Issta2017 ASP.NET MVC 5 — hotel search, results, checkout, GTM tracking |
| `Hotel-Expert-V5`              | ITS V5, Gimmonix adapter, GimmonixWrapperB2C, ITS.Adapters.\*           |
| `Search Engine Expert`         | Angular search engine widget/lib, engine components, ENGINE_REGISTRY    |
| `WebAgent-Expert-Hotel-Client` | Angular hotel results page, filters, map, GA4 tracking                  |
| `WebAgent-Hotel-Server-Expert` | .NET 10 WebAgent hotel server, HotelsBL, Workers, DI                    |
| `Code-Reviewer`                | Final quality gate after any code is written or modified                |
| `Memory-Agent`                 | Knowledge persistence — RETRIEVE before a task, STORE after             |

All agent files live in: `c:\Users\giladme\.copilot\agents\`

---

## 3. Skill Loading Rules

Every specialist agent has a **Before You Begin** block in its own file that lists the exact skills to load. Do not skip this step, even when invoked directly.

| Skill               | Required for                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `issta-stack`       | **ALL** coding agents — mandatory without exception               |
| `angular-patterns`  | Search Engine Expert, WebAgent-Expert-Hotel-Client                |
| `dotnet-clean-arch` | WebAgent-Hotel-Server-Expert, Hotel-Expert-V5                     |
| `owasp-security`    | Code-Reviewer                                                     |
| `gtm-ga4-tracking`  | Hotel-Expert-2017, WebAgent-Expert-Hotel-Client (analytics tasks) |
| `gimmonix-adapter`  | Hotel-Expert-V5                                                   |
| `memory-structure`  | Memory-Agent                                                      |
| `rating-skill`      | Aluf⭐ only                                                       |

Skills directory: `c:\Users\giladme\.copilot\skills\`
Master routing guide: `c:\Users\giladme\.copilot\skills\skill-route\SKILL.md`

---

## 4. Memory Lifecycle

- **Before** starting any specialist task → invoke `Memory-Agent` in **RETRIEVE mode** with the domain and task description.
- **After** completing any task → invoke `Memory-Agent` in **STORE mode** with a summary of what was done and what was learned.
- Memory files live in: `c:\Users\giladme\.copilot\memory\`

---

## 5. Code Review Is Non-Negotiable

After **any** agent produces or modifies code:

- Invoke `Code-Reviewer` with the changed files and a brief description of what was done.
- The reviewer's findings must be addressed or explicitly challenged and resolved before the work is accepted.

---

## 6. Quick Domain Routing

```
Issta2017 hotel code?         → Hotel-Expert-2017
ITS V5 / Gimmonix?            → Hotel-Expert-V5
Angular search widget/lib?    → Search Engine Expert
Angular hotel results page?   → WebAgent-Expert-Hotel-Client
.NET 10 hotel server?         → WebAgent-Hotel-Server-Expert
New API + Angular consumer?   → WebAgent-Hotel-Server-Expert first, then WebAgent-Expert-Hotel-Client
Pure code review?             → Code-Reviewer directly
Memory store/retrieve?        → Memory-Agent directly
Unsure / multi-domain?        → Aluf⭐
```
