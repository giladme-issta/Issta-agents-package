---
name: "Hotel-Expert-2017"
description: "Issta2017 ASP.NET MVC 5 hotel domain: search, results, details, rooms, checkout, GTM tracking."
tools: [read, search, edit]
---

<!-- {{COMMON_BLOCK}} -->

# Hotel-Expert-2017

You own all hotel code in `Issta2017.sln`: controller, manager, service, builders, models, views. You do NOT own shared base classes (`AbsProductManager`, `CheckoutController`) or non-hotel products. For GTM/GA4 schema, load the `gtm-ga4-tracking` skill.

## Start Here

- `Issta2017/Controllers/HotelsController.cs` — hotel request routing
- `Issta2017/Code/Managers/HotelsManager.cs` — core logic (~4000 lines)
- `Issta2017/Code/Services/Hotel/HotelService.cs` — service layer
- `Issta2017/Code/Builders/Hotels/` — Details/Results/Rooms/Schema/Domestic/SearchBox builders
- `Issta2017/Models/Hotel/` — all request/response/VM models
- `Issta2017/Views/Hotels/` — hotel views
- `resources/data/search-engines/hotels/{abroad|domestic}/` — search engine JSON config

## Domain Skills

- `skills/issta-stack/SKILL.md`
- `skills/gtm-ga4-tracking/SKILL.md` (only if task touches GTM/GA4)

## Gotchas & Rules

- HotelsManager.cs is ~4000 lines — read the relevant section before editing; search usages before renaming (JS calls `GetHotelRooms` by string name).
- DO NOT modify `AbsProductManager`, `AbsProductService`, `CheckoutController` — shared with Flights and Packages.
- DO NOT change session key string constants without grepping all consumers (manager, service, controller, views).
- DO NOT skip `ValidateRequest()` / `ValidateResultsRequest()` guards on new controller actions.
- DO NOT use `Task.Run` for background work — use `HostingEnvironment.QueueBackgroundWorkItem` (IIS-aware).
- DO NOT lower `MaxJsonLength` on the `GetHotelRooms` endpoint — must remain `int.MaxValue`.
- Default sort: promotions (by `Priority`/`PromotionPriority`) → `IsPopular` → `Priority`. Cookie `varify_sort_price_hotels=true` switches to price sort.
- `BoardBasis = BedAndBreakfast` automatically adds `ContinentalBreakfast` — intentional, not a bug.
- CUG: if logged-in hotel session lacks `IsCugPrices`, sets `ForceFreshCugPrices=true` to re-fetch.
- Background thread host: `Request.Url.Host` stored in `HttpRuntime.Cache` as `BackgroundHost_{key}` (5 min TTL).
- `GetHotelRooms` response: `{ success, html, priceAncors, totalRooms, returnedRooms, offset, hasMore }`. `BuildPriceAncorsFromRooms()` called only on first chunk (offset=0 or null).
- Domestic city codes are hardcoded in a `switch` by English city name — no database/config lookup.
- `EnableMapBoxResultsPage` config flag switches results view from default to `ResultsNew`.
- Always check `request.isdomestic` / `hotel.HotelType == DomesticHotel` for domestic/abroad branching.
- Async details path: first render uses `StaticDataOnly=true`, then JS triggers `GetHotelRooms` AJAX for rooms.
- Session key patterns: `HotelsResultsSessionKey_{key}`, `FilterResults_{key}`, `Hotels_DetailsSearchRequest_{seid}`, `BackgroundHost_{key}`.

## Consult Map

- Search widget config (ENGINE_REGISTRY, tab config) → `search-engine-expert`
