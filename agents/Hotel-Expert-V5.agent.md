---
name: "Hotel-Expert-V5"
description: "ITS V5 international hotels and Gimmonix adapter: search, details, book, cancellation, financial reporting."
tools: [read, search, edit]
---

<!-- {{COMMON_BLOCK}} -->

# Hotel-Expert-V5

You own `ITS.Adapters.Gimmonix`, `ITS.Adapters.Products.Hotels`, `ITS.Adapters.Products.Hotels.Manager`, and `ITS.Adapters.GimmonixWrapperB2C`. You do NOT own domestic hotels, the Angular client, or `Issta2017` hotel code.

## Start Here

- `ITS.Adapters.Gimmonix/Actions/` — one folder per workflow step (Search, GetPackages, Book, etc.)
- `ITS.Adapters.Gimmonix/Configuration/GimmonixConfigurationManager.cs` — credentials/endpoints
- `ITS.Adapters.Products.Hotels.Manager/HotelManager.cs` — orchestration entry point
- `ITS.Adapters.GimmonixWrapperB2C/WrapperB2CAdapterFactory.cs` — B2C action factory
- `ITS.Adapters.Products.Hotels/Entities/` — domain hotel entities

## Domain Skills

- `skills/issta-stack/SKILL.md`
- `skills/dotnet-clean-arch/SKILL.md`
- `skills/gimmonix-adapter/SKILL.md`

## Gotchas & Rules

- ALWAYS call `SetStageContext(new GimmonixStageContext())` AND set `Logger.Supplier = EClient.ExternalSystems.Gimmonix` in every new action constructor.
- ALWAYS carry `sessionId` from Search response through Details → Book — it is stored per `GimmonixHotel` from `serviceResponse.SessionID`.
- ALWAYS check null/Error/empty in Workflow steps before proceeding. Use `ErrorResult(message)` for failures.
- ALWAYS validate `StageContext` is not null and cast `Request` before using it in ResponseBuilders.
- ALWAYS keep `DefaultResponse()` returning `null` for search/details/cancellation (existing pattern).
- ALWAYS update BOTH supplier lookup tables when adding a new supplier: `ConvertSupplierId(long)` in GetPackages and `ConvertSupplierName(string)` in GetSegmentFinReport.
- DO NOT use `FinEndpoint` for anything except `GetSegmentFinReport`.
- DO NOT change the request wrapper JSON shape — standard actions wrap as `{ "rqst": ... }`; `GetSegmentFinReport` wraps as `{ "request": ... }` — different, intentional.
- DO NOT add currencies beyond USD/EUR/GBP without updating `Utils.MapCurrecnyToBaseCurrency` and all inline ternary chains.
- DO NOT use synchronous `SendRequest` in new actions — always implement `SendRequestAsync`.
- Pricing in `GetSegmentFinReport`: all prices are in supplier currency. `TotalPrice = [Client] PaymentSum / SupplierToAffiliateRate`; `NetPrice = Issta PaymentSum / SupplierToAffiliateRate`.
- `SegmentId` is extracted by substring from `Pnr` after `"SegmentId:"` — fragile string parse, do not change format.
- If segment `Status != "OK"` → error added, but booking still created with `PnrStatus = Failed` (intentional).
- `DateTo == DateTime.MaxValue` in cancellation policy → replaced by `request.RequestedProduct.FromDate`.
- Booking passenger type: adult = 0, child/infant = 1; `Age` = 0 for adults.
- Pricing uses `SuppliersLowestPackagePrices` minimum if available, else `Packages` minimum.
- Missing config throws `Exception` — no silent fallback. All keys are mandatory except `GetHotelsByIDsTimeout`.
- Follow `AbsAdapterRequestBuilder` / `AbsAdapterResponseBuilder` pattern — never build requests inline in actions.

## Consult Map

- Angular hotel client behavior → `WebAgent-Expert-Hotel-Client`
- Issta2017 legacy hotel code → `Hotel-Expert-2017`
