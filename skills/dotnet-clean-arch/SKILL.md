---
name: dotnet-clean-arch
description: "Clean Architecture patterns for the Issta WebAgent .NET 10 project and ITS V5 adapters. Covers MediatR CQRS, command/query handlers, Result pattern, BackgroundService Workers, DI registration, and layer discipline."
argument-hint: "Describe the feature or layer you are building or reviewing"
---

# .NET 10 Clean Architecture — Issta WebAgent & ITS V5

## 1. Layer Structure

```
src/Server/
  Issta.Web.Server/
    API/              ← Controllers (thin), middleware, DI bootstrap
    Application/      ← Commands, Queries, Handlers, BL, DTOs, interfaces
    Domain/           ← Entities, value objects, domain events — zero NuGet dependencies
    Infrastructure/   ← EF Core, repositories, supplier clients, external services, DI registration
```

**Dependency rule (strict):**

```
API → Application → Domain
Infrastructure → Application (implements interfaces only)
```

- Domain has **zero** NuGet dependencies.
- Application depends only on Domain and abstractions — no EF Core, no HTTP clients.
- Infrastructure implements interfaces declared in Application.
- API is the composition root — it wires everything via DI.

---

## 2. MediatR — CQRS Pattern

### Command (write operation)

```csharp
// Application/Commands/SearchHotels/SearchHotelsCommand.cs
public record SearchHotelsCommand(HotelSearchRequest Request, string TenantId)
    : IRequest<Result<HotelSearchResultDto>>;

// Application/Commands/SearchHotels/SearchHotelsCommandHandler.cs
public class SearchHotelsCommandHandler
    : IRequestHandler<SearchHotelsCommand, Result<HotelSearchResultDto>>
{
    private readonly IHotelsBL _hotelsBL;
    private readonly ILogger<SearchHotelsCommandHandler> _logger;

    public SearchHotelsCommandHandler(IHotelsBL hotelsBL, ILogger<SearchHotelsCommandHandler> logger)
    {
        _hotelsBL = hotelsBL;
        _logger = logger;
    }

    public async Task<Result<HotelSearchResultDto>> Handle(
        SearchHotelsCommand cmd, CancellationToken ct)
    {
        var result = await _hotelsBL.SearchAsync(cmd.Request, cmd.TenantId, ct);
        if (result.IsFailed)
        {
            _logger.LogWarning("Hotel search failed: {Errors}", result.Errors);
            return Result.Fail(result.Errors);
        }
        return Result.Ok(HotelResultMapper.ToDto(result.Value));
    }
}
```

### Query (read operation)

```csharp
// Application/Queries/GetHotelDetails/GetHotelDetailsQuery.cs
public record GetHotelDetailsQuery(string HotelCode, string TenantId)
    : IRequest<Result<HotelDetailsDto>>;
```

**Rules:**

- Commands mutate state; Queries read state — never mix.
- One handler per command/query class — no shared handlers.
- Handlers are thin orchestrators: delegate to BL/services, never contain business logic themselves.
- Always return `Result<T>` (FluentResults) — never throw across layer boundaries.
- Use `record` for command/query types (immutable, value-based equality).

---

## 3. Result Pattern

```csharp
// Returning results from BL / handlers
public async Task<Result<HotelItem[]>> SearchAsync(HotelSearchRequest request, CancellationToken ct)
{
    if (request.CheckIn >= request.CheckOut)
        return Result.Fail("CheckIn must be before CheckOut");

    var suppliers = await RunSuppliersAsync(request, ct);
    if (!suppliers.Any())
        return Result.Ok(Array.Empty<HotelItem>());

    return Result.Ok(MergeResults(suppliers));
}

// Consuming in handler
var result = await _bl.SearchAsync(request, ct);
if (result.IsFailed)
    return Result.Fail(result.Errors);

// Using value
var items = result.Value;
```

**Rules:**

- Never throw exceptions for expected failures (validation, supplier timeouts, no results).
- Throw exceptions only for truly unexpected/unrecoverable states.
- Unwrap `.Value` only after checking `result.IsSuccess`.
- Propagate errors up with `Result.Fail(result.Errors)` — don't lose error context.

---

## 4. Controller — Thin API Layer

```csharp
// API/HotelsController.cs
[ApiController]
[Route("api/hotels")]
public class HotelsController : ControllerBase
{
    private readonly IMediator _mediator;

    public HotelsController(IMediator mediator) => _mediator = mediator;

    [HttpPost("search")]
    public async Task<IActionResult> Search(
        [FromBody] HotelSearchRequest request, CancellationToken ct)
    {
        request = request with { TenantId = User.GetTenantId() };
        var result = await _mediator.Send(new SearchHotelsCommand(request, request.TenantId), ct);

        return result.IsSuccess
            ? Ok(result.Value)
            : BadRequest(result.Errors.Select(e => e.Message));
    }
}
```

**Rules:**

- Controller does three things only: enrich request context (auth/tenant), send via MediatR, translate Result to HTTP response.
- No business logic in controllers.
- No direct service calls — always go through `IMediator`.
- Always pass `CancellationToken` from the action parameter through to MediatR.

---

## 5. BackgroundService Workers

```csharp
// Infrastructure/Workers/HotelSupplierWorker.cs
public class HotelSupplierWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<HotelSupplierWorker> _logger;

    public HotelSupplierWorker(IServiceScopeFactory scopeFactory, ILogger<HotelSupplierWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in _bus.ReadAllAsync(stoppingToken))
        {
            using var scope = _scopeFactory.CreateScope();
            var supplier = scope.ServiceProvider.GetRequiredService<IGimmonixSupplier>();
            await supplier.ProcessAsync(message, stoppingToken);
        }
    }
}
```

**Rules:**

- Workers must create a new `IServiceScope` per message — never reuse scoped services across messages.
- Always pass `stoppingToken` to all async calls.
- Log errors per message; never let one message failure crash the entire worker.
- Register workers with `services.AddHostedService<HotelSupplierWorker>()`.

---

## 6. DI Registration

```csharp
// Infrastructure/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddHotelInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IHotelRepository, EfHotelRepository>();
        services.AddScoped<IHotelFilterService, HotelFilterService>();
        services.AddHttpClient<IGimmonixClient, GimmonixClient>(client =>
        {
            client.BaseAddress = new Uri(/* config */);
            client.Timeout = TimeSpan.FromSeconds(30);
        });
        return services;
    }
}
```

**Rules:**

- Each layer has its own `DependencyInjection.cs` extension method.
- `AddScoped` for request-scoped services (repositories, BL, handlers).
- `AddSingleton` for stateless utilities and caches.
- `AddTransient` only for very lightweight, stateless services.
- Use `IHttpClientFactory` / `AddHttpClient<>` for all outbound HTTP — never `new HttpClient()`.
- Never call `serviceProvider.GetService<>()` outside of the composition root or `IServiceScopeFactory` workers.

---

## 7. Naming Conventions

| Item         | Convention               | Example                         |
| ------------ | ------------------------ | ------------------------------- |
| Command      | `PascalCase` + `Command` | `SearchHotelsCommand`           |
| Query        | `PascalCase` + `Query`   | `GetHotelDetailsQuery`          |
| Handler      | same name + `Handler`    | `SearchHotelsCommandHandler`    |
| Interface    | `I` prefix               | `IHotelsBL`, `IHotelRepository` |
| DTO          | `PascalCase` + `Dto`     | `HotelResultDto`                |
| Worker       | `PascalCase` + `Worker`  | `HotelSupplierWorker`           |
| DI extension | `Add` + `Layer/Module`   | `AddHotelInfrastructure()`      |

---

## 8. Common Pitfalls

- **Do not inject `DbContext` directly into handlers** — use a repository interface.
- **Do not use `.Result` or `.Wait()`** on Tasks — always `await`.
- **Worker scope leak**: if you forget `CreateScope()` in a worker, scoped services become effectively singletons and share state across requests.
- **Result unwrapping without checking**: always check `result.IsSuccess` before `.Value`.
- **HttpClient lifetime**: registering `HttpClient` as transient (not via `AddHttpClient`) causes socket exhaustion.
