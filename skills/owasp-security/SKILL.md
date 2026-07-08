---
name: owasp-security
description: "OWASP Top 10 security review checklist for C# (.NET) and Angular code. Use during every code review to catch injection, XSS, broken auth, sensitive data exposure, and other critical vulnerabilities."
argument-hint: "Describe the code being reviewed (language, layer, what it does)"
---

# OWASP Security — Code Review Checklist

Apply this checklist during every code review. Flag any issue found with its OWASP category, severity (Critical / High / Medium / Low), and the exact code location.

---

## A01 — Broken Access Control

### C# / ASP.NET Core

- [ ] Every controller action that touches user data has `[Authorize]` or an explicit policy check.
- [ ] Tenant/user ID comes from **claims** (`User.GetTenantId()`, `User.GetUserId()`) — never from the request body or query string.
- [ ] No IDOR: verify that the requested resource belongs to the authenticated user before returning it.
- [ ] Admin-only endpoints have `[Authorize(Roles = "Admin")]` or a policy, not just frontend hiding.
- [ ] CORS policy is restrictive — not `AllowAnyOrigin()` in production configuration.

### Angular

- [ ] Route guards (`canActivate`, `canMatch`) protect authenticated routes.
- [ ] Authorization state is validated server-side — client-side route guards are UX only.

---

## A02 — Cryptographic Failures

- [ ] No secrets, passwords, API keys, or connection strings hard-coded in source files.
- [ ] Sensitive data (passwords, tokens, PII) is not logged — check `ILogger` calls and `Console.Write`.
- [ ] Passwords are hashed with a strong algorithm (bcrypt, Argon2) — never MD5, SHA-1, or plaintext.
- [ ] HTTPS is enforced in production (`UseHsts()`, `UseHttpsRedirection()`).
- [ ] JWT tokens: verify `alg` is not `none`; validate `iss`, `aud`, and expiry.
- [ ] No sensitive data in Angular `localStorage` without encryption.

---

## A03 — Injection

### SQL Injection (C#)

- [ ] **No string concatenation in SQL** — all queries use parameterized commands or an ORM.
- [ ] `AddWithValue` is acceptable; raw string interpolation in SQL is **never** acceptable.
- [ ] Stored procedures receive parameters, not assembled SQL fragments.
- [ ] EF Core: no raw SQL via `FromSqlRaw()` with user-supplied values unless parameterized.

```csharp
// FORBIDDEN
var sql = $"SELECT * FROM Hotels WHERE City = '{request.City}'";

// REQUIRED
cmd.Parameters.AddWithValue("@City", request.City);
// or EF Core parameterized:
dbContext.Hotels.FromSqlRaw("SELECT * FROM Hotels WHERE City = {0}", request.City);
```

### Command / OS Injection

- [ ] No `Process.Start()` or shell execution with user-supplied input.

### Angular / XSS (A03 overlap with A07)

- [ ] No `[innerHTML]` binding with unsanitized user input — use Angular's `DomSanitizer` only when absolutely necessary.
- [ ] No `document.write()`, `eval()`, or `innerHTML` set from user data in TypeScript code.

---

## A04 — Insecure Design

- [ ] Sensitive business operations (booking, payment) are idempotent or protected against replay.
- [ ] Rate limiting or throttling exists on search and auth endpoints.
- [ ] No "security by obscurity" — do not rely solely on hiding endpoint paths.

---

## A05 — Security Misconfiguration

- [ ] `app.UseDeveloperExceptionPage()` is **not** called in production.
- [ ] Error responses do not expose stack traces, internal paths, or connection strings to clients.
- [ ] Unused HTTP methods are disabled on endpoints (`[HttpPost]` not `[HttpGet, HttpPost]` when only POST is needed).
- [ ] HTTP security headers present: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`.
- [ ] `appsettings.Development.json` is not deployed to production.

---

## A06 — Vulnerable and Outdated Components

- [ ] No deprecated NuGet packages with known CVEs (check NuGet audit warnings).
- [ ] No `npm audit` critical/high vulnerabilities in Angular dependencies.
- [ ] External API integrations (Gimmonix, etc.) use TLS 1.2+.

---

## A07 — Identification and Authentication Failures

- [ ] Session tokens / JWT are not exposed in URLs (query parameters).
- [ ] Tokens are stored in `HttpOnly` cookies or in-memory — not in `localStorage` unless the threat model accepts XSS risk.
- [ ] Authentication failures return the same generic message (no "user not found" vs "wrong password" enumeration).
- [ ] Multi-tenant: tenant isolation is enforced at the data layer, not only in the controller.

---

## A08 — Software and Data Integrity Failures

- [ ] Deserialization of untrusted data does not use `BinaryFormatter` or `JavaScriptSerializer` with type resolution.
- [ ] `JsonSerializerOptions` does not have `PolymorphicTypeDiscriminator` open to arbitrary types.
- [ ] Angular: `ng build --prod` is used — no development builds deployed.

---

## A09 — Security Logging and Monitoring Failures

- [ ] Authentication success and failure events are logged with timestamp and user ID.
- [ ] High-value operations (booking, payment, admin actions) are logged with actor identity.
- [ ] Logs do **not** contain passwords, full card numbers, or tokens.
- [ ] Log output is structured (not free-form strings) to allow alerting.

---

## A10 — Server-Side Request Forgery (SSRF)

- [ ] Any endpoint that fetches a URL supplied by the client validates the URL against an allowlist.
- [ ] Internal service URLs (Gimmonix endpoint, Azure Service Bus) are not user-configurable at runtime.
- [ ] HTTP redirects from external APIs are not blindly followed when fetching internal resources.

---

## Severity Scale

| Severity     | Definition                                                                             |
| ------------ | -------------------------------------------------------------------------------------- |
| **Critical** | Exploitable with no authentication; direct data exfiltration, RCE, or full auth bypass |
| **High**     | Requires some access but leads to significant data loss or privilege escalation        |
| **Medium**   | Limited impact or requires unusual conditions to exploit                               |
| **Low**      | Defense-in-depth gap; no direct exploitability in current context                      |

---

## Review Output Format

For each issue found, report:

```
[OWASP A0X] <Short title>
Severity: Critical | High | Medium | Low
File: <path/to/file.cs or component.ts>
Line: <approximate line or method name>
Issue: <what is wrong>
Fix: <what should be done instead>
```

If no issues are found, explicitly state: `No OWASP Top 10 issues detected.`
