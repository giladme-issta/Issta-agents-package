---
name: issta-stack
description: "Issta travel tech stack conventions. Use when writing or reviewing code for any Issta repo — legacy .NET Framework 4.8 MVC (ActionResult controllers, Manager classes, DAL) or modern .NET 9-10 Clean Architecture / Angular. Covers stack identification, code style, MVC controller patterns, DAL calls, Clean Architecture layers, Hebrew RTL UI, and naming conventions."
argument-hint: "Describe what you want to build or review"
---

# Issta Stack — Coding Conventions

## 1. Identify the Stack First

| Signal                                                                                   | Stack                            |
| ---------------------------------------------------------------------------------------- | -------------------------------- |
| `Web.config`, `packages.config`, `*.csproj` targeting `v4.8`, `ActionResult` controllers | Legacy .NET Framework 4.8 MVC    |
| `*.csproj` with `<TargetFramework>net9.0` or `net10.0`                                   | Modern .NET (Clean Architecture) |
| `*.ts` files, `angular.json`, `tsconfig.json`                                            | Modern Angular frontend          |
| `*.js` + `$(` patterns, no `tsconfig.json`, Razor `.cshtml` views                        | Legacy jQuery MVC frontend       |

---

## 2. Legacy Backend — .NET Framework 4.8 MVC

### Controller Pattern

```csharp
[Route("results.aspx")]
public ActionResult Results(SearchRequest request)
{
    var resultsVM = new HotelsManager().GetHotelResultsVM(request);
    if (Config.GetBoolConfigValue("EnableMapBoxResultsPage") && !GeneralManager.IsMobileDevice)
        return GetView("ResultsNew", resultsVM);
    return GetView("Results", resultsVM);
}
```

**Controller rules:** No business logic · no `async/await` · use `Config.GetBoolConfigValue`/`GetConfigValue` · mobile via `GeneralManager.IsMobileDevice` · return `GetView()` not `View()`.

**Manager rules:** Owns business logic and VM construction. One Manager per domain module (`HotelsManager`, `FlightsManager`). Called by controller, calls DAL.

**DAL rules:** Always `using` for `SqlConnection`/`SqlCommand` · prefer stored procedures with named `AddWithValue` params · never build SQL via string concatenation · connection string from `ConfigurationManager` only · one DAL class per domain.

**C# style (legacy):** C# 5–7 · `var` for obvious types · `PascalCase` methods/properties/classes · `camelCase` locals/params · `_camelCase` private fields.

---

## 3. Modern Backend — .NET 9/10 Clean Architecture

```
Issta.<Module>/
  Domain/          # Entities, value objects. Zero NuGet dependencies.
  Application/     # ICommandHandler/IQueryHandler, DTOs, repository interfaces.
  Infrastructure/  # EF Core, repositories, external clients.
  API/             # Thin controllers, middleware, DI registration.
```

**Rules:** Dependency direction: API → Application → Domain · MediatR for commands/queries · `Result<T>` across layer boundaries, no raw exceptions · `async/await` throughout, never `.Result`/`.Wait()` · immutable DTOs as `record` types · DI via constructor.

---

## 4. Legacy Frontend — JavaScript / jQuery / MVC

- IIFE/namespace pattern: `Issta.Flights = (function() { ... })();` — no ES modules.
- jQuery for DOM/AJAX. No arrow functions or `const`/`let` unless transpiler is present.
- Bind handlers in `document.ready`, not inline `onclick`.
- Hebrew strings from `@Html.Raw(Json.Encode(...))` — never hard-coded in JS.

---

## 5. Modern Frontend — Angular / TypeScript

- Check `@angular/core` version before writing component syntax. Standalone components for Angular 17+.
- Reactive forms · `providedIn: 'root'` services · HTTP only in services · `AsyncPipe` in templates · no `any` · `kebab-case` selectors and file names.

---

## 6. Hebrew RTL UI

```css
/* Logical properties — layout flips with dir="rtl" */
margin-inline-start: 8px; /* not margin-left */
padding-inline-end: 16px; /* not padding-right */
text-align: start; /* not text-align: left */
```

- `<html lang="he" dir="rtl">` on all pages · mirror directional icons (‹ ›) · date `dd/MM/yyyy` · currency `₪ 1,234` · phone `05X-XXXXXXX`.

---

## 7. Naming Conventions

| Artefact          | Convention                        | Example                      |
| ----------------- | --------------------------------- | ---------------------------- |
| C# class          | `PascalCase`                      | `FlightSearchRequest`        |
| C# private field  | `_camelCase`                      | `_flightRepository`          |
| MVC Controller    | `<Module>Controller`              | `HotelsController`           |
| Manager           | `<Module>Manager`                 | `HotelsManager`              |
| DAL               | `<Entity>DAL`                     | `HotelsDAL`                  |
| Stored procedure  | `sp_<Verb><Entity>`               | `sp_GetFlights`              |
| MediatR command   | `<Verb><Entity>Command`           | `BookFlightCommand`          |
| MediatR query     | `Get<Entity>Query`                | `GetFlightDetailsQuery`      |
| Angular component | `<entity>-<purpose>.component.ts` | `flight-search.component.ts` |
| Angular service   | `<entity>.service.ts`             | `flight.service.ts`          |
| JS namespace      | `Issta.<Module>`                  | `Issta.Flights`              |
| CSS (legacy)      | `kebab-case`, module-prefixed     | `flights-search-panel`       |

---

## 8. Pre-Submit Checklist

- [ ] Stack identified (legacy vs modern, front vs back)
- [ ] No SQL string concatenation in DAL
- [ ] No `.Result`/`.Wait()` in modern async code
- [ ] RTL attributes + logical CSS properties in UI code
- [ ] Controller delegates to Manager — no business logic in controller
- [ ] Config reads use `Config.GetBoolConfigValue`/`GetConfigValue`
- [ ] Mobile branching uses `GeneralManager.IsMobileDevice`
- [ ] Hebrew strings from resource/localisation — not hard-coded
- [ ] Naming follows Section 7 table
