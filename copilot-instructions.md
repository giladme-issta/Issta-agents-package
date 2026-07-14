# Copilot Instructions — Issta Agents

Send any task to `@Router`; direct `@<specialist>` invocation is allowed if you know the domain.

## Domains

| Agent                          | Domain                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `Hotel-Expert-2017`            | Issta2017 legacy ASP.NET MVC 5 hotels (controllers, managers, GTM, jQuery views) |
| `Hotel-Expert-V5`              | ITS V5, Gimmonix adapter, ITS.Adapters.\*, cancellation policies                 |
| `search-engine-expert`         | Angular search engine widget/lib, ENGINE_REGISTRY, engine tabs/inputs            |
| `WebAgent-Expert-Hotel-Client` | Angular hotel results page, filters, map, GA4, hotels-search-page app            |
| `WebAgent-Hotel-Server-Expert` | .NET 10 WebAgent hotel server, HotelsBL, Workers, DI                             |
| `Code-Reviewer`                | Explicit review requests only                                                    |

## `[fast]` prefix

Prepend `[fast]` to skip code review and minimize output. Use for small changes, renames, and single-file edits.

Example: `@Hotel-Expert-2017 [fast] rename this variable`

All agent behavior rules live in the COMMON-BLOCK inside each agent file.
