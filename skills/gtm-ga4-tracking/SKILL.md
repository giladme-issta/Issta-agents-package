---
name: gtm-ga4-tracking
description: "GTM data layer push patterns and GA4 event conventions for Issta products. Use when adding or reviewing analytics tracking in Issta2017 (legacy jQuery/Razor) or Angular WebAgent hotel results page."
argument-hint: "Describe the user action or product event you are tracking"
---

# GTM / GA4 Tracking — Issta Conventions

## 1. Data Layer Push — Pattern

All events are pushed to `window.dataLayer` using the standard GTM push format.

### Basic Push (JavaScript / Legacy)

```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "issta_<product>_<action>",
  // event-specific parameters below
});
```

### Angular Service Push

In Angular, tracking is centralized in a dedicated tracking service — never call `window.dataLayer.push` directly from a component:

```typescript
@Injectable({ providedIn: "root" })
export class HotelTrackingService {
  private readonly dataLayer = (window as any).dataLayer as object[];

  trackHotelClick(hotel: HotelItem, position: number): void {
    this.dataLayer.push({
      event: "issta_hotels_select_item",
      ecommerce: {
        items: [this.mapToGa4Item(hotel, position)],
      },
    });
  }

  trackSearch(request: HotelSearchRequest, resultCount: number): void {
    this.dataLayer.push({ ecommerce: null }); // clear previous ecommerce object
    this.dataLayer.push({
      event: "issta_hotels_search",
      search_term: request.destination,
      checkin_date: request.checkIn,
      checkout_date: request.checkOut,
      num_adults: request.adults,
      num_children: request.children,
      result_count: resultCount,
    });
  }

  private mapToGa4Item(
    hotel: HotelItem,
    position: number,
  ): Record<string, unknown> {
    return {
      item_id: hotel.code,
      item_name: hotel.name,
      item_category: "Hotels",
      item_category2: hotel.countryName,
      item_category3: hotel.cityName,
      price: hotel.lowestPrice,
      currency: "ILS",
      index: position,
    };
  }
}
```

---

## 2. GA4 Event Naming Convention

All Issta GA4 custom events follow the pattern:

```
issta_<product>_<action>
```

### Standard Event Names by Product

| Product       | Action             | Event Name                     |
| ------------- | ------------------ | ------------------------------ |
| Hotels        | Search             | `issta_hotels_search`          |
| Hotels        | View results       | `issta_hotels_view_item_list`  |
| Hotels        | Click hotel card   | `issta_hotels_select_item`     |
| Hotels        | View hotel details | `issta_hotels_view_item`       |
| Hotels        | Begin checkout     | `issta_hotels_begin_checkout`  |
| Hotels        | Purchase           | `issta_hotels_purchase`        |
| Hotels        | Apply filter       | `issta_hotels_filter`          |
| Hotels        | Sort results       | `issta_hotels_sort`            |
| Hotels        | Map interaction    | `issta_hotels_map_interaction` |
| Flights       | Search             | `issta_flights_search`         |
| Search Engine | Tab switch         | `issta_engine_tab_switch`      |
| Search Engine | Submit search      | `issta_engine_search_submit`   |

---

## 3. Ecommerce Events — GA4 Format

**Always clear ecommerce before pushing a new ecommerce event:**

```javascript
window.dataLayer.push({ ecommerce: null }); // required before every ecommerce push
window.dataLayer.push({
  event: "issta_hotels_view_item_list",
  ecommerce: {
    item_list_id: "hotel_results",
    item_list_name: "Hotel Search Results",
    items: hotels.map((hotel, index) => ({
      item_id: hotel.code,
      item_name: hotel.name,
      item_category: "Hotels",
      item_category2: hotel.countryName,
      price: hotel.lowestPrice,
      currency: "ILS",
      index: index + 1, // 1-based position
    })),
  },
});
```

**Rules:**

- **Always push `{ ecommerce: null }` before any ecommerce event** — failure to do so causes data bleeding between events in GA4.
- `index` in items is **1-based**.
- `currency` is always `'ILS'` for domestic prices.
- `price` must be a number, not a formatted string.

---

## 4. Legacy Razor/jQuery — Inline Push Pattern

In Issta2017, tracking calls are made in JavaScript files under `Resources/js/`:

```javascript
// Resources/js/hotels/hotel-results.js
var IsstaHotels = IsstaHotels || {};

IsstaHotels.trackHotelClick = function (hotelCode, hotelName, price, position) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: "issta_hotels_select_item",
    ecommerce: {
      items: [
        {
          item_id: hotelCode,
          item_name: hotelName,
          price: price,
          currency: "ILS",
          index: position,
        },
      ],
    },
  });
};
```

**Rules:**

- Use IIFE or namespace (`IsstaHotels.trackXxx`) — no global function names.
- Never push tracking data inline in Razor views — always delegate to a JS function.
- Bind click events in `$(document).ready()`, not inline `onclick`.

---

## 5. User Properties & Context

Push user context once on page load (done globally by the page template):

```javascript
window.dataLayer.push({
  event: 'issta_user_context',
  user_type: 'registered' | 'guest' | 'agent',
  is_mobile: true | false,
  page_product: 'hotels' | 'flights' | 'ski' | ...,
  environment: 'production' | 'staging',
});
```

**Rule**: Never re-push `issta_user_context` per user action — it is a one-time page-load event.

---

## 6. CUG (Club User Group) Tracking

When a hotel card shows a CUG price, include the `cug` flag:

```javascript
window.dataLayer.push({
  event: "issta_hotels_select_item",
  ecommerce: {
    items: [
      {
        item_id: hotel.code,
        item_name: hotel.name,
        price: hotel.cugPrice ?? hotel.lowestPrice,
        currency: "ILS",
        promotion_name: hotel.hasCugPrice ? "CUG" : undefined,
        index: position,
      },
    ],
  },
});
```

---

## 7. Common Mistakes to Avoid

- **Forgetting `{ ecommerce: null }`** before ecommerce events — causes stale data in GA4 reports.
- **String prices** — `price: "1,299"` breaks GA4 numeric aggregation; always use `Number(price)`.
- **0-based index** — GA4 items `index` must be 1-based.
- **Tracking inside a service call** — track on user interaction (click/submit), not on API response arrival.
- **Duplicate events** — do not track the same action in both the component and a parent wrapper.
