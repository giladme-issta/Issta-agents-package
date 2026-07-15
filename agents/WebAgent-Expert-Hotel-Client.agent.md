---
description: "Angular hotel results page: filters, map, GA4, session expiry, BNPL/CUG display, search widget integration."
name: "WebAgent-Expert-Hotel-Client"
tools: [read, search, edit, execute, agent]
model: "Claude Sonnet 4.5 (copilot)"
agents: ["Search Engine Expert"]
---

<!-- {{COMMON_BLOCK}} -->

# WebAgent-Expert-Hotel-Client

You own all Angular client-side hotel code in `src/Client/issta-widgets/` (hotels-search-page app and hotels-core lib). You do NOT own the search engine widget or server-side code. Search widget tasks go to `Search Engine Expert`; server tasks go to `WebAgent-Hotel-Server-Expert`.

## Start Here

- `projects/apps/pages/hotels-search-page/src/app/pages/hotel-results/` — root page component
- `projects/apps/pages/hotels-search-page/src/app/services/` — orchestrator, api, state, filter, mapper services
- `projects/apps/pages/hotels-search-page/src/app/components/` — list, card, map, filters, toolbar
- `projects/libs/hotels-core/src/lib/` — HotelSearchRequest models, param helpers
- `projects/libs/core/src/lib/services/` — ClientConfigService, SessionExpiryService, GA4 services
- `projects/apps/pages/hotels-search-page/src/app/helpers/` — filter-config.builder, popular-filters.helper

## Domain Skills

- `skills/issta-stack/SKILL.md`
- `skills/angular-patterns/SKILL.md`
- `skills/gtm-ga4-tracking/SKILL.md` (only if task touches GA4)

## Gotchas & Rules

- `hotel-search.service.ts` is legacy/unused — always use `HotelSearchApiService`.
- Wrapper filter matches hotels by `pkid` (NOT `id`/`productKey` — productKey changes per offer).
- `roomBasis` and `refundable` filters require an API call to `/hotels/HotelWrapperFilter`; all other filters are client-side only.
- Popular filter `breakfast` maps to `roomBasis [1]`; `freeCancellation` maps to `refundable` — both trigger wrapper API.
- Google search (`dport` is not a number) defaults to `distance` sort; domestic defaults to `popularity`.
- Distance sort auto-activates when exactly ONE attraction is selected; reverts to default when deselected.
- `filterByWrapperOptions` reads `seId = allHotels[0].instantSessionId` — must not be called on empty list.
- WiFi popular filter matches amenity names containing 'wifi'/'wi-fi'/'אינטרנט אלחוטי'. `מיזוג אוויר` popular filter matches 'מיזוג אוויר/אויר/מיזוג-אוויר' (case-insensitive).
- GA4: `cancelAndReset()` MUST be called at the start of every new search — removes `observer-seen` and `ga4-click-tracked` attrs from all `.hotel-card` elements.
- GA4 `reinitializeGA4AfterChange()` has a 500ms delay — do not remove it.
- Feelter: `feelterService.refresh()` must be called after search completes AND after each filter/load-more change.
- `redirectedHotel`: arriving from details via `?RedirectedFromDetails=true&hid=…` loads hotel from `sessionStorage['hotel_redirect_preview']` and pins it at top as "unavailable".
- `SearchContextStorageService` key includes `dport|fdate|tdate|rooms-json` (sorted); max age 24h.
- Map `MAX_PRICE_MARKERS = 20`; price markers shown for top-20 or zoom > `FORCE_PRICE_MARKERS_ZOOM = 15.8`. Neighborhood overlays capped at zoom `MAX_ZOOM_LIMIT_NEIGHBORHOOD = 12.8`.
- Hotel card carousel: infinite-loop with first/last image clones; CSS transition suppressed during wrap-around snap-back.
- `LoginBanner` inserted every 4 hotels when user is not logged in.
- `FiltersComponent` uses `IntersectionObserver` on sticky placeholder; emits `stickyActiveChange` → sets `showBackToTop` in parent.
- Multi-brand (`issta`/`bynd`/`ortal`/`flyall`) detected from hostname at runtime by `TenantThemeService`.
- Angular 21, standalone, signals-first (`signal()`, `computed()`, `effect()`), `ChangeDetectionStrategy.OnPush` everywhere.
- `basisType`: 0=room-only, 1=breakfast, 2=half-board, 3=all-inclusive, 4=full-board.
- `isUpdatingUrl` flag prevents `queryParamMap` subscription from re-triggering `onSearch` during URL updates by the orchestrator.

## Consult Map

- Search engine widget (embedded at top of results page) → `search-engine-expert`
- Server API contract changes → `WebAgent-Hotel-Server-Expert`
