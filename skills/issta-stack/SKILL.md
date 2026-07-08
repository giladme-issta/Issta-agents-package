---
name: issta-stack
description: "Issta travel tech stack conventions. Use when writing or reviewing code for any Issta repo — legacy .NET Framework 4.8 MVC (ActionResult controllers, Manager classes, DAL) or modern .NET 9-10 Clean Architecture / Angular. Covers stack identification, code style, MVC controller patterns, DAL calls, Clean Architecture layers, Hebrew RTL UI, and naming conventions."
argument-hint: "Describe what you want to build or review"
---

# Issta Stack — Coding Conventions

## 1. Identify the Stack First

Before writing any code, inspect the repo to determine which stack applies.

| Signal                                                                                                  | Stack                            |
| ------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `Web.config`, `packages.config`, `*.csproj` targeting `v4.8`, `Controllers/` folder with `ActionResult` | Legacy .NET Framework 4.8 MVC    |
| `*.csproj` with `<TargetFramework>net9.0` or `net10.0`                                                  | Modern .NET (Clean Architecture) |
| `*.ts` files, `angular.json`, `tsconfig.json`                                                           | Modern Angular frontend          |
| `*.js` + `$(` patterns, no `tsconfig.json`, Razor `.cshtml` views                                       | Legacy jQuery MVC frontend       |

**Always confirm the stack before generating code.** If ambiguous, ask which repo/layer is in scope.

---

## 2. Legacy Backend — .NET Framework 4.8 MVC

### Controller Pattern

Controllers are thin. They:

1. Receive a bound request model
2. Delegate all work to a `Manager` class (e.g. `HotelsManager`, `FlightsManager`)
3. Use `ViewBag` sparingly for simple flags/data the view needs directly
4. Use `Config.GetBoolConfigValue` / `Config.GetConfigValue` for feature flags and settings
5. Call `GetView(viewName, model)` (the project's helper) instead of `View()` directly
6. Check device type via `GeneralManager.IsMobileDevice` when serving mobile-specific views

```csharp
[Route("results.aspx")]
public ActionResult Results(SearchRequest request)
{
    ViewBag.Request = request;
    var resultsVM = new HotelsManager().GetHotelResultsVM(request);
    var enableMapBox = Config.GetBoolConfigValue("EnableMapBoxResultsPage");
    var isMobile = Issta2017.Code.Managers.GeneralManager.IsMobileDevice;
    if (enableMapBox && !isMobile)
    {
        return GetView("ResultsNew", resultsVM);
    }
    return GetView("Results", resultsVM);
}
```

**Rules:**

- No business logic in the controller — instantiate the relevant Manager and call its method.
- No `async/await` — synchronous throughout.
- Use `Config.GetBoolConfigValue` / `Config.GetConfigValue` for all config reads.
- Mobile branching via `GeneralManager.IsMobileDevice`.
- Return `GetView(viewName, viewModel)` rather than raw `View(...)`.

### Manager Pattern

Managers sit between controllers and the DAL. They own business logic and view-model construction.

```csharp
// File: Code/Managers/HotelsManager.cs
public class HotelsManager
{
    public HotelResultsVM GetHotelResultsVM(SearchRequest request)
    {
        var dal = new HotelsDAL();
        var hotels = dal.GetHotels(request.Destination, request.CheckIn, request.CheckOut);
        // business logic, mapping, filtering
        return new HotelResultsVM { Hotels = hotels, Request = request };
    }
}
```

### DAL Pattern (Legacy)

```csharp
// File: DAL/FlightDAL.cs
public class FlightDAL
{
    private readonly string _connString = ConfigurationManager.ConnectionStrings["IsstaDB"].ConnectionString;

    public List<FlightDto> GetFlights(string origin, string destination, DateTime date)
    {
        var results = new List<FlightDto>();
        using (var conn = new SqlConnection(_connString))
        using (var cmd = new SqlCommand("sp_GetFlights", conn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Origin", origin);
            cmd.Parameters.AddWithValue("@Destination", destination);
            cmd.Parameters.AddWithValue("@Date", date);
            conn.Open();
            using (var reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                    results.Add(MapFlight(reader));
            }
        }
        return results;
    }

    private FlightDto MapFlight(IDataReader reader) => new FlightDto
    {
        FlightId   = reader.GetInt32(reader.GetOrdinal("FlightId")),
        Origin     = reader.GetString(reader.GetOrdinal("Origin")),
        Destination = reader.GetString(reader.GetOrdinal("Destination")),
    };
}
```

**Rules:**

- Always use `using` for `SqlConnection` and `SqlCommand`.
- Prefer stored procedures; pass parameters by name with `AddWithValue`.
- Never build SQL strings via string concatenation (SQL injection risk).
- Connection string from `ConfigurationManager`, never hard-coded.
- One DAL class per domain entity/table group.

### C# Style (Legacy)

- Target: C# 5–7 (no records, no pattern matching, no nullable reference types).
- `var` allowed for obvious types; explicit type for non-obvious declarations.
- `PascalCase` for methods, properties, classes. `camelCase` for local variables and parameters.
- Prefix private fields with `_` (`_connString`).

---

## 3. Modern Backend — .NET 9/10 Clean Architecture

### Layer Structure

```
Issta.<Module>/
  Domain/          # Entities, value objects, domain events. No dependencies.
  Application/     # Use cases (ICommandHandler / IQueryHandler), DTOs, interfaces.
  Infrastructure/  # EF Core DbContext, repositories, external service clients.
  API/             # Controllers (thin), middleware, DI registration.
```

**Rules:**

- Dependency direction: API → Application → Domain. Infrastructure implements Application interfaces.
- Domain has zero NuGet dependencies.
- Use MediatR (or equivalent CQRS mediator) for commands and queries.
- Repository interfaces live in Application; implementations in Infrastructure.
- Return `Result<T>` (or `OneOf`/`FluentResults`) from use cases — no raw exceptions across layer boundaries.

### Command/Query Example

```csharp
// Application/Commands/BookFlight/BookFlightCommand.cs
public record BookFlightCommand(int FlightId, string PassengerId) : IRequest<Result<BookingDto>>;

// Application/Commands/BookFlight/BookFlightCommandHandler.cs
public class BookFlightCommandHandler : IRequestHandler<BookFlightCommand, Result<BookingDto>>
{
    private readonly IFlightRepository _flights;
    private readonly IBookingRepository _bookings;

    public BookFlightCommandHandler(IFlightRepository flights, IBookingRepository bookings)
    {
        _flights  = flights;
        _bookings = bookings;
    }

    public async Task<Result<BookingDto>> Handle(BookFlightCommand cmd, CancellationToken ct)
    {
        var flight = await _flights.GetByIdAsync(cmd.FlightId, ct);
        if (flight is null) return Result.Fail("Flight not found");

        var booking = Booking.Create(flight, cmd.PassengerId);
        await _bookings.AddAsync(booking, ct);
        return Result.Ok(BookingDto.From(booking));
    }
}
```

### C# Style (Modern)

- Target: C# 12+ idioms — `record`, primary constructors, collection expressions, nullable reference types enabled.
- `async/await` throughout; never `.Result` or `.Wait()`.
- Immutable DTOs as `record` types.
- Dependency injection via constructor; avoid service locator.
- XML doc comments on public API surface only.

---

## 4. Legacy Frontend — JavaScript / jQuery / MVC

- Files: `.js` in `/Scripts/`, Razor views in `/Views/`.
- No ES modules — use IIFE or namespace pattern: `Issta.Flights = (function() { ... })();`.
- jQuery for DOM and AJAX: `$.ajax({ url: '/FlightService.asmx/SearchFlights', type: 'POST', contentType: 'application/json', ... })`.
- `camelCase` for variables and functions. `PascalCase` for constructor functions.
- No arrow functions or `const`/`let` unless the project already uses a transpiler.
- Keep business logic out of inline `onclick` — bind in `document.ready`.
- Localisation strings come from server-rendered `@Html.Raw(Json.Encode(...))` — never hard-code Hebrew text in JS.

---

## 5. Modern Frontend — Angular / TypeScript

- Angular version: check `package.json` → `@angular/core` version before generating component syntax.
- Standalone components preferred in Angular 17+; use `NgModule` only if the repo already does.
- `PascalCase` for classes/components; `camelCase` for methods/variables; `kebab-case` for selectors and file names.
- Reactive forms over template-driven forms for complex inputs.
- Services via `providedIn: 'root'` unless lazy-loaded module scope is needed.
- HTTP calls only in services (never directly in components).
- Use `AsyncPipe` in templates to avoid manual `subscribe`/`unsubscribe`.
- Strong typing — avoid `any`; define interfaces for all API response shapes.

---

## 6. Hebrew RTL UI

Apply these rules whenever generating UI code (Razor, Angular templates, CSS):

```html
<!-- Razor / HTML -->
<html lang="he" dir="rtl">
  <body dir="rtl">
    <!-- Angular component -->
    <div dir="rtl" class="rtl-layout"></div>
  </body>
</html>
```

```css
/* Use logical properties so layout flips with dir */
margin-inline-start: 8px; /* instead of margin-left */
padding-inline-end: 16px; /* instead of padding-right */
text-align: start; /* instead of text-align: left */

/* For mixed Hebrew/English inline text */
unicode-bidi: embed;
direction: rtl;
```

- Icons and chevrons that imply direction (‹ ›) must be mirrored for RTL.
- Date format: `dd/MM/yyyy` (Israeli convention).
- Currency: `₪ 1,234` (shekel symbol before amount, comma as thousands separator).
- Phone numbers: `05X-XXXXXXX` format.

---

## 7. Naming Conventions

| Artefact            | Convention                        | Example                      |
| ------------------- | --------------------------------- | ---------------------------- |
| C# class            | `PascalCase`                      | `FlightSearchRequest`        |
| C# private field    | `_camelCase`                      | `_flightRepository`          |
| MVC Controller      | `<Module>Controller`              | `HotelsController`           |
| Manager class       | `<Module>Manager`                 | `HotelsManager`              |
| DAL class           | `<Entity>DAL`                     | `HotelsDAL`                  |
| Stored procedure    | `sp_<Verb><Entity>`               | `sp_GetFlights`              |
| Application command | `<Verb><Entity>Command`           | `BookFlightCommand`          |
| Application query   | `Get<Entity>Query`                | `GetFlightDetailsQuery`      |
| Angular component   | `<entity>-<purpose>.component.ts` | `flight-search.component.ts` |
| Angular service     | `<entity>.service.ts`             | `flight.service.ts`          |
| JS namespace        | `Issta.<Module>`                  | `Issta.Flights`              |
| CSS class (legacy)  | `kebab-case`, prefixed by module  | `flights-search-panel`       |
| CSS class (Angular) | `kebab-case` scoped by component  | `search-panel`               |

---

## 8. Quick Checklist Before Submitting Code

- [ ] Stack correctly identified (legacy vs modern, front vs back)
- [ ] No SQL string concatenation in DAL
- [ ] No `.Result` / `.Wait()` in modern async code
- [ ] RTL attributes/logical CSS properties present in UI code
- [ ] Controller delegates to Manager — no business logic in controller
- [ ] Config reads use `Config.GetBoolConfigValue` / `Config.GetConfigValue`
- [ ] Mobile branching uses `GeneralManager.IsMobileDevice`
- [ ] Error handling logs with shared Logger
- [ ] Hebrew strings come from resource/localisation — not hard-coded
- [ ] Naming follows the table in section 7
