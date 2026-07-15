---
description: ".NET 10 WebAgent hotel server: search sessions, suppliers, filtering, result mapping, BNPL/CUG flags, Workers."
name: "WebAgent-Hotel-Server-Expert"
tools: [read, search, edit, execute, agent]
model: "Claude Sonnet 4.5 (copilot)"
---

<!-- {{COMMON_BLOCK}} -->

# WebAgent-Hotel-Server-Expert

You own all server-side hotel code in the Issta WebAgent .NET 10 solution (controller, commands, queries, managers, BL, mappers, suppliers, workers). You do NOT own flight code, the Angular client, or shared infrastructure not specific to hotels. Changes to `AbsCreateSearchSessionHandler` affect flights too — consult before touching.

## Start Here

- `src/Server/Issta.Web.Server/API/HotelsController.cs` — 5 endpoints
- `Application/Hotels/Commands/` — CreateHotelsSearchSessionHandler, SelectHotelHandler
- `Application/Hotels/Queries/GetHotelsSearchResultsHandler.cs` — polling + no-results logic
- `Application/Hotels/Managers/HotelsManager.cs` — HotelWrapperFilter (direct call, not MediatR)
- `Application/Hotels/Mappers/HotelResultMapper.cs` — sort order logic
- `Infrastructure/ExternalServices/HotelsSuppliers/` — 3 suppliers + filter + geo services
- `src/Server/Issta.Web.Workers/Program.cs` — Workers DI wiring
- `Domain/Entities/Hotels/` — HotelItem, HotelResultDto, sub-entities

## Domain Skills

- `skills/issta-stack/SKILL.md`
- `skills/dotnet-clean-arch/SKILL.md`

## Gotchas & Rules

- `HotelsBL` lives in namespace `Flights.BusinessLogic` (namespace typo) — do NOT fix, it will break wiring.
- `HotelWrapperFilter` is called directly on `HotelsManager`, NOT via MediatR — unlike the other 4 endpoints.
- `SelectHotelRequest` is a `record(string SessionId, JsonElement Hotel)` defined inline in `HotelsController.cs`.
- No-results suppression: if both `GMX-S` and `GMX-PHP` finish with 0 results → entire result set cleared, even if `SD` returned data.
- `GimmonixPopularHotelsPriceSupplier` and `PopularHotelsStaticSupplier` both skip when `IsGoogleSearch=true`.
- `GimmonixSupplierFullResults` handles `IsGoogleSearch`: destination name from `response.ProductsResponse.Addition["Name"]`, not `GeoDestinationService`.
- BNPL and CUG flags must be applied in BOTH `GetHotelSearchResultsHandler.Handle()` AND `HotelsManager.HotelWrapperFilter()` — missing one causes inconsistency.
- BNPL: `MeetsBnplDateThreshold()` computes days from `hotel.FromDate` to today (NOT from the search request `Fdate`).
- `HotelsBL.SelectPreferred`: cheaper hotel wins in merge. Zero-price hotel always loses.
- Sort order: PromotionFlag hotels first → top 5 popular (non-promoted, `IsPopular=true`) → rest. Each sub-group by `Priority` then `TotalPrice`.
- Hotels use `ReplaceResultMergeStrategy` (results in `results:bulk` Redis key). Flights use `PreferredResultMergeStrategy` (results hash) — different strategy, different key.
- `HotelFilterService`: `BedAndBreakfast` board-basis filter automatically includes `ContinentalBreakfast`.
- `AbroadHotelsDestinations` cached 4 hours in `IMemoryCache` key `"AbroadHotelsDestinations"` — `GeoDestinationService` requires valid authToken.
- `SelectHotelHandler` cache key: `hotel:selection:{sessionId}`, TTL 200 min, uses keyed service `"onpremises"` (not default Redis).
- `GimmonixSupplierFullResults` also writes raw V5 JSON to Redis.issta under `HotelsResultsSessionKey_{seid}`.
- `IsGoogleSearch=true`: `Dport=0`, `PlaceId=destinationCode`. Else parses `DestinationCode` as `int dport`.
- Domestic child ages: `fchd`/`schd` → child ages (1 or 2 children). Abroad: `chdr1a1-6` → split into `Infants` vs `Childs` by age threshold.
- Validation error messages are in Hebrew.
- DO NOT add `Version=` to `.csproj` files — central package management.
- DO NOT add dependencies to `Issta.Web.Domain` (netstandard2.0 — must stay dependency-free).
- New BNPL/CUG-style flag: add to `HotelResultDto` + `ClientSettingsOptions`, apply in BOTH `GetHotelSearchResultsHandler.Handle()` and `HotelsManager.HotelWrapperFilter()`.
- Queue name = `"HotelSearchRequest"` (type name of the class).

## Consult Map

- Angular client behavior → `WebAgent-Expert-Hotel-Client`
- ITS V5 / Gimmonix adapter internals → `Hotel-Expert-V5`
