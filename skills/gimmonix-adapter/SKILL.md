---
name: gimmonix-adapter
description: "Gimmonix adapter patterns for ITS V5 international hotels. Covers search/book/cancel request-response contracts, supplier mapping, CUG pricing, cancellation policies, error handling, and the GimmonixWrapperB2C layer."
argument-hint: "Describe the workflow or data mapping you are implementing or reviewing"
---

# Gimmonix Adapter — ITS V5 Hotels

## 1. Project Map

| Project                                | Role                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------- |
| `ITS.Adapters.Gimmonix`                | Core Gimmonix API interactions: all request building and response parsing |
| `ITS.Adapters.Products.Hotels`         | Hotel-specific entity types: `HotelItem`, `RoomOption`, `HotelDetails`    |
| `ITS.Adapters.Products.Hotels.Manager` | `HotelManager` + `HotelManagerFactory` orchestration                      |
| `ITS.Adapters.GimmonixWrapperB2C`      | B2C-facing wrapper: `Login`, `GetPage`, `CancelBooking`                   |
| `ITS.Adapter.Entities`                 | Shared base types: `ProductProviderHotelBase`, `BaseProductManager`       |

---

## 2. Workflow Overview

```
HotelManagerFactory
  └─ HotelManager
       ├─ SearchAsync()     → IGimmonixClient.SearchHotels()
       ├─ GetDetailsAsync() → IGimmonixClient.GetHotelDetails()
       ├─ BookAsync()       → IGimmonixClient.BookHotel()
       └─ CancelAsync()     → IGimmonixClient.CancelBooking()
```

Each step produces a domain entity (`HotelSearchResult`, `HotelDetails`, `BookingConfirmation`) via a mapper — raw Gimmonix API models are never passed upstream.

---

## 3. Search Request

```csharp
// ITS.Adapters.Gimmonix/Models/GimmonixSearchRequest.cs
public class GimmonixSearchRequest
{
    public string Destination { get; set; }     // Gimmonix city/area code
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public List<RoomOccupancy> Rooms { get; set; }  // one entry per room
    public string Currency { get; set; } = "ILS";
    public string Language { get; set; } = "he";
    public string SupplierCode { get; set; }    // mapped from Issta product code
}

// RoomOccupancy
public class RoomOccupancy
{
    public int Adults { get; set; }
    public List<int> ChildAges { get; set; }    // empty list = no children
}
```

**Rules:**

- `ChildAges` must always be sent as a list — null causes a Gimmonix API error.
- `Currency` defaults to `"ILS"` — override only when the tenant requires otherwise.
- `SupplierCode` must be resolved via the supplier code mapping table before sending.

---

## 4. Search Response — Mapping

```csharp
// ITS.Adapters.Gimmonix/Mappers/GimmonixHotelMapper.cs
public static HotelItem MapSearchResult(GimmonixHotelResult raw)
{
    return new HotelItem
    {
        Code = raw.HotelCode,
        Name = raw.HotelName,
        StarRating = raw.StarRating,
        LowestPrice = raw.Rates?.MinBy(r => r.TotalPrice)?.TotalPrice ?? 0,
        CugPrice = ResolveCugPrice(raw),            // see CUG section
        HasFreeCancellation = raw.Rates?.Any(r => r.IsRefundable) ?? false,
        Location = new GeoPoint(raw.Latitude, raw.Longitude),
        Thumbnail = raw.Images?.FirstOrDefault()?.Url,
    };
}
```

**Critical:** `LowestPrice` must come from `raw.Rates` — the top-level `raw.Price` field is the **rack rate**, not the bookable price. Always use `raw.Rates`.

---

## 5. CUG (Club User Group) Pricing

CUG prices are stored in a **nested** `SpecialRates` list, separate from the standard `Rates` list.

```csharp
private static decimal? ResolveCugPrice(GimmonixHotelResult raw)
{
    var cugRate = raw.SpecialRates?
        .Where(r => r.RateType == GimmonixRateType.Cug)
        .MinBy(r => r.TotalPrice);

    return cugRate?.TotalPrice;
}
```

**Rules:**

- Always call `ResolveCugPrice()` during mapping — do not pass raw results to the mapper without it.
- `CugPrice` is `null` if no CUG rates exist for that hotel.
- Never use `raw.Price` for CUG price — it is always the rack rate regardless of rate type.
- The upstream layer decides whether to display CUG vs standard price; the mapper always maps both.

---

## 6. Room Options

```csharp
public static List<RoomOption> MapRooms(GimmonixHotelDetails details)
{
    return details.Rooms?
        .SelectMany(room => room.Rates, (room, rate) => new RoomOption
        {
            RoomCode = room.RoomCode,
            RoomName = room.RoomName,
            BoardBasis = MapBoardBasis(rate.MealPlan),
            TotalPrice = rate.TotalPrice,
            IsRefundable = rate.IsRefundable,
            CancellationDeadline = rate.CancellationDeadline,
            RateKey = rate.RateKey,           // required for booking — never discard
        })
        .OrderBy(r => r.TotalPrice)
        .ToList()
        ?? new List<RoomOption>();
}
```

**Critical:** The `RateKey` from Gimmonix's response must be preserved through the entire flow to the book request. It expires — do not cache it across sessions.

---

## 7. Cancellation Policies

```csharp
public static CancellationPolicy MapCancellationPolicy(GimmonixRate rate)
{
    if (!rate.IsRefundable)
        return CancellationPolicy.NonRefundable();

    return new CancellationPolicy
    {
        IsRefundable = true,
        FreeUntil = rate.CancellationDeadline,
        Penalties = rate.CancellationRules?
            .Select(r => new CancellationPenalty
            {
                From = r.FromDate,
                Amount = r.PenaltyAmount,
                IsPercentage = r.PenaltyType == "percentage",
            })
            .OrderBy(p => p.From)
            .ToList()
    };
}
```

**Rule:** Always display cancellation deadline in local time with timezone awareness — Gimmonix returns UTC; convert to `Asia/Jerusalem` before display.

---

## 8. Booking Request

```csharp
public class GimmonixBookRequest
{
    public string RateKey { get; set; }             // from search/details response
    public List<GimmonixGuest> Guests { get; set; }
    public string ContactEmail { get; set; }
    public string ContactPhone { get; set; }
    public string SpecialRequests { get; set; }     // optional, plain text
    public string ExternalBookingReference { get; set; }  // Issta internal booking ID
}
```

**Rules:**

- `RateKey` is mandatory and expires — validate it is non-empty before sending.
- `ExternalBookingReference` must be set to the Issta booking ID for reconciliation.
- `SpecialRequests` must be sanitized — strip HTML, limit to 500 characters.

---

## 9. Error Handling

Gimmonix returns HTTP 200 with an `errors` array for business failures (not HTTP 4xx/5xx):

```csharp
public async Task<Result<BookingConfirmation>> BookAsync(GimmonixBookRequest request, CancellationToken ct)
{
    var response = await _client.PostAsync<GimmonixBookResponse>("book", request, ct);

    if (response.Errors?.Any() == true)
    {
        var errorMessage = string.Join("; ", response.Errors.Select(e => e.Message));
        _logger.LogWarning("Gimmonix book error: {Errors}", errorMessage);
        return Result.Fail(errorMessage);
    }

    if (string.IsNullOrEmpty(response.ConfirmationNumber))
        return Result.Fail("Gimmonix returned no confirmation number");

    return Result.Ok(MapConfirmation(response));
}
```

**Common Gimmonix error codes:**

| Code                  | Meaning                      | Handling                              |
| --------------------- | ---------------------------- | ------------------------------------- |
| `RATE_EXPIRED`        | RateKey timed out            | Prompt user to re-search              |
| `HOTEL_NOT_AVAILABLE` | No availability              | Show no-availability message          |
| `INVALID_GUEST_DATA`  | Guest data validation failed | Return validation error to user       |
| `SUPPLIER_ERROR`      | Gimmonix upstream failure    | Retry once; then return generic error |

---

## 10. Supplier Code Mapping

Gimmonix uses its own hotel codes. Issta stores a bidirectional mapping in `SupplierCodeMapping` table / configuration:

```csharp
// Never hardcode supplier codes — always resolve via the mapping service
var gimmonixCode = await _supplierCodeMapper.ToGimmonixCode(isstaHotelCode);
if (gimmonixCode is null)
    return Result.Fail($"No Gimmonix mapping for hotel code: {isstaHotelCode}");
```

**Rule:** Every search and booking call must resolve the supplier code through `ISupplierCodeMapper`. Hard-coded supplier codes are forbidden — mappings can change without a code deployment.
