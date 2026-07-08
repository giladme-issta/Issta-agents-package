---
name: angular-patterns
description: "Angular 17+ patterns for the Issta widget monorepo. Use when writing or reviewing any Angular code in search-engine-widget or hotels-search-page. Covers standalone components, signals, RxJS, DI, lazy loading, HTTP, and template conventions."
argument-hint: "Describe the Angular component or service you are building or reviewing"
---

# Angular Patterns — Issta Widget Monorepo

## 1. Project Layout

```
src/Client/issta-widgets/projects/
  apps/
    pages/
      hotels-search-page/     ← Hotel results Angular app (WebAgent-Expert-Hotel-Client domain)
    widgets/
      search-engine-widget/   ← Search engine form Angular app (Search Engine Expert domain)
  libs/
    hotels-core/              ← Shared hotel models, services, mappers (no app-specific code)
    search-engine/            ← Search engine library: components, configs, ENGINE_REGISTRY
```

**Rule**: Library code lives in `libs/`. App-specific code in `apps/`. Never import from `apps/` inside `libs/`.

---

## 2. Standalone Components

All new components must be standalone with `OnPush`:

```typescript
@Component({
  selector: "app-hotel-card",
  standalone: true,
  imports: [CommonModule, RouterModule, HotelPricePipe],
  templateUrl: "./hotel-card.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelCardComponent {
  @Input({ required: true }) hotel!: HotelItem;
  @Output() selected = new EventEmitter<HotelItem>();
}
```

**Rules:**

- Always `standalone: true`.
- Always `ChangeDetectionStrategy.OnPush`.
- Use `@Input({ required: true })` for required inputs.
- Import only what the template actually uses — no wildcard imports.
- Use `inject()` function (not constructor) for dependency injection in new components.

---

## 3. Dependency Injection — inject() Pattern

```typescript
// Preferred for new code
export class HotelListComponent {
  private readonly searchState = inject(HotelSearchStateService);
  private readonly filterService = inject(HotelFilterService);
  private readonly destroyRef = inject(DestroyRef);
}

// Legacy constructor pattern — do not use in new code
export class HotelListComponent {
  constructor(private searchState: HotelSearchStateService) {}
}
```

---

## 4. Signals — State Management

Use signals for reactive state; `computed()` for derived values:

```typescript
@Injectable({ providedIn: "root" })
export class HotelSearchStateService {
  private readonly _hotels = signal<HotelItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Expose as readonly — callers may not write directly
  readonly hotels = this._hotels.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasResults = computed(() => this._hotels().length > 0);

  setResults(hotels: HotelItem[]): void {
    this._hotels.set(hotels);
    this._loading.set(false);
  }

  setLoading(): void {
    this._loading.set(true);
    this._error.set(null);
  }
}
```

**Rules:**

- Prefer signals over `BehaviorSubject` for component-local and service state.
- Always expose state as `asReadonly()` from services.
- Use `computed()` for derived values — never recalculate the same value in the template.
- Private signal fields prefixed with `_`.
- Use `effect()` only for side effects (localStorage sync, DOM integrations). Never for business logic.

---

## 5. RxJS — Async Operations

Use RxJS for HTTP streams, cross-component events, and time-based logic:

```typescript
export class HotelSearchOrchestratorService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchApi = inject(HotelSearchApiService);
  private readonly state = inject(HotelSearchStateService);

  startSearch(request: HotelSearchRequest): void {
    this.state.setLoading();

    this.searchApi
      .search(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          this.state.setError(err.message);
          return EMPTY;
        }),
      )
      .subscribe((results) => this.state.setResults(results));
  }
}
```

**Rules:**

- Always unsubscribe. Prefer `takeUntilDestroyed(this.destroyRef)` (Angular 16+).
- Never subscribe inside a subscribe — flatten with `switchMap` / `mergeMap` / `concatMap`.
- Use `switchMap` for search calls (cancels previous on new emission).
- Use `async` pipe in templates instead of manual subscribe where possible.
- `tap()` is for side effects (logging) only — not for business logic.
- Handle HTTP errors in the service layer or interceptors, never in components.

---

## 6. Template Conventions

```html
<!-- Use Angular 17+ control flow syntax -->
@if (searchState.hasResults()) { @for (hotel of searchState.hotels(); track
hotel.id) {
<app-hotel-card [hotel]="hotel" (selected)="onSelect($event)" />
} } @else if (searchState.loading()) {
<app-hotel-skeleton />
} @else {
<app-no-results />
}
```

**Rules:**

- Use `@if`, `@for`, `@switch` — NOT `*ngIf`, `*ngFor`, `*ngSwitch`.
- Always provide a `track` expression in `@for` (use a unique id).
- Avoid logic in templates — use `computed()` signals or dedicated component methods.
- RTL-first UI (Hebrew): use CSS logical properties (`margin-inline-start`, `padding-inline-end`) — never hard-code `left`/`right`.
- Self-close components with no children: `<app-hotel-card />` not `<app-hotel-card></app-hotel-card>`.

---

## 7. Lazy Loading — Routes

```typescript
// app.routes.ts
export const appRoutes: Routes = [
  {
    path: "hotels/results",
    loadComponent: () =>
      import("./pages/hotel-results/hotel-results.component").then(
        (m) => m.HotelResultsComponent,
      ),
  },
  {
    path: "hotels/results.aspx",
    redirectTo: "hotels/results",
  },
];
```

**Rules:**

- Use `loadComponent()` for page-level components (standalone lazy loading).
- Never import page components eagerly in the root module.
- Keep route paths consistent with the server-side URL routing.

---

## 8. HTTP & Interceptors

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(appRoutes),
    provideAnimations(),
  ],
};
```

**Rules:**

- Use functional interceptors (not class-based `HttpInterceptor`).
- Never call `HttpClient` directly from a component — always go through a service.
- Interceptors handle auth headers and global error responses.
- Never log or expose raw HTTP error bodies to the UI — map to user-safe messages.

---

## 9. Naming Conventions

| Item           | Convention                        | Example                              |
| -------------- | --------------------------------- | ------------------------------------ |
| Component      | `PascalCase` + `Component` suffix | `HotelCardComponent`                 |
| Service        | `PascalCase` + `Service` suffix   | `HotelFilterService`                 |
| Signal         | `camelCase`                       | `activeFilters`, `isLoading`         |
| Private signal | `_camelCase`                      | `_hotels`, `_loading`                |
| Input          | `camelCase`                       | `[hotelId]`, `[isSelected]`          |
| Output         | `camelCase` past tense            | `(hotelSelected)`, `(filterChanged)` |
| File           | `kebab-case.type.ts`              | `hotel-card.component.ts`            |

---

## 10. Common Gotchas

- **Do not use `ngOnChanges`** for signal-based components — use `computed()` instead.
- **`effect()` runs at least once** on initialization even if the signal hasn't changed.
- **`toSignal()`** requires an injection context — call it at field initialization, not inside methods.
- **Zone.js is still active** in this project — do not assume zoneless mode.
- **Mapbox** integration in hotel map must call `map.resize()` after container size changes — it does not observe the DOM automatically.
