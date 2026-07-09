---
name: skill-route
description: "Master skills directory. Load this first to identify which skill(s) apply to your task. Lists all available skills, their purpose, the path to load them, and which agents must use them."
argument-hint: "Describe your task or domain to find the right skill(s)"
---

# Skill Route — Master Skills Directory

**Load this skill first.** Then use the table below to find and load the correct skill(s) for your task.

All skills live at: `c:\Users\giladme\.copilot\skills\`

---

## Skills Registry

| Skill                 | Full Path                                                     | Purpose                                                                                                                       | Must-Use Agents                                    |
| --------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **issta-stack**       | `c:\Users\giladme\.copilot\skills\issta-stack\SKILL.md`       | Issta tech stack conventions — .NET 4.8 MVC, .NET 10 Clean Architecture, Angular, jQuery. **Mandatory for all coding tasks.** | ALL coding agents                                  |
| **angular-patterns**  | `c:\Users\giladme\.copilot\skills\angular-patterns\SKILL.md`  | Angular 17+ patterns: standalone components, signals, RxJS, DI, lazy loading in the Issta widget monorepo                     | Search Engine Expert, WebAgent-Expert-Hotel-Client |
| **dotnet-clean-arch** | `c:\Users\giladme\.copilot\skills\dotnet-clean-arch\SKILL.md` | .NET 10 Clean Architecture: MediatR CQRS, Workers, Result pattern, DI registration, handler conventions                       | WebAgent-Hotel-Server-Expert, Hotel-Expert-V5      |
| **owasp-security**    | `c:\Users\giladme\.copilot\skills\owasp-security\SKILL.md`    | OWASP Top 10 review checklist for C# + Angular: injection, XSS, broken auth, sensitive data exposure                          | Code-Reviewer                                      |
| **memory-structure**  | `c:\Users\giladme\.copilot\skills\memory-structure\SKILL.md`  | Memory system layout, entry/domain/index file formats, and the agent rating ledger format                                     | Memory-Agent                                       |
| **gtm-ga4-tracking**  | `c:\Users\giladme\.copilot\skills\gtm-ga4-tracking\SKILL.md`  | GTM data layer push patterns, GA4 event structure, Issta product event naming conventions                                     | Hotel-Expert-2017, WebAgent-Expert-Hotel-Client    |
| **gimmonix-adapter**  | `c:\Users\giladme\.copilot\skills\gimmonix-adapter\SKILL.md`  | Gimmonix adapter patterns: search/book/cancel contracts, supplier mapping, CUG prices, error handling                         | Hotel-Expert-V5                                    |
| **rating-skill**      | `c:\Users\giladme\.copilot\skills\rating-skill\SKILL.md`      | Agent performance rating: scoring criteria, scale (1–5), report format, ledger maintenance. **Rating-Agent only.**            | Rating-Agent                                       |

---

## Quick Routing by Domain

### Issta2017 — Legacy .NET 4.8 MVC

→ **issta-stack** (mandatory)
→ **gtm-ga4-tracking** (if touching analytics/GTM events)

### WebAgent Server — .NET 10 Clean Architecture

→ **issta-stack** (mandatory)
→ **dotnet-clean-arch**

### Angular Hotel Results / Search Engine Widget

→ **issta-stack** (mandatory)
→ **angular-patterns**
→ **gtm-ga4-tracking** (if touching GA4 events)

### ITS V5 / Gimmonix Adapter

→ **issta-stack** (mandatory)
→ **dotnet-clean-arch**
→ **gimmonix-adapter**

### Code Review

→ **owasp-security**
→ **issta-stack** (as convention reference)

### Memory Store / Retrieve

→ **memory-structure**

### Rating Agent Performance (Aluf⭐ only)

→ **rating-skill**

---

## How to Load a Skill

Use the `read_file` tool on the full path shown in the table. Apply all rules from the skill before writing or modifying any code.

**Example:** To load `angular-patterns`:

```
read_file: c:\Users\giladme\.copilot\skills\angular-patterns\SKILL.md
```
