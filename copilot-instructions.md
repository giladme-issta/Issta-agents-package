# Copilot Instructions — Issta Agent & Skill Workspace

This workspace (`c:\Users\giladme\.copilot`) is the **central agent, skill, and memory system** for all Issta development work. Every conversation that involves writing, reviewing, or debugging code must follow the rules below.

---

## 1. Routing — When to Use Aluf⭐ vs Direct Specialist

**Use Aluf⭐ when:**

- Task tier is M or L/XL (multi-file logic change, new feature, architectural work)
- Domain is ambiguous or the task spans multiple domains
- You're unsure which specialist handles this area

**Go directly to the specialist when:**

- Domain is clear from the prompt (see Quick Domain Routing below)
- Task tier is XS or S (single-file or small bugfix — see Section 7)
- You already know which agent owns this file/layer

**Direct access saves 1 full model turn + its entire context load.** Use it aggressively for small work.

> **How**: In VS Code chat, type `@Agent-Name` to invoke a specialist directly.
> `@Hotel-Expert-2017 [fast] fix the error message on HotelsController line 42`

---

## 2. Agent Registry

| Agent                          | Trigger domain                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `Hotel-Expert-2017`            | Issta2017 ASP.NET MVC 5 — hotel search, results, checkout, GTM tracking                             |
| `Hotel-Expert-V5`              | ITS V5, Gimmonix adapter, GimmonixWrapperB2C, ITS.Adapters.\*                                       |
| `Search Engine Expert`         | Angular search engine widget/lib, engine components, ENGINE_REGISTRY                                |
| `WebAgent-Expert-Hotel-Client` | Angular hotel results page, filters, map, GA4 tracking                                              |
| `WebAgent-Hotel-Server-Expert` | .NET 10 WebAgent hotel server, HotelsBL, Workers, DI                                                |
| `Code-Reviewer`                | Final quality gate after any code is written or modified                                            |
| `Rating-Agent`                 | Performance scoring — invoked by Aluf⭐ after review; rates agents, stores records via Memory-Agent |
| `Memory-Agent`                 | Knowledge persistence — RETRIEVE before a task, STORE after (via Rating-Agent)                      |

All agent files live in: `c:\Users\giladme\.copilot\agents\`

---

## 3. Skill Loading Rules

Every specialist agent has a **Before You Begin** block in its own file that lists the exact skills to load. Do not skip this step, even when invoked directly.

| Skill               | Required for                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `issta-stack`       | **ALL** coding agents — mandatory without exception               |
| `token-budget`      | **ALL** agents — mandatory without exception                      |
| `task-scope-guard`  | **ALL** coding agents — mandatory without exception               |
| `angular-patterns`  | Search Engine Expert, WebAgent-Expert-Hotel-Client                |
| `dotnet-clean-arch` | WebAgent-Hotel-Server-Expert, Hotel-Expert-V5                     |
| `owasp-security`    | Code-Reviewer                                                     |
| `gtm-ga4-tracking`  | Hotel-Expert-2017, WebAgent-Expert-Hotel-Client (analytics tasks) |
| `gimmonix-adapter`  | Hotel-Expert-V5                                                   |
| `memory-structure`  | Memory-Agent                                                      |
| `rating-skill`      | Rating-Agent only                                                 |

Skills directory: `c:\Users\giladme\.copilot\skills\`
Master routing guide: `c:\Users\giladme\.copilot\skills\skill-route\SKILL.md`

---

## 4. Memory Lifecycle

- Memory RETRIEVE runs for **M and L/XL tier tasks only** (see Section 7).
- Memory STORE runs for **M and L/XL tier tasks only**, via Rating-Agent.
- Memory files live in: `c:\Users\giladme\.copilot\memory\`

---

## 5. Code Review Is Tier-Conditional

- **XS tier**: Code-Reviewer is skipped.
- **S, M, L/XL tiers**: Code-Reviewer runs after every code change.
- The reviewer's findings must be addressed or dismissed before the work is accepted.

---

## 6. Quick Domain Routing

```
Issta2017 hotel code?         → Hotel-Expert-2017
ITS V5 / Gimmonix?            → Hotel-Expert-V5
Angular search widget/lib?    → Search Engine Expert
Angular hotel results page?   → WebAgent-Expert-Hotel-Client
.NET 10 hotel server?         → WebAgent-Hotel-Server-Expert
New API + Angular consumer?   → WebAgent-Hotel-Server-Expert first, then WebAgent-Expert-Hotel-Client

---

## 7. Task Tier System

Aluf⭐ classifies every task into a tier at the start of each response. The tier controls which support agents run:

| Tier | When to use | Pipeline |
|------|-------------|----------|
| **XS** | `[fast]` prefix in your prompt; OR single-file rename/string/config/CSS change | Specialist only |
| **S** | 1–3 file low-risk bugfix or minor UI tweak | Specialist → Code-Reviewer |
| **M** | Multi-file logic change, no new feature | Memory RETRIEVE → Specialist → Code-Reviewer |
| **L/XL** | New feature, architectural change, cross-domain | Full pipeline |

**Quick tip**: Prefix your prompt with `[fast]` for small tasks to skip Memory, Rating-Agent, and Code-Reviewer automatically.

Example: `[fast] change the error message on HotelsController line 42`
```

Pure code review? → Code-Reviewer directly
Memory store/retrieve? → Memory-Agent directly
Unsure / multi-domain? → Aluf⭐

```

```
