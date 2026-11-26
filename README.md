# AuraPay Merchant Payments Portal (Nepal Standard Edition)

A production-grade, enterprise-ready merchant onboarding, underwriting, and payments risk management portal built with **Angular 20+**, **Standalone Components**, **Signals**, **RxJS**, **Reactive Forms**, and **Vitest + Angular TestBed**, localized for the **Nepalese Financial & Payments Ecosystem** 

---

##  Fintech & Regulatory Localization

| Domain / Dimension | US Standard (Previous) | Nepalese Standard (Active) | Compliance & Regulatory Authority |
| :--- | :--- | :--- | :--- |
| **Tax Identification** | IRS EIN (`XX-XXXXXXX`) | **Permanent Account Number (PAN)** (9-digit numeric `601234567`) | Inland Revenue Department (IRD) |
| **Principal / KYC** | Social Security Number (SSN) | **Citizenship Certificate No.** / National ID (NID) | Ministry of Home Affairs / NRB FIU GoAML |
| **Business Entities** | LLC, C-Corp, S-Corp | **Private Limited (Pvt. Ltd.)**, **Public Limited**, **Partnership**, **Sole Prop** | Office of the Company Registrar (OCR) |
| **Interbank Clearing** | US Federal Reserve ACH Routing | **NCHL-IPS / connectIPS Clearing Member Routing** (9-digit weighted checksum) | Nepal Clearing House Limited (NCHL) |
| **Settlement Banking** | US Checking / Savings | **NRB-Licensed Commercial Banks (Class A)**: Nabil, Global IME, NIC Asia, NIMB | Nepal Rastra Bank (NRB) |
| **Currency** | USD ($) | **Nepalese Rupee (NPR / रू)** | Central Bank of Nepal |
| **Regulatory Law** | FinCEN CDD Rule | **Payment Systems Directives** & **Electronic Transactions Act 2063** | NRB Payment Systems Department (PSD) |

---

## 🚀 Key Highlights & Architecture

- **Angular Material Design**: Comprehensive Material Design UI integration across all pages with `@angular/material` and `@angular/cdk` (Material Toolbar, Cards, Form Fields, Inputs, Selects, Checkboxes, Slide Toggles, Buttons, Icons, Menus, Chips, and Progress Bars).
- **Angular 20+ Modern Paradigm**: Standalone components throughout, built-in control flow (`@if`, `@for`, `@switch`), constructor dependency injection via `inject()`, and hybrid **Signals + RxJS** architecture.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across **SALES**, **REVIEWER**, and **ADMIN** roles with route guards (`authGuard`, `permissionGuard`, `roleGuard`) and dynamic permission-aware UI rendering.
- **Concurrent 401 Unauthorized Interceptor**: Token refresh mutex using `BehaviorSubject` and `switchMap` preventing duplicate `POST /auth/refresh` calls when multiple requests receive 401 simultaneously.
- **Streamlined 4-Step Wizard**: Reactive forms with custom field-level validators:
  1. **9-Digit IRD PAN** (`MerchantValidators.pan()`)
  2. **Citizenship Certificate Number / NID** (`MerchantValidators.citizenship()`)
  3. **NCHL Interbank Weighted Checksum** (`MerchantValidators.nchlRouting()`)
  4. **Cross-Field Ticket Size Validation** (`highTicketSize >= averageTicketSize`)
- **Draft & Auto-Save Engine**: Debounced background persistence via RxJS (`debounceTime(1200)`, `distinctUntilChanged`, `switchMap`) with non-destructive error recovery that never wipes in-memory form state.
- **Sensitive Data Masking & Role Reveals**: Default masking of Citizenship numbers, PANs, and commercial bank accounts with audit logging and 30-second security auto-remasking timers.
- **Content Security Policy (CSP) & Defense-in-Depth**: Client-side `<meta>` policy and architecture modal explaining PCI-DSS v4.0 Requirement 6.4.3 & 11.6.1 and NRB PSD guidelines.
- **Vitest + Angular TestBed**: 11 test suites and 62 passing unit tests executing in ~1.2 seconds.

---

## 👥 User Roles & Personas Matrix

| Capability / Permission | SALES (Aayush Shrestha) | REVIEWER (Pradeep Adhikari) | ADMIN (Binod Sharma) | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| **Create Merchant Application** | ✅ | ❌ | ✅ | Route Guard (`permissionGuard`) & `@if` in Navbar/Dashboard |
| **Edit Application Draft** | Permitted Only | ❌ | ✅ | `canEditApplication()` check (status must be DRAFT or INFO_REQUESTED) |
| **View Permitted Applications** | Own / Assigned | All | All | Server-side filter & `canAccessApplication()` security check |
| **Underwriting & Risk Decisions** | ❌ (Strictly Hidden) | ✅ | ✅ | Hidden from DOM via `@if (authService.hasPermission('CAN_RECORD_RISK_DECISION'))` |
| **Manage Reviewer Assignments** | ❌ | ❌ | ✅ | Controlled by `CAN_MANAGE_ASSIGNMENTS` permission |
| **Reveal Masked PII / Banking Numbers** | ❌ (Access Denied) | ✅ (30s timer) | ✅ (30s timer) | `SensitiveRevealComponent` with audit logging |

> **Interactive Persona Switcher**: Use the user profile dropdown in the top-right navbar to switch between **Aayush Shrestha (SALES)**, **Pradeep Adhikari (REVIEWER)**, and **Binod Sharma (ADMIN)** to evaluate all role-specific permissions live in real-time.

---

## 🔒 HTTP 401 Concurrent Refresh Mutex Flow

```
[Request 1 (401)] ──> [Acquires Mutex Lock] ──> [Dispatches single POST /auth/refresh]
[Request 2 (401)] ──> [Lock is Active]      ──> [Waits on refreshTokenSubject]
[Request 3 (401)] ──> [Lock is Active]      ──> [Waits on refreshTokenSubject]

                      [POST /auth/refresh Returns 200 OK with New Access Token]
                                            │
                                            ▼
               [Emits fresh token into refreshTokenSubject.next(token)]
                                            │
      ┌─────────────────────────────────────┼─────────────────────────────────────┐
      ▼                                     ▼                                     ▼
[Request 1 Retried]                   [Request 2 Retried]                   [Request 3 Retried]
(Bearer fresh-token)                  (Bearer fresh-token)                  (Bearer fresh-token)
```

Test this live under **Security & 401 Mutex** (`/security-sandbox`) using the **"Fire 5 Concurrent 401 Requests"** runner.

---

## 🧪 Running Tests & Build

```bash
# Run Vitest test suite with Angular TestBed (62 tests)
npm test

# Production build
npm run build

# Start local development server
npm start
```
